from django.core.cache import cache

from ..models import Config
from ..exceptions import ConfigNotFoundError

def get_cached_config_by_key(key):
    """ Get the cached config by key """
    config = cache.get(key)
    if config:
        return config
    return get_config_by_key(key)

def get_config_by_key(key):
    """ Get the config by key """
    config = Config.objects.filter(key__exact=key).first()
    if not config:
        raise ConfigNotFoundError(key)
    return config