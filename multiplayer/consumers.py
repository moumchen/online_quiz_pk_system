import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
from django.http import parse_cookie

from multiplayer.services import room_service
from multiplayer.services import match_service


class RoomConsumer(AsyncWebsocketConsumer):
    """
        This class is used to handle the WebSocket connection for the room.
    """
    async def connect(self):
        # judge whether the current user is valid
        user = await self.get_user_from_cookies(self.scope)
        self.scope['user'] = user

        if user.is_authenticated:
            print(f"WebSocket connected for user (Session): {user.username}")
            await self.accept()
        else:
            print("WebSocket connection rejected (Session): Authentication failed")
            await self.close()

    async def disconnect(self, close_code):
        print("WebSocket disconnected, user: " + self.scope['user'].username)
        await room_service.handle_disconnect(self, self.scope['user'])

    async def receive(self, text_data):
        print("received message: " + text_data)
        await room_service.handle_message(self, self.scope['user'], text_data)

    async def send_message(self, event):  # send message to customer
        print("send message: " + str(event))
        # Send message to WebSocket
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def get_user_from_cookies(self, scope):
        headers = scope.get('headers', [])
        cookie_header = None
        for header_name, header_value in headers:
            if header_name == b'cookie':
                cookie_header = header_value.decode('utf-8')
                break

        cookies = {}
        if cookie_header:
            cookies = parse_cookie(cookie_header)

        session_id = cookies.get('sessionid')

        if not session_id:
            print("ERROR: Cookies did not contain a session id")
            return

        try:
            session = Session.objects.get(session_key=session_id)
            session_data = session.get_decoded()
            user_id = session_data.get('_auth_user_id')
            user = User.objects.get(pk=user_id)  # 获取 User 对象
            return user
        except Exception as e:
            print(e)
            return

    async def information(self, event):
        await self.send_message(event)

    async def error(self, event):
        await self.send_message(event)




class MatchConsumer(AsyncWebsocketConsumer):
    """
        This class is used to handle the WebSocket connection for the match.
    """
    async def connect(self):
        # judge whether the current user is valid
        user = await self.get_user_from_cookies(self.scope)
        self.scope['user'] = user

        if user.is_authenticated:
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        await match_service.handle_disconnect(self.scope['user'])

    async def receive(self, text_data):
        await match_service.handle_message(self, self.scope['user'], text_data)

    async def send_message(self, event):  # send message to customer
        # Send message to WebSocket
        print("send message: " + str(event))  # 保留 print 日志
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def get_user_from_cookies(self, scope):
        headers = scope.get('headers', [])
        cookie_header = None
        for header_name, header_value in headers:
            if header_name == b'cookie':
                cookie_header = header_value.decode('utf-8')
                break

        cookies = {}
        if cookie_header:
            cookies = parse_cookie(cookie_header)

        session_id = cookies.get('sessionid')

        if not session_id:
            return

        try:
            session = Session.objects.get(session_key=session_id)
            session_data = session.get_decoded()
            user_id = session_data.get('_auth_user_id')
            user = User.objects.get(pk=user_id)  # 获取 User 对象
            return user
        except Exception as e:
            print(e)
            return

    async def information(self, event):
        await self.send_message(event)

    async def error(self, event):
        await self.send_message(event)
