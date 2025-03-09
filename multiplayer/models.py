from django.contrib.auth.models import User
from django.db import models
from common.models import QuizQuestion


# Create your models here.
class Room(models.Model):
    question_batch_no = models.CharField(max_length=120, verbose_name="")
    time_limit = models.IntegerField(verbose_name="time limit, in seconds")
    permission = models.IntegerField(verbose_name="permission(0-private, 1-public)")
    state = models.IntegerField(verbose_name="state(0-preparing, 1-playing, 2-closed, 3-owner-disconnected)")
    owner = models.ForeignKey(User, verbose_name="owner", on_delete=models.CASCADE)
    created_time = models.DateTimeField(auto_now_add=True)
    updated_time = models.DateTimeField(auto_now=True)
    invite_code = models.CharField(max_length=10, verbose_name="invite code")



class Match(models.Model):
    question_batch_no = models.CharField(max_length=120, verbose_name="")
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    created_time = models.DateTimeField(auto_now_add=True)
    updated_time = models.DateTimeField(auto_now=True)
    winner_id = models.IntegerField(max_length=10, verbose_name="winner id", default=0)
    owner_id = models.IntegerField(max_length=10, verbose_name="owner id", default=0)
    opponent_id = models.IntegerField(max_length=10, verbose_name="opponent id",default=0)


class MatchAnswerDetails(models.Model):
    question = models.ForeignKey(QuizQuestion, verbose_name="question", on_delete=models.CASCADE)
    responder = models.ForeignKey(User, on_delete=models.CASCADE)
    time_used = models.IntegerField(verbose_name="time used, in seconds")
    is_correct = models.SmallIntegerField(verbose_name="correct(0-no,1-yes)")
    created_time = models.DateTimeField(auto_now_add=True)
    updated_time = models.DateTimeField(auto_now=True)
    match = models.ForeignKey(Match, on_delete=models.CASCADE)
    choice = models.CharField(max_length=10, verbose_name="choice")

    class Meta:
        verbose_name = "Match Answer Details"
