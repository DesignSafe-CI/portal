class BaseAgaveResource(object):
    """
    Base Class that all Agave API Resource objects inherit from.
    """

    def __init__(self, agave_client):
        """
        :param agave_client: agavepy.Agave instance this model will use
        """
        self._agave = agave_client

    def from_result(self, **kwargs):
        raise NotImplementedError("Subclasses should implement this method")
