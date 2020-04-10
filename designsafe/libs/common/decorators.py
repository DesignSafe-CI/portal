import os
import re
import time
import warnings
import functools
import cProfile
import pstats
import inspect
import logging
from django.conf import settings
from django.http import HttpRequest

logger = logging.getLogger(__name__)


def deprecated(func):
    """
    This is a decorator which can be used to mark functions
    as deprecated. It will result in a warning being emitted
    when the function is used.
    """

    @functools.wraps(func)
    def new_func(*args, **kwargs):
        warnings.warn(
            "Call to deprecated function {}.".format(func.__name__),
            category=DeprecationWarning,
            stacklevel=2
        )
        return func(*args, **kwargs)
    return new_func


def profile(func):
    @functools.wraps(func)
    def decorated_function(*args, **kwargs):
        if getattr(settings, 'PORTAL_PROFILE', False):
            prf = cProfile.Profile()
            prf.enable()
            resp = func(*args, **kwargs)
            prf.disable()

            stats_dirpath = os.path.join(os.path.dirname(__file__), '../../../stats')
            spec = inspect.getargspec(func)
            if spec.args and spec.args[0] == 'self':
                _self = args[0]
                clsname = _self.__class__.__name__
                modulename = _self.__module__
                funcname = func.__name__
                filename = '{}.{}.{}'.format(modulename, clsname, funcname)
                request = args[1]
            else:
                modulename = func.__module__
                funcname = func.__name__
                filename = '{}.{}'.format(modulename, funcname)
                request = args[0]

            filename = re.sub(r"[^a-zA-Z0-9\_\-]", "_", filename)

            filepath = os.path.join(stats_dirpath, filename)
            if not os.path.isdir(stats_dirpath):
                os.mkdir(stats_dirpath)

            if os.path.isfile(filepath + '.stats'):
                filename += '_{}'.format(str(time.time()))
                filepath = os.path.join(stats_dirpath, filename)

            filepath_prof = filepath + '.prof'
            filepath_stats = filepath + '.stats'

            prf.dump_stats(filepath_prof)
            with open(filepath_stats, 'w+') as flo:
                if isinstance(request, HttpRequest):
                    flo.write(
                        """Request path: {path}
                        POST: {post}
                        GET: {get}
                        """.format(
                            path=request.path,
                            post=request.POST.dict(),
                            get=request.GET.dict())
                    )
                prfs = pstats.Stats(prf, stream=flo).sort_stats('cumtime')
                prfs.print_stats()
        else:
            resp = func(*args, **kwargs)

        return resp

    return decorated_function
