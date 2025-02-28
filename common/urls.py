from django.urls import path
from . import views
app_name = "common"


urlpatterns = [
    # path
    path('index', views.index, name = 'index')
]