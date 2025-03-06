from django.urls import path
from . import views

app_name = "multiplayer"

urlpatterns = [
    # the home page of the multiplayer mode
    path('index', views.index, name='multiplayer_index'),
    path('room', views.room, name='multiplayer_room'),
    path('recommendation', views.recommendation, name='multiplayer_recommendation'),
    path('report-list', views.report_list, name='multiplayer_report_list'),
    path('report-detail', views.report_detail, name='multiplayer_report_detail'),
    path('battle', views.battle, name='multiplayer_battle'),

]