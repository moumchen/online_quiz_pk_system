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
