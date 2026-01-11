from django.shortcuts import render
from rest_framework import viewsets,permissions
from .models import Board
from .serializers import BoardSerializer
# Create your views here.

class BoardViewSet(viewsets.ModelViewSet):
    queryset=Board.objects.all()
    serializer_class=BoardSerializer
    permission_classes=[permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_queryset(self):
        return self.queryset.filter(owner=self.request.user).prefetch_related('lists__cards')
