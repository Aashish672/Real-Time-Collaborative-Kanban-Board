from rest_framework import permissions
from .models import BoardMember

class IsBoardOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of the board to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        # However, for this specific permission, we want stricter control.
        # But commonly we check ownership for dangerous actions (DELETE, UPDATE).
        
        # Check if user is the explicit owner on the Board model
        if obj.owner == request.user:
            return True
            
        # Check if user is an OWNER in BoardMember
        return BoardMember.objects.filter(
            board=obj, 
            user=request.user, 
            role='OWNER'
        ).exists()

class IsBoardMember(permissions.BasePermission):
    """
    Custom permission to allow board members to view and edit content.
    """
    def has_object_permission(self, request, view, obj):
        # Determine the board object depending on what view we are in.
        # For BoardViewSet, obj is the board itself.
        # For List/Card ViewSets, obj might be a List or Card, so we access .board or .parent_list.board
        
        board = obj
        if hasattr(obj, 'board'):
            board = obj.board
        elif hasattr(obj, 'parent_list'):
            board = obj.parent_list.board
            
        # Check if user is owner or has a membership
        if board.owner == request.user:
            return True
            
        return BoardMember.objects.filter(board=board, user=request.user).exists()
