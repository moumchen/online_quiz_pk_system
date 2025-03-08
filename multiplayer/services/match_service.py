import json
import logging

from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from django.core.cache import cache

from common.models import QuizQuestion, UserQuizRecord
from multiplayer.models import Match, Room

logger = logging.getLogger(__name__)

channel_layer = get_channel_layer()

MATCH_CHANNEL_PREFIX = "match_"  # match channel name prefix
USER_MATCH_CHANNEL_PREFIX = "user_match_"
QUESTION_CACHE_PREFIX = "match_questions_"
USER_QUESTION_CACHE_PREFIX = "user_questions_send_"
MATCH_FINISHED_PREFIX = "match_finished_"


async def handle_disconnect(consumer, user):
    """ handle disconnect """
    user_match_cache_key = USER_MATCH_CHANNEL_PREFIX + str(user.id)
    match_id = cache.get(user_match_cache_key)

    if match_id:
        match_chanel_name = MATCH_CHANNEL_PREFIX + str(match_id)
        await channel_layer.group_send(
            match_chanel_name,
            {"type": "information", "sub_type": "user_left", "user_id": user.id,
             "message": f"User {user.username} disconnected during match."}
        )


async def join_in_the_match(consumer, user, match_id):
    """ user joins in the match """
    match_channel_name = MATCH_CHANNEL_PREFIX + str(match_id)
    await channel_layer.group_add(match_channel_name, consumer.channel_name)

    #  cache information about the user and match_id
    cache.set(USER_MATCH_CHANNEL_PREFIX + str(user.id), match_id)

    message_payload = {"type": "information", "sub_type": "user_joined", "user_id": user.id, "username": user.username,
                       "message": f"User {user.username} joined the match."}
    print(f"准备广播 user_joined 消息到 group: {match_channel_name}, 消息内容: {message_payload}")  # 添加日志

    #  notify other users in the match
    await channel_layer.group_send(
        match_channel_name,
        {"type": "information", "sub_type": "user_joined", "user_id": user.id, "username": user.username,
         "message": f"User {user.username} joined the match."}
    )
    print(f"已广播 user_joined 消息到 group: {match_channel_name}")  # 添加日志


async def generate_question(question):
    question_result = {'id': question.id, 'title': question.question_text, 'option_a': question.option_a,
                       'option_b': question.option_b, 'option_c': question.option_c, 'option_d': question.option_d}
    return question_result


async def start_match_game(consumer, user, match_id):
    """ start the match game """
    match = await database_sync_to_async(Match.objects.get)(id=match_id)
    room = await database_sync_to_async(Room.objects.get)(id=match.room_id)

    questions = cache.get(QUESTION_CACHE_PREFIX + str(match_id))
    if not questions:
        questions = await database_sync_to_async(list)(
            QuizQuestion.objects.filter(generation_id=room.question_batch_no).order_by('id'))
        cache.set(QUESTION_CACHE_PREFIX + str(match_id), questions)

    #  send the first question and cache the questions that already send

    question = questions[0]
    send_questions = [question.id]
    cache.set(USER_QUESTION_CACHE_PREFIX + str(user.id), send_questions)

    send_question = await generate_question(question)
    await channel_layer.group_send(
        MATCH_CHANNEL_PREFIX + str(match_id),
        {"type": "information", "sub_type": "question_info", 'user_id': user.id, "question": send_question}
    )


async def handle_time_over(consumer, user, match_id):
    """ handle the time over """
    # put the user into the finished user list
    finished_users = cache.get(MATCH_FINISHED_PREFIX + str(match_id))
    if not finished_users:
        finished_users = [user.id]
        cache.delete(USER_QUESTION_CACHE_PREFIX + str(user.id))
    elif user.id not in finished_users:
        finished_users.append(user.id)

    cache.set(MATCH_FINISHED_PREFIX + str(match_id), finished_users)

    if len(finished_users) == 2:
        #  notify the user that the match is over
        await channel_layer.group_send(
            MATCH_CHANNEL_PREFIX + str(match_id),
            {"type": "information", "sub_type": "all_finish_game", "message": "The match is over."}
        )
        # clear the cache
        cache.delete(MATCH_FINISHED_PREFIX + str(match_id))
        cache.delete(USER_QUESTION_CACHE_PREFIX + str(user.id))
        cache.delete(QUESTION_CACHE_PREFIX + str(match_id))


async def handle_answer(consumer, user, match_id, answer_data):
    """ handle the answer """
    choice = answer_data['choice']
    question_id = answer_data['question_id']
    used_time = answer_data['used_time']

    questions = cache.get(QUESTION_CACHE_PREFIX + str(match_id))
    current_question = None
    for question in questions:
        if question.id == question_id:
            current_question = question
            break

    # save the answer
    await database_sync_to_async(UserQuizRecord.objects.create)(
        user=user,
        question=current_question,
        generation_id=current_question.generation_id,
        selected_answer=choice,
        is_correct=current_question.correct_answer == choice,
        response_time=int(used_time)
    )
    # notify the user the information of user_completion_add
    await channel_layer.group_send(
        MATCH_CHANNEL_PREFIX + str(match_id),
        {"type": "information", "sub_type": "user_completion_add", "question_id": question_id, 'user_id': user.id,
         'username': user.username})

    # judge whether there is other questions
    user_questions_cache_key = USER_QUESTION_CACHE_PREFIX + str(user.id)
    send_questions = cache.get(user_questions_cache_key)
    next_question = None
    for question in questions:
        if question.id not in send_questions:
            next_question = question
            break
    if next_question:
        #  send the next question
        send_question = await generate_question(next_question)
        await channel_layer.group_send(
            MATCH_CHANNEL_PREFIX + str(match_id),
            {"type": "information", "sub_type": "question_info", 'user_id': user.id, "question": send_question}
        )
        # cache the questions that already send
        send_questions.append(next_question.id)
        cache.set(user_questions_cache_key, send_questions)
    else:
        #  notify the user that the match is over
        await channel_layer.group_send(
            MATCH_CHANNEL_PREFIX + str(match_id),
            {"type": "information", "sub_type": "you_finish_game", 'user_id': user.id, "message": "The match is over."}
        )
        # judge whether all the users have finished the game
        finished_users = cache.get(MATCH_FINISHED_PREFIX + str(match_id))
        if not finished_users:
            finished_users = [user.id]
            cache.set(MATCH_FINISHED_PREFIX + str(match_id), finished_users)
            cache.delete(USER_QUESTION_CACHE_PREFIX + str(user.id))
        else:
            finished_users.append(user.id)
            if len(finished_users) == 2:
                #  notify the user that the match is over
                await channel_layer.group_send(
                    MATCH_CHANNEL_PREFIX + str(match_id),
                    {"type": "information", "sub_type": "all_finish_game", "message": "The match is over."}
                )
            # delete related cache
            cache.delete(MATCH_FINISHED_PREFIX + str(match_id))
            cache.delete(USER_QUESTION_CACHE_PREFIX + str(user.id))
            cache.delete(QUESTION_CACHE_PREFIX + str(match_id))


async def handle_message(consumer, user, text_data):
    """ 处理 MatchConsumer 收到的消息 """
    data_json = json.loads(text_data)
    message_type = data_json['message_type']
    match_id = data_json['match_id']

    print(f"Match Service handle_message: {text_data}")

    if message_type == 'join_in_the_match':
        await join_in_the_match(consumer, user, match_id)
    elif message_type == 'start_game':
        await start_match_game(consumer, user, match_id)
    elif message_type == 'answer':
        await handle_answer(consumer, user, match_id, data_json)
    elif message_type == 'time_over':
        await handle_time_over(consumer, user, match_id)


def get_report_detail(user, match_id):
    match = Match.objects.get(pk=match_id)
    questions = list(QuizQuestion.objects.filter(generation_id=match.question_batch_no))
    records = list(UserQuizRecord.objects.filter(user_id=user.id, generation_id=match.question_batch_no))
    context = {}
    context['report_title'] = "Match Report"
    context['total_questions'] = len(questions)
    context['correct_answers'] = sum([1 for record in records if record.is_correct])
    context['total_response_time'] = sum([record.response_time for record in records])
    details = []
    for record in records:
        detail = {'question_text': record.question.question_text, 'selected_answer': record.selected_answer,
                  'is_correct': record.is_correct, 'response_time': record.response_time,
                  'option_a': record.question.option_a, 'option_b': record.question.option_b,
                  'option_c': record.question.option_c, 'option_d': record.question.option_d,
                  'correct_answer': record.question.correct_answer,
                  'correct_answer_explanation': record.question.correct_answer_explanation}
        details.append(detail)

    context['report_data'] = details
    return context
