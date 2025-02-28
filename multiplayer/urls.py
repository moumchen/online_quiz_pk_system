from django.urls import path
from . import views

urlpatterns = [
    # the home page of the multiplayer mode
    path('index', views.index, name='multiplayer_index'),

]