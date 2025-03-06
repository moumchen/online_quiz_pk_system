from django.urls import path
from . import views

app_name = "singleplayer"

urlpatterns = [
    path('index', views.index, name='singleplayer_index'),
]
