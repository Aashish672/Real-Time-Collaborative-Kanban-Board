import json
from channels.generic.websocket import AsyncWebsocketConsumer

class BoardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # 1. Get Board ID from the URL (ws://.../board/5/)
        self.board_id = self.scope['url_route']['kwargs']['board_id']
        self.room_group_name = f'board_{self.board_id}'

        # 2. Join the "Room" (Redis Group)
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # 3. Receive message from WebSocket (Frontend)
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        # Broadcast update to everyone in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'board_update', # Calls the method below
                'message': data
            }
        )

    # 4. Handler to send message down to the client
    async def board_update(self, event):
        message = event['message']
        await self.send(text_data=json.dumps(message))