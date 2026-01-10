from django.db import models

# Create your models here.
from django.conf import settings
User=settings.AUTH_USER_MODEL

class Board(models.Model):
    name=models.CharField(max_length=255)
    owner=models.ForeignKey(User,on_delete=models.CASCADE,related_name='boards')
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name