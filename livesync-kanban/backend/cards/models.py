from django.db import models

# Create your models here.
from lists.models import List

class Card(models.Model):
    title=models.CharField(max_length=255)
    description=models.TextField(blank=True)
    parent_list=models.ForeignKey(List,on_delete=models.CASCADE,related_name='cards')
    position=models.PositiveIntegerField()
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    class Meta:
        ordering=['position']
        #unique_together = ['parent_list', 'position']
    def __str__(self):
        return self.title