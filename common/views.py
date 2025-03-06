from django.http import JsonResponse
from django.shortcuts import render, redirect
from .services import user_service
from .services import quiz_generation_service  # 导入 service
from django.views.decorators.csrf import csrf_exempt
import json


# Create your views here.

def index(request):
    return render(request, template_name='homepage.html')


def register(request):
    username = request.POST.get("username")
    password = request.POST.get("password")
    email = request.POST.get("email")
    result = user_service.register(username, password, email)
    if result:
        context = {"info": "Register successfully! "}
        return render(request, template_name='common/info.html', context=context)
    else:
        context = {"error": "Register failed, please try again!"}
        return render(request, template_name="common/info.html", context=context)


def login(request):
    username = request.POST.get("username")
    password = request.POST.get("password")
    next_url = request.POST.get("next_url")
    user = user_service.auth(username, password)
    if user is not None:
        user_service.login(request, user)
        if next_url != '':
            return redirect(next_url)
        else:
            return render(request, template_name="homepage.html")
    else:
        context = {"error": "Login failed, please check your username and password!"}
        return render(request, template_name="common/info.html", context=context)


def logout(request):
    user_service.logout(request)
    return render(request, template_name="homepage.html")


def check_username(request):
    checked_username = request.GET.get("checked_username")
    response_data = user_service.check_username(checked_username)
    return JsonResponse(response_data)


@csrf_exempt  # If you don't have other CSRF protection mechanisms, add this decorator
def generate_quiz_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)  # Parse JSON data
            topic = data.get('topic')
            difficulty = data.get('difficulty')
            num_questions = data.get('num_questions')
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid JSON data'
            }, status=400)  # Return 400 Bad Request

        # Check if parameters are missing
        if not all([topic, difficulty, num_questions]):
            return JsonResponse({
                'status': 'error',
                'message': 'Missing parameters: topic, difficulty, num_questions'
            }, status=400)  # Return 400 Bad Request

        try:
            num_questions = int(num_questions)
        except ValueError:
            return JsonResponse({
                'status': 'error',
                'message': 'num_questions must be an integer'
            }, status=400)  # Return 400 Bad Request

        # Ensure num_questions is a positive integer
        if not isinstance(num_questions, int) or num_questions <= 0:
            return JsonResponse({
                'status': 'error',
                'message': 'num_questions must be a positive integer'
            }, status=400)  # Return 400 Bad Request

        # Call service to get question data
        result = quiz_generation_service.generate_quiz_questions(topic, difficulty, num_questions)

        if result and isinstance(result, dict) and 'generation_id' in result:
            # Generation successful, return generation_id
            return JsonResponse({
                'status': 'success',
                'message': 'Questions generated successfully',
                'generation_id': result['generation_id']  # Return the generation_id
            }, json_dumps_params={'ensure_ascii': False})  # Ensure Chinese characters are displayed correctly
        else:
            # Generation failed, return error message
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to generate questions',
                'error': result  # Return error message (if the service returned an error message)
            }, json_dumps_params={'ensure_ascii': False})
    else:
        return JsonResponse({
            'status': 'error',
            'message': 'Only POST requests are supported'
        }, status=405)  # Return 405 Method Not Allowed


def requirement(request):
    type = request.GET.get("type")
    context = {'quiz_type': type}
    return render(request, template_name=f"common/requirement.html", context=context)
