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

class Label(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='labels')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7) # Hex code e.g. #FF0000

    def __str__(self):
        return self.name

class BoardMember(models.Model):
    ROLE_CHOICES = [
        ('OWNER', 'Owner'),
        ('MEMBER', 'Member'),
    ]
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='board_memberships')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='MEMBER')
    
    class Meta:
        unique_together = ['board', 'user']

    def __str__(self):
        return f"{self.user.username} - {self.board.name} ({self.role})"