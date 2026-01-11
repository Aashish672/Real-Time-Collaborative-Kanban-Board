from rest_framework import serializers
from .models import Card, Comment
from boards.models import Label

from django.contrib.auth import get_user_model

User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class CommentSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'card', 'user', 'content', 'created_at']
        read_only_fields = ['user', 'card']

class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ['id', 'board', 'name', 'color']

class CardSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, read_only=True)
    assigned_to = UserMiniSerializer(read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='assigned_to', write_only=True, required=False, allow_null=True
    )
    labels = LabelSerializer(many=True, read_only=True)
    label_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Label.objects.all(), source='labels', write_only=True, required=False
    )

    class Meta:
        model = Card
        fields = ['id', 'title', 'description', 'parent_list', 'position', 'created_at', 'updated_at', 'comments', 'assigned_to', 'assigned_to_id', 'labels', 'label_ids', 'due_date']
