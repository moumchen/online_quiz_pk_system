from django.urls import path
from . import views

app_name = "singleplayer"

urlpatterns = [
    path('index', views.index, name='singleplayer_index'),
    path('battle', views.battle, name='singleplayer_battle'),
    path('save_quiz_records', views.save_quiz_records),
    path('report', views.report),
]
