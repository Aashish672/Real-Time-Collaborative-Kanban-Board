from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

# Create your models here.
from lists.models import List
from boards.models import Label

class Card(models.Model):
    title=models.CharField(max_length=255)
    description=models.TextField(blank=True)
    parent_list=models.ForeignKey(List,on_delete=models.CASCADE,related_name='cards')
    position=models.PositiveIntegerField()
    
    # New Fields
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_cards')
    labels = models.ManyToManyField(Label, related_name='cards', blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    class Meta:
        ordering=['position']
        #unique_together = ['parent_list', 'position']
    def __str__(self):
        return self.title

class Comment(models.Model):
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='card_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} on {self.card.title}"
    
    class Meta:
        ordering = ['created_at']