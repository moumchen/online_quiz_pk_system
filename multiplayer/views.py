from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.

def index(request):
    name = request.GET.get("name")
    return HttpResponse("hello, welcome to system!" + name)