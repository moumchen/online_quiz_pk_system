from django.shortcuts import render
from .services import user_service


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
    back_url = request.POST.get("back_url")
    user = user_service.auth(username, password)
    if user is not None:
        user_service.login(request, user)
        if back_url != '':
            return render(request, template_name=back_url)
        else:
            return render(request, template_name="index_blank.html")
    else:
        context = {"error": "Login failed, please check your username and password!"}
        return render(request, template_name="common/info.html", context=context)


def logout(request):
    user_service.logout(request)
    return render(request, template_name="index_blank.html")
