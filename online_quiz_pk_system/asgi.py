"""
ASGI config for online_quiz_pk_system project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'online_quiz_pk_system.settings')

application = get_asgi_application()

from online_quiz_pk_system import routing

application = ProtocolTypeRouter({
    "http": application,
    "websocket": URLRouter(
        routing.websocket_urlpatterns # get Websocket URL from routing.py
    ),
})