from django.urls import re_path

from multiplayer import consumers

websocket_urlpatterns = [
    re_path(r'ws/room/$', consumers.RoomConsumer.as_asgi()),
    re_path(r'ws/match/$', consumers.MatchConsumer.as_asgi()),
]
