from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.

@login_required(login_url="/common/index?action=login")
def index(request):
    return render(request, template_name="multiplayer/index.html")

def room(request):
    return render(request, template_name="multiplayer/room.html")

def recommendation(request):
    return render(request, template_name="multiplayer/recommendation.html")