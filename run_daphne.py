import sys
import os
import django

if __name__ == '__main__':
    # insert here whatever commands you use to run daphne
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "online_quiz_pk_system.settings")

    sys.argv = ['daphne', 'online_quiz_pk_system.asgi:application']
    from daphne.cli import CommandLineInterface
    django.setup()
    CommandLineInterface.entrypoint()
