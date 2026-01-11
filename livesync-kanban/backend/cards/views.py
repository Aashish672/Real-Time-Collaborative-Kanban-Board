from django.db import transaction
from django.db.models import F
from rest_framework import viewsets, permissions, status
from boards.permissions import IsBoardMember
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Card, Comment
from .serializers import CardSerializer, CommentSerializer
from activity.utils import log_activity

# Create your views here.

class CardViewSet(viewsets.ModelViewSet):
    queryset = Card.objects.all()
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticated, IsBoardMember]

    def perform_create(self, serializer):
        card = serializer.save()
        log_activity(self.request.user, f"created card '{card.title}'", card)

    def perform_update(self, serializer):
        card = serializer.save()
        log_activity(self.request.user, f"updated card '{card.title}'", card)

    def perform_destroy(self, instance):
        log_activity(self.request.user, f"deleted card '{instance.title}'", instance.parent_list.board) # Log to board as card is gone
        instance.delete()

    def get_queryset(self):
        return self.queryset.filter(parent_list__board__members__user=self.request.user)

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        card = self.get_object()
        new_list_id = request.data.get('list_id')
        new_position = request.data.get('position')

        if new_position is None:
            return Response({"error": "Position is required"}, status=status.HTTP_400_BAD_REQUEST)

        old_list = card.parent_list
        old_position = card.position

        with transaction.atomic():
            if new_list_id and int(new_list_id) != old_list.id:
                # 1. Handle Cross-List Move
                # Shift cards in old list up (close the gap)
                Card.objects.filter(
                    parent_list=old_list, 
                    position__gt=old_position
                ).update(position=F('position') - 1)

                # Shift cards in new list down (make space)
                Card.objects.filter(
                    parent_list_id=new_list_id, 
                    position__gte=new_position
                ).update(position=F('position') + 1)

                card.parent_list_id = new_list_id
                card.position = new_position
            else:
                # 2. Handle Same-List Reorder
                if new_position > old_position:
                    # Moving down: shift intermediary cards up
                    Card.objects.filter(
                        parent_list=old_list,
                        position__gt=old_position,
                        position__lte=new_position
                    ).update(position=F('position') - 1)
                elif new_position < old_position:
                    # Moving up: shift intermediary cards down
                    Card.objects.filter(
                        parent_list=old_list,
                        position__lt=old_position,
                        position__gte=new_position
                    ).update(position=F('position') + 1)
                
                card.position = new_position

            card.save()

        log_activity(request.user, f"moved card '{card.title}'", card)

        return Response({'status': 'card moved', 'new_position': card.position})

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsBoardMember]

    def get_queryset(self):
        # Allow filtering by card_id
        queryset = self.queryset
        card_id = self.request.query_params.get('card_id')
        if card_id:
            queryset = queryset.filter(card_id=card_id)
        # Ensure user has access to the board of the card
        return queryset.filter(card__parent_list__board__members__user=self.request.user)

    def perform_create(self, serializer):
        comment = serializer.save(user=self.request.user)
        log_activity(self.request.user, f"commented on '{comment.card.title}'", comment.card)
