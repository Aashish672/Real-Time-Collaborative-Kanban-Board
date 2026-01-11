from django.shortcuts import render
from rest_framework import viewsets,permissions
from .models import List
from .serializers import ListSerializer
# Create your views here.

class ListViewSet(viewsets.ModelViewSet):
    queryset=List.objects.all()
    serializer_class=ListSerializer
    permission_classes=[permissions.IsAuthenticated]
    
    def get_queryset(self):
        return self.queryset.filter(owner=self.request.user)