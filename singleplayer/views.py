from django.contrib.auth.decorators import login_required
from django.shortcuts import render


# Create your views here.
@login_required(login_url="/common/index?action=login")
def index(request):
    return render(request, template_name="singleplayer/index.html")