from ..models import Config
from ..exceptions import ConfigNotFoundError

def get_cached_config_by_key(key):
    config = Config.objects.filter(key__exact=key).first()
    if config is None:
        raise ConfigNotFoundError(key)
    return config