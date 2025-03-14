from django.urls import path
from . import views

# make sure there won't be any conflict
app_name = "common"

urlpatterns = [
    # path
    path('index', views.index, name = 'index'),
    path('register', views.register, name = 'register'),
    path('login', views.login, name = 'login'),
    path('logout', views.logout, name = 'logout'),
    path('checkUsername', views.check_username, name='check_username' ),
    path('generate_quiz', views.generate_quiz_view, name='generate_quiz'),
    path('requirement', views.requirement, name='requirement'),
]