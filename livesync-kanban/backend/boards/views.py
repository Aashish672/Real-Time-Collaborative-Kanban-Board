from django.shortcuts import render
from rest_framework import viewsets, permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import BoardSerializer, BoardMemberSerializer, UserRegistrationSerializer
from cards.serializers import LabelSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Board, BoardMember, Label
from .permissions import IsBoardOwner, IsBoardMember
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
# Create your views here.

class BoardViewSet(viewsets.ModelViewSet):
    queryset = Board.objects.all()
    serializer_class = BoardSerializer
    permission_classes = [IsBoardMember] # Default permission

    def get_queryset(self):
        # Return boards where user is owner OR has a membership
        return Board.objects.filter(members__user=self.request.user)

    def perform_create(self, serializer):
        board = serializer.save(owner=self.request.user)
        # Automatically add creator as OWNER
        BoardMember.objects.create(board=board, user=self.request.user, role='OWNER')

    def get_permissions(self):
        if self.action in ['destroy', 'update', 'partial_update', 'invite_member', 'remove_member']:
            return [IsAuthenticated(), IsBoardOwner()]
        return [IsAuthenticated(), IsBoardMember()]

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        board = self.get_object()
        members = BoardMember.objects.filter(board=board)
        serializer = BoardMemberSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def invite_member(self, request, pk=None):
        board = self.get_object()
        username = request.data.get('username')
        user = get_object_or_404(User, username=username)
        
        if BoardMember.objects.filter(board=board, user=user).exists():
            return Response({'error': 'User is already a member'}, status=400)
            
        BoardMember.objects.create(board=board, user=user, role='MEMBER')
        return Response({'status': 'User invited'})

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        board = self.get_object()
        user_id = request.data.get('user_id')
        member = get_object_or_404(BoardMember, board=board, user_id=user_id)
        
        # Prevent removing self if owner (to avoid orphaned boards, though logic could be more complex)
        if member.user == board.owner:
             return Response({'error': 'Cannot remove owner'}, status=400)

        member.delete()
        return Response({'status': 'Member removed'})

class LabelViewSet(viewsets.ModelViewSet):
    # Only allow board members to see/edit labels
    serializer_class = LabelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return labels for boards the user is a member of
        return Label.objects.filter(board__members__user=self.request.user)

    def perform_create(self, serializer):
        # TODO: Check permission (is member of the board?)
        # Serializer validation will check if board exists.
        # Ideally check if request.user is member of serializer.validated_data['board']
        serializer.save()

class RegisterView(generics.CreateAPIView):
    queryset=User.objects.all()
    serializer_class=UserRegistrationSerializer
    permission_classes=[AllowAny]

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "date_joined": user.date_joined,
            "boards_count": Board.objects.filter(members__user=user).count(),
            "owned_boards_count": Board.objects.filter(owner=user).count(),
        })
