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
    generation_id = models.CharField(max_length=255, verbose_name="Generation Batch ID",
                                     help_text="Identifies the batch of AI-generated questions")
    category = models.CharField(max_length=255, verbose_name="Question Category")
    difficulty = models.CharField(max_length=50, verbose_name="Question Difficulty")
    question_text = models.TextField(verbose_name="Question Text")
    option_a = models.CharField(max_length=255, verbose_name="Option A")
    option_b = models.CharField(max_length=255, verbose_name="Option B")
    option_c = models.CharField(max_length=255, verbose_name="Option C")
    option_d = models.CharField(max_length=255, verbose_name="Option D")
    correct_answer = models.CharField(max_length=10, verbose_name="Correct Answer")
    correct_answer_explanation = models.TextField(verbose_name="Correct Answer Explanation", blank=True, null=True,
                                                  help_text="Explanation of why the correct answer is correct")  # Added field
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")

    class Meta:
        verbose_name = "Quiz Question"
        verbose_name_plural = "Quiz Questions"

    def __str__(self):
        return self.question_text
