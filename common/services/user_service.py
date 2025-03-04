from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout

def register(username, password, email):
    user = User.objects.create_user(username, email, password)
    user.save()
    return True


def auth(username, password):
    user = authenticate(username=username, password=password)
    return user

