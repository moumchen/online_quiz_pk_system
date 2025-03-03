from ..models import Config

def get_cached_config_by_key(key):
    config = Config.objects.filter(key__exact=key).first()
    if config is None:
        raise RuntimeError("Config doesn't exist")
    return config