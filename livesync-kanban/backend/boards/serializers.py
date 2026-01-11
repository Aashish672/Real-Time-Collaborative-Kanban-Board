from rest_framework import serializers
from .models import Board
from lists.serializers import ListSerializer
class BoardSerializer(serializers.ModelSerializer):
    lists = ListSerializer(many=True, read_only=True)
    
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    class Meta:
        model = Board
        fields = ['id', 'name', 'owner', 'owner_username', 'lists', 'created_at']
        read_only_fields = ['owner']