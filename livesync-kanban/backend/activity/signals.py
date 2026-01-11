from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import ActivityLog
from cards.models import Card, Comment
from lists.models import List

@receiver(post_save, sender=Card)
def log_card_save(sender, instance, created, **kwargs):
    model_name = "Card"
    action = f"{'Created' if created else 'Updated'} card '{instance.title}'"
    
    # We need a user to attribute this to. Signals don't have access to request.user.
    # This is a limitation of implementation via signals for "User".
    # For now, we might leave user null or we need to handle this in ViewSet/Serializer perform_create.
    # However, for automatic logging without user context, it's hard.
    # ALTERNATIVE: Don't use signals. Use ViewSet perform_create/update. 
    # But user asked for "Activity Log". Ideally we track user.
    pass
