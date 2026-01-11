from django.shortcuts import render
from rest_framework import viewsets,permissions
from boards.permissions import IsBoardMember
from .models import List
from .serializers import ListSerializer
# Create your views here.

class ListViewSet(viewsets.ModelViewSet):
    queryset=List.objects.all()
    serializer_class=ListSerializer
    permission_classes = [permissions.IsAuthenticated, IsBoardMember]
    
    def get_queryset(self):
        return self.queryset.filter(board__members__user=self.request.user)