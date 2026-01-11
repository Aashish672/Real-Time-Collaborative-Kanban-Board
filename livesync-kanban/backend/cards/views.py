from django.db import transaction
from django.db.models import F
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Card
from .serializers import CardSerializer

# Create your views here.

class CardViewSet(viewsets.ModelViewSet):
    queryset = Card.objects.all()
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(parent_list__board__owner=self.request.user)

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

        return Response({'status': 'card moved', 'new_position': card.position})
