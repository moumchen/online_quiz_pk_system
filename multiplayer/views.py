from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse

from common.exceptions import RoomException
from common.models import QuizQuestion
from multiplayer.models import Room
from multiplayer.services import room_service, match_service
import json


# Create your views here.

@login_required(login_url="/common/index?action=login")
def index(request):
    return render(request, template_name="multiplayer/index.html")


@login_required(login_url="/common/index?action=login")
def create_room(request):
    """ This function is to create a room if we can't find an existing room by quiz-batch-no
        otherwise, return the existing room """
    question_batch_no = request.GET.get("quiz")  # get quiz-generating-id
    if question_batch_no is None or question_batch_no == "":
        return render(request, template_name="common/info.html",
                      context={'error': 'Quiz Parameter Missing, Please try again.'})
    context = {'question_batch_no': question_batch_no}

    try:
        room_service.create_room(request.user, context)
    except RoomException as e:
        return render(request, template_name="common/info.html", context={'error': e})

    return render(request, template_name="multiplayer/room.html", context=context)


@login_required(login_url="/common/index?action=login")
def recommendation(request):
    context = room_service.recommendation()
    return render(request, template_name="multiplayer/recommendation.html", context=context)


def report_list(request):
    return render(request, template_name="common/report-list.html")


def report_detail(request):
    context = match_service.get_report_detail(request.user, request.GET.get("match_id"))
    return render(request, template_name="common/report-detail.html", context=context)


def battle(request):
    room_id = request.GET.get("room_id")
    if room_id is None:
        return render(request, template_name="common/info.html", context={'error': 'Room doesn\'t exist!'})
    try:
        context = room_service.get_match_context(request.user, room_id)
    except RoomException as e:
        return render(request, template_name="common/info.html", context={'error': e})
    except Room.DoesNotExist as e:
        return render(request, template_name="common/info.html", context={'error': "Room doesn't exist!"})

    return render(request, template_name="multiplayer/battle.html", context=context)


@login_required(login_url="/common/index?action=login")
def room(request):
    room_id = request.GET.get("room_id")
    if room_id is None or room_id == "":
        invite_code = request.GET.get("invite_code")
        if invite_code is not None:
            try:
                room_id = room_service.join_room_by_invite_code(invite_code)
            except RoomException as e:
                return render(request, template_name="common/info.html", context={'error': e})

    if room_id is None or room_id == "":
        return render(request, template_name="common/info.html", context={'error': 'Room doesn\'t exist!'})
    try:
        context = room_service.get_room_info(request.user, room_id)
    except RoomException as e:
        return render(request, template_name="common/info.html", context={'error': e})
    except Room.DoesNotExist as e:
        return render(request, template_name="common/info.html", context={'error': "Room doesn't exist!"})

    return render(request, template_name="multiplayer/room.html", context=context)


def missing_params_result(param):
    return {
        'success': False,
        'code': 500,
        'message': 'missing param:' + param,
        'result': None,
    }


def adjust_permission(request):
    data = json.loads(request.body)
    room_id = data.get("room_id")
    target_state = data.get("target_state")
    if room_id is None or room_id == "":
        return missing_params_result("room_id")
    if target_state is None or target_state == "":
        return missing_params_result("target_state")

    response_data = room_service.adjust_permission(request.user, room_id, target_state)
    return JsonResponse(response_data)


def finish_room(request):
    data = json.loads(request.body)
    room_id = data.get("room_id")
    if room_id is None or room_id == "":
        return missing_params_result("room_id")
    try:
        room_service.finish_room(request.user, room_id)
    except RoomException as e:
        return render(request, template_name="common/info.html", context={'error': e})

    return JsonResponse({"success": True, "code": 200, "message": "success"})


def unfinished_room(request):
    room_id = room_service.unfinished_room(request.user)
    return JsonResponse({"code": 200, "success": True, "message": "success", "room_id": room_id})
