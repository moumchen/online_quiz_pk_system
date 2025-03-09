from django.urls import path
from . import views

app_name = "multiplayer"

urlpatterns = [
    # the home page of the multiplayer mode
    path('index', views.index, name='multiplayer_index'),
    path('create-room', views.create_room, name='multiplayer_create_room'),
    path('recommendation', views.recommendation, name='multiplayer_recommendation'),
    path('report-list', views.report_list, name='multiplayer_report_list'),
    path('report-detail', views.report_detail, name='multiplayer_report_detail'),
    path('battle', views.battle, name='multiplayer_battle'),
    path('room', views.room, name='multiplayer_room'),
    path('adjust_permission', views.adjust_permission, name='adjust_permission'),
    path('finish-room', views.finish_room, name='multiplayer_finish_room'),
    path('unfinished-room', views.unfinished_room, name='multiplayer_unfinished_room'),
    path('adjust_countdown', views.adjust_countdown, name='multiplayer_adjust_countdown'),
]