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


@csrf_exempt  # 如果你没有其他 CSRF 保护机制，需要添加此装饰器
def generate_quiz_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)  # 解析 JSON 数据
            topic = data.get('topic')
            difficulty = data.get('difficulty')
            num_questions = data.get('num_questions')
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': '无效的 JSON 数据'
            }, status=400)  # 返回 400 Bad Request

        # 检查参数是否缺失
        if not all([topic, difficulty, num_questions]):
            return JsonResponse({
                'status': 'error',
                'message': '缺少参数：topic, difficulty, num_questions'
            }, status=400)  # 返回 400 Bad Request

        try:
            num_questions = int(num_questions)
        except ValueError:
            return JsonResponse({
                'status': 'error',
                'message': 'num_questions 必须是一个整数'
            }, status=400)  # 返回 400 Bad Request

        # 确保 num_questions 是一个正整数
        if not isinstance(num_questions, int) or num_questions <= 0:
            return JsonResponse({
                'status': 'error',
                'message': 'num_questions 必须是一个正整数'
            }, status=400)  # 返回 400 Bad Request

        # 调用 service 获取题目数据
        result = quiz_generation_service.generate_quiz_questions(topic, difficulty, num_questions)

        if result and isinstance(result, dict) and '题目列表' in result:
            # 生成成功，返回题目数据
            return JsonResponse({
                'status': 'success',
                'message': '题目生成成功',
                'data': result['题目列表']  # 返回题目列表
            }, json_dumps_params={'ensure_ascii': False})  # 确保中文正常显示
        else:
            # 生成失败，返回错误信息
            return JsonResponse({
                'status': 'error',
                'message': '题目生成失败',
                'error': result  # 返回错误信息 (如果 service 返回了错误信息)
            }, json_dumps_params={'ensure_ascii': False})
    else:
        return JsonResponse({
            'status': 'error',
            'message': '只支持 POST 请求'
        }, status=405)  # 返回 405 Method Not Allowed



def requirement(request):
    return render(request, template_name="common/requirement.html")