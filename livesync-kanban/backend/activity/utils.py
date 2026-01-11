from django.contrib.contenttypes.models import ContentType
from .models import ActivityLog

def log_activity(user, action, target):
    """
    Log an activity for a user.
    """
    if not user.is_authenticated:
        return
        
    content_type = ContentType.objects.get_for_model(target)
    ActivityLog.objects.create(
        user=user,
        action=action,
        content_type=content_type,
        object_id=target.id,
        content_object=target
    )
