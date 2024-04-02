import os
import logging

logger = logging.getLogger(__name__)

def walk_path(system, path):
    path = path.strip('/')
