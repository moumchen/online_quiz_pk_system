
class ConfigNotFoundError(Exception):
    ''' This custom exception will be used when the config is not defined in database '''
    def __init__(self, key, message="Config key not found"):
        self.key = key
        self.message = f"{message}: {key}"
        super().__init__(self.message)

    def __str__(self):
        return self.message


class RoomException(Exception):
    ''' This custom exception will be used when the room is not defined in database '''
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)

    def __str__(self):
        return self.message