from rest_framework import serializers
from .models import Board, BoardMember, Label
from lists.serializers import ListSerializer
from django.contrib.auth.models import User

class BoardMemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = BoardMember
        fields = ['id', 'user', 'username', 'role']


class BoardSerializer(serializers.ModelSerializer):
    lists = ListSerializer(many=True, read_only=True)
    
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    class Meta:
        model = Board
        fields = ['id', 'name', 'owner', 'owner_username', 'lists', 'created_at']
        read_only_fields = ['owner']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password=serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ['username','email', 'password']
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user