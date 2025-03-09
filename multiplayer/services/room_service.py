import string
import random

import logging
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
import json

from django.contrib.auth.models import User
from django.core.cache import cache
from common.exceptions import RoomException
from common.models import QuizQuestion
from multiplayer.models import Room, Match

logger = logging.getLogger(__name__)


def generate_unique_invite_code():
    """ generate a unique invite code """
    while True:
        code = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        if not Room.objects.filter(invite_code=code).exists():
            return code


def create_room(user, context):
    question_batch_no = context["question_batch_no"]
    questions = QuizQuestion.objects.filter(generation_id=question_batch_no).all()
    if questions is None or len(questions) == 0:
        raise RoomException("Question does not exist")

    room = Room.objects.filter(question_batch_no=question_batch_no).first()
    if room is not None:
        # room is exist, judge whether current user is owner.
        if room.owner.id != user.id:
            raise RoomException("Room does exist, and you don't have permission!")
        if room.state in (1, 2):
            raise RoomException("Room has already been finished!")
    else:
        room = Room()
        room.owner = user
        room.question_batch_no = question_batch_no
        room.time_limit = 180
        room.permission = 0
        room.state = 0
        # set invite code, random 8 chars
        room.invite_code = generate_unique_invite_code()
        room.save()

    context["room_id"] = room.id
    context["room_title"] = questions.first().title
    context["room_owner"] = user.username
    context["question"] = len(questions)
    if room.permission == 0:
        context["permission"] = 'private'
    else:
        context["permission"] = 'public'
    if room.state == 3:
        context["room_state"] = 0
        Room.objects.filter(pk=room.id).update(state=0)
    else:
        context["room_state"] = room.state
    context['opponent'] = ''
    context["is_owner"] = 'True'
    context["countdown"] = room.time_limit
    context["invite_code"] = room.invite_code


# -------------------- logical code for websocket below @Yanqian Chen -----------

channel_layer = get_channel_layer()


async def handle_leave_room_request(consumer, user, room_id):
    """ handle leave room request """
    logger.info(f"Received leave room request from user {user.username} in room {room_id}")
    await leave_room_logic(consumer, user, voluntary_leave=True)  #  voluntary leave is a marker that user leave room by himself


async def handle_message(consumer, user, text_data):
    """ this function is to handle the message from websocket """
    data_json = json.loads(text_data)
    message_type = data_json['message_type']
    room_id = data_json['room_id']

    print("handle_message.." + text_data)
    if message_type == 'join_room':
        await join_room(consumer, user, room_id)
    elif message_type == 'start':
        await start_game(consumer, user, room_id)
    elif message_type == 'leave_room_request':
        await handle_leave_room_request(consumer, user, room_id)


async def join_room(consumer, user, room_id):
    """ handle join room request """
    # set a lock to room
    lock_key = "room_lock_" + str(room_id)
    if not cache.add(lock_key, True, timeout=60):
        raise RoomException("Oops, Wait me a while, you click too fast!")

    try:
        room_info_key = "room_info_" + str(room_id)
        room_info = cache.get(room_info_key)
        if room_info is None:
            room = await database_sync_to_async(Room.objects.get)(id=room_id)
            if room is None:
                error_message = "Room does not exist"
                await channel_layer.send(consumer.channel_name,
                                         {"type": "error", "sub_type": "room_not_existing", "message": error_message,
                                          "room_id": room_id})
                return
            if room.state in (1, 2):
                error_message = "Room has already been started or finished"
                await channel_layer.send(consumer.channel_name,
                                         {"type": "error", "sub_type": "room_has_been_finished",
                                          "message": error_message,
                                          "room_id": room_id})
                return
            # build a room cache
            room_info = {"room_id": room_id, "room_player_count": 0, "room_owner": room.owner_id,
                         "room_state": room.state, "room_users": []}
        elif room_info["room_player_count"] >= 2:
            error_message = "Room players reached the maximum number of players"
            await channel_layer.send(consumer.channel_name,
                                     {"type": "error", "sub_type": "limited_players", "message": error_message,
                                      "room_id": room_id})
            return
        elif user.id in room_info["room_users"]:
            error_message = "You are already in the room!"
            print(error_message)
            await channel_layer.send(consumer.channel_name,
                                     {"type": "error", "sub_type": "already_in_room", "message": error_message,
                                      "room_id": room_id})
            return

        # let current consumer add into room layer
        room_channel_name = "room_channel_" + str(room_id)
        await channel_layer.group_add(room_channel_name, consumer.channel_name)
        await channel_layer.group_send(room_channel_name, {"type": "information", "sub_type": "user_joined_room",
                                                           "message": user.username + " joined the room",
                                                           "room_id": room_id, 'joined_user_id': user.id,
                                                           'joined_user_name': user.username})

        room_info["room_player_count"] += 1
        room_info["room_users"].append(user.id)
        cache.set(room_info_key, room_info, timeout=24 * 60 * 60 * 60)

        user_room_cache_key = "user_room_cache_" + str(user.id)
        cache.set(user_room_cache_key, room_id, timeout=24 * 60 * 60 * 60)
        print("---finished---")
    finally:
        cache.delete(lock_key)


async def start_game(consumer, user, room_id):
    #  room_channel_name
    room_channel_name = "room_channel_" + str(room_id)

    # room info cache
    room_info_key = "room_info_" + str(room_id)
    room_info = cache.get(room_info_key)

    if room_info is None:
        await channel_layer.group_send(room_channel_name, {"type": "error", "sub_type": "room_not_existing",
                                                           "message": "room is closed now, please try again!",
                                                           "room_id": room_id})
        return

    if room_info["room_player_count"] < 2:
        await channel_layer.send(consumer.channel_name, {"type": "error", "sub_type": "not_enough_players",
                                                         "message": "Room players are not enough", "room_id": room_id})
        return

    if room_info["room_owner"] != user.id:
        await channel_layer.send(consumer.channel_name, {"type": "error", "sub_type": "not_permission",
                                                         "message": "You don't have the permission to do this!",
                                                         "room_id": room_id})
        return

    # send a message to all users to go to battle page
    await channel_layer.group_send(room_channel_name,
                                   {"type": "information", "sub_type": "start_game", "room_id": room_id,
                                    "target": "/multiplayer/battle?room_id=" + room_id})
    room = await database_sync_to_async(Room.objects.get)(id=room_id)
    room.state = 1  # set room state to playing
    await database_sync_to_async(room.save)()
    # cache room players
    cache.set("room_players_" + room_id, room_info['room_users'], timeout=24 * 60 * 60 * 60)
    # remove the cache of room info
    cache.delete(room_info_key)
    return


async def leave_room_logic(consumer, user, voluntary_leave):
    """ when user leave room, remove user from room layer, if user is owner, send message to all users in room """
    user_room_cache_key = "user_room_cache_" + str(user.id)
    user_room_cache = cache.get(user_room_cache_key)
    if user_room_cache is None:
        logger.warning(f"User {user.username} tried to leave room but no room cache found.")
        return

    room_channel_name = "room_channel_" + str(user_room_cache)
    room_info_key = "room_info_" + str(user_room_cache)
    room_info = cache.get(room_info_key)
    if room_info is None:
        logger.warning(f"User {user.username} tried to leave room {user_room_cache} but no room info cache found.")
        return

    logger.info(
        f"User {user.username} leaving room {user_room_cache}. Voluntary leave: {voluntary_leave}, Owner: {room_info['room_owner']}, User is owner: {room_info['room_owner'] == user.id}")

    if user.id in room_info["room_users"]:
        # let current consumer removed from room
        room_info["room_player_count"] -= 1
        room_info["room_users"].remove(user.id)

        if room_info["room_owner"] == user.id:
            if voluntary_leave:
                # user is owner and voluntary leave, close the room
                await database_sync_to_async(Room.objects.filter(pk=room_info["room_id"]).update)(
                    state=2)  # close the room
                cache.delete(room_info_key)  # delete the cache of room
                await channel_layer.group_send(room_channel_name, {"type": "information", "sub_type": "owner_left_room",
                                                                   "message": "The room owner exited, so this room closed now."})  # notify all users
                logger.info(f"Room owner {user.username} voluntarily left room {user_room_cache}, room closed.")
            else:  # user is owner and non-voluntary leave
                await database_sync_to_async(Room.objects.filter(pk=room_info["room_id"]).update)(state=3)
                cache.set(room_info_key, room_info, timeout=24 * 60 * 60 * 60)  # 更新房间缓存 (状态已修改)
                await channel_layer.group_send(room_channel_name,
                                               {"type": "information", "sub_type": "owner_disconnected",
                                                "message": "Room owner disconnected, room paused, waiting for owner to reconnect."})  # 通知其他用户
                logger.info(
                    f"Room owner {user.username} involuntarily disconnected from room {room_info}, room paused, waiting for reconnect.")
        else:  # user is not owner
            if room_info["room_player_count"] <= 0:
                cache.delete(room_info_key)
            else:
                cache.set(room_info_key, room_info, timeout=24 * 60 * 60 * 60)
            await channel_layer.group_send(room_channel_name, {'type': 'information', 'sub_type': 'user_left_room',
                                                               'message': f'User {user.username} left the room!',
                                                               'room_id': user_room_cache})  # 通知其他用户
            logger.info(f"User {user.username} left room {user_room_cache}.")

    cache.delete(user_room_cache_key)
    logger.info(f"User-room cache for user {user.username} deleted.")
    await channel_layer.group_discard(room_channel_name, consumer.channel_name)
    logger.info(f"User {user.username}'s channel discarded from room {user_room_cache} channel group.")


def join_room_by_invite_code(invite_code):
    room = Room.objects.filter(invite_code=invite_code).first()
    if room is None or room.state in (1, 2):
        raise RoomException("The room has already been started or closed!")

    return room.id


def get_room_by_id(room_id):
    room = Room.objects.get(pk=room_id)
    return room


def get_room_info(user, room_id):
    """ get room info by room id """
    room = get_room_by_id(room_id)
    if room.state in (1, 2):
        raise RoomException("Room has already been started or closed!")

    questions = QuizQuestion.objects.filter(generation_id=room.question_batch_no).all()
    context = {}
    context["room_id"] = room_id
    context["room_title"] = questions.first().title
    context["room_owner"] = room.owner.username
    context["question"] = len(questions)
    if room.permission == 0:
        context["permission"] = 'private'
    else:
        context["permission"] = 'public'
    context["room_state"] = room.state
    context["is_owner"] = room.owner_id == user.id
    context["countdown"] = room.time_limit
    context["invite_code"] = room.invite_code
    context["room_opponent"] = ''

    if room.state == 3 and room.owner_id == user.id:
        context["room_state"] = 0
        Room.objects.filter(pk=room_id).update(state=0)

    room_info_key = "room_info_" + str(room_id)
    room_info = cache.get(room_info_key)
    if room_info is None:
        context["room_users"]: [user.id]
    else:
        room_users = room_info['room_users']
        opponent_user_id = None
        if room_users is not None and len(room_users) > 0:
            if len(room_users) == 1 and room_users[0] == user.id:
                context["room_opponent"] = ''
                context["room_state"] = 0
            elif len(room_users) == 1:
                opponent_user_id = room_users[0]
            else:
                for room_user_id in room_users:
                    if room_user_id != user.id:
                        opponent_user_id = room_user_id
        else:
            context["room_state"] = room_info["room_state"]
            context["room_users"]: [user.id]

        if opponent_user_id is not None:
            opponent = User.objects.get(id=opponent_user_id)
            context["room_opponent"] = opponent.username
            context["room_state"] = 1

    return context


def adjust_permission(user, room_id, target_state):
    room = Room.objects.get(pk=room_id)
    if room.owner_id != user.id:
        raise RoomException("You don't have permission to modify permission!")

    Room.objects.filter(pk=room_id).update(permission=target_state)
    return {
        "code": 200,
        "success": True,
        "message": "success"
    }


async def handle_disconnect(consumer, user):
    """ handle disconnect """
    logger.info(f"WebSocket disconnect detected for user {user.username}, handling as non-voluntary leave.")
    await leave_room_logic(consumer, user, voluntary_leave=False)  #


def unfinished_room(user):
    room = Room.objects.filter(owner_id=user.id, state=3)
    if room.exists():
        return room.first().id
    return 0


def finish_room(user, room_id):
    room = Room.objects.get(pk=room_id)
    if room.owner_id != user.id:
        raise RoomException("You don't have permission to finish the room!")
    room.state = 2
    room.save()
    return True


def recommendation():
    # random 6 public rooms for recommendation
    rooms = Room.objects.filter(permission=1, state=0).order_by('?')[:6]
    if rooms.exists():
        room_classes = ['room1', 'room2', 'room3', 'room4']
        for room in rooms:
            questions = QuizQuestion.objects.filter(generation_id=room.question_batch_no).all()
            room.question = len(questions)
            room.room_title = questions.first().title
            room.room_owner = room.owner.username
            room.class_name = random.choice(room_classes)
        return {"rooms": rooms}
    return {"rooms": []}


def get_match_context(user, room_id):
    room = Room.objects.get(pk=room_id)
    if room.state == 2:
        raise RoomException("Room has already been finished!")

    # get or create a match
    match_count = Match.objects.filter(room_id=room.id).count()
    if match_count == 0:
        match = Match()
        match.room = room
        match.question_batch_no = room.question_batch_no
        match.owner_id = room.owner_id
        match.save()
    else:
        match = Match.objects.filter(room_id=room.id).first()

    if user.id != room.owner_id:
        match.opponent_id = user.id
        match.save()

    # update the room state to 1 (playing)
    room.state = 1
    room.save()

    room_players = cache.get("room_players_" + str(room_id))
    # get the opponent user
    opponent_id = None
    for player_id in room_players:
        if player_id != user.id:
            opponent_id = player_id
            break

    context = {"match_id": match.id, "room_id": room_id, "time_limit": room.time_limit, "current_user_id": user.id,
               "current_username": user.username}
    if opponent_id is not None:
        opponent = User.objects.get(id=opponent_id)
        context["opponent_user_id"] = opponent_id
        context["opponent_username"] = opponent.username

    return context


def adjust_countdown(user, room_id, countdown):
    room = Room.objects.get(pk=room_id)
    if room.owner_id != user.id:
        raise RoomException("You don't have permission to modify countdown!")
    Room.objects.filter(pk=room_id).update(time_limit=countdown)
    return {
        "code": 200,
        "success": True,
        "message": "success"
    }
