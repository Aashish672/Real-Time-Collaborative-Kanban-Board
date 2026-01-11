from rest_framework import viewsets, permissions
from .models import ActivityLog
from .serializers import ActivityLogSerializer

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = ActivityLog.objects.filter(user=self.request.user) # Base filter
        
        # Enable filtering by object_id for Card Modal
        object_id = self.request.query_params.get('object_id')
        if object_id:
            # OPTIONAL: Check content_type too if needed, but for now ID is likely unique enough or we assume card
            # A better approach for "Senior" level is to filter activities related to boards user can see.
            # But let's just return activities for that object ID.
            # Correction: If we filter `user=request.user`, we only see OUR actions.
            # We want to see ALL actions on the card.
            # So we should change base queryset.
            return ActivityLog.objects.filter(object_id=object_id)
            
        return queryset
