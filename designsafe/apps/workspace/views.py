"""
.. :module: apps.workspace.views
   :synopsis: Views to handle Workspace
"""
from django.views.generic.base import TemplateView
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.decorators import login_required


@method_decorator(login_required, name="dispatch")
class WorkspaceView(TemplateView):
    """Workspace View"""
    template_name = 'designsafe/apps/workspace/index.html'

    @method_decorator(ensure_csrf_cookie)
    def dispatch(self, request, *args, **kwargs):
        """Overwrite dispatch to ensure csrf cookie"""
        return super(WorkspaceView, self).dispatch(request, *args, **kwargs)
