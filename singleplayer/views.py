import json
from itertools import count

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from singleplayer.services import single_service
from common.models import UserQuizRecord, QuizQuestion


# Create your views here.
@login_required(login_url="/common/index?action=login")
def index(request):
    return render(request, template_name="singleplayer/index.html")


def battle(request):
    print(request.user.username)
    quiz_id = request.GET.get("quiz_id")
    # 通过quiz_id获取数据库数据
    questions = single_service.get_all_questions(quiz_id)
    context = {'questions': questions}
    return render(request, template_name="singleplayer/battle.html", context=context)


def report(request):
    return render(request, template_name="common/report-detail.html")


@csrf_exempt
def save_quiz_records(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        records = data['records']

        for record in records:
            UserQuizRecord.objects.create(
                user_id=request.user.id,
                is_correct=record['is_correct'],
                question_id=record['question_id'],
                generation_id=record['generation_id'],
                selected_answer=record['selected_answer'],
                response_time=record['response_time']
            )

        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'}, status=400)


def report(request):
    generation_id = request.GET.get('generation_id')

    question_records = UserQuizRecord.objects.filter(generation_id=generation_id)

    total_questions = question_records.count()

    correct_answers = question_records.filter(is_correct=True).count()

    total_response_time = sum(record.response_time for record in question_records)

    print(list(question_records))

    report_data = []
    for record in question_records:
        report_data.append({
            'question_text': record.question.question_text,
            'option_a': record.question.option_a,
            'option_b': record.question.option_b,
            'option_c': record.question.option_c,
            'option_d': record.question.option_d,
            'correct_answer': record.question.correct_answer,
            'correct_answer_explanation': record.question.correct_answer_explanation,
            'selected_answer': record.selected_answer,
            'is_correct': record.is_correct,
            'response_time': record.response_time,
        })

    context = {
        'report_data': report_data,
        'total_questions': total_questions,
        'correct_answers': correct_answers,
        'total_response_time': total_response_time,
    }
    return render(request, template_name="common/report-detail.html", context=context)


def report_list(request):
    all_records = UserQuizRecord.objects.all().order_by('created_at')
    seen_generation_ids = set()
    unique_records = []
    for record in all_records:
        if record.generation_id not in seen_generation_ids:
            unique_records.append(record)
            seen_generation_ids.add(record.generation_id)


    context = {'records': unique_records}
    return render(request, template_name="common/report-list.html", context=context)
