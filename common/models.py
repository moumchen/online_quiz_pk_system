from django.db import models


# Create your models here.
class Config(models.Model):
    key = models.CharField(max_length=100, null=False, unique=True)
    value = models.TextField(null=False)
    name = models.CharField(max_length=50, null=False)
    created_time = models.DateTimeField(auto_now_add=True)
    updated_time = models.DateTimeField(auto_now=True)
    comment = models.CharField(max_length=500, null=True, blank=True)

    class Meta:
        verbose_name = "configuration item"
        verbose_name_plural = "configuration item"
        ordering = ['key']

    def __str__(self):
        return f"{self.name} ({self.key})"


class QuizQuestion(models.Model):
    generation_id = models.CharField(max_length=255, verbose_name="生成批次ID", help_text="标识AI生成题目的批次")
    category = models.CharField(max_length=255, verbose_name="题目分类")
    difficulty = models.CharField(max_length=50, verbose_name="题目难度")
    question_text = models.TextField(verbose_name="题目内容")
    option_a = models.CharField(max_length=255, verbose_name="选项A")
    option_b = models.CharField(max_length=255, verbose_name="选项B")
    option_c = models.CharField(max_length=255, verbose_name="选项C")
    option_d = models.CharField(max_length=255, verbose_name="选项D")
    correct_answer = models.CharField(max_length=10, verbose_name="正确答案")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        verbose_name = "题目"
        verbose_name_plural = "题目列表"

    def __str__(self):
        return self.question_text
