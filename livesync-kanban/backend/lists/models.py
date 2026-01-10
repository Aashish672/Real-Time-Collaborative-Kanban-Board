from django.db import models

# Create your models here.
from boards.models import Board

class List(models.Model):
    title=models.CharField(max_length=255)
    board=models.ForeignKey(Board,on_delete=models.CASCADE,related_name='lists')
    position=models.PositiveBigIntegerField()
    created_at=models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering=['position']
        unique_together = ['board', 'position']
    def __str__(self):
        return self.title
    