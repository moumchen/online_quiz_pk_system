from django.urls import path
from . import views

app_name = "multiplayer"

urlpatterns = [
    # the home page of the multiplayer mode
    path('index', views.index, name='multiplayer_index'),
    path('room', views.room, name='multiplayer_room'),

]