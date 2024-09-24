from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse, HttpResponseBadRequest
from django.core.exceptions import PermissionDenied
from django.urls import reverse
from designsafe.apps.djangoRT import rtUtil, forms, rtModels
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.files.base import ContentFile
from django.conf import settings
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.views import BaseApiView
import logging
import mimetypes
import json

logger = logging.getLogger(__name__)


def index(request):
    if request.user.is_authenticated:
        return HttpResponseRedirect(reverse('djangoRT:mytickets'))
    return HttpResponseRedirect(reverse('djangoRT:ticketcreate'))

@login_required
def mytickets(request):
    rt = rtUtil.DjangoRt()
    show_resolved = 'show_resolved' in request.GET
    fmt = request.GET.get('fmt', 'html')

    tickets = rt.getUserTickets(request.user.email, show_resolved=show_resolved)
    context = {
        'tickets': tickets,
        'show_resolved': show_resolved
    }
    if fmt == 'json':
        return JsonResponse(tickets, safe=False)
    else:
        return render(request, 'djangoRT/ticketList.html', context)

@login_required
def ticketdetail(request, ticketId):
    rt = rtUtil.DjangoRt()

    if not rt.hasAccess(ticketId, request.user.email):
        raise PermissionDenied

    ticket = rt.getTicket(ticketId)
    ticket_history = rt.getTicketHistory(ticketId)

    for history in ticket_history:
        # remove bogus "untitled" attachments
        history['Attachments'] = [a for a in history['Attachments'] if not a[1].startswith('untitled (')]

    return render(request, 'djangoRT/ticketDetail.html', {
        'ticket': ticket,
        'ticket_history': ticket_history,
        'ticket_id': ticketId
    })


@login_required
def ticketcreate(request):

    template_name = 'djangoRT/ticketCreate.html'
    if request.user.is_authenticated:
        form_cls = forms.TicketForm
    else:
        form_cls = forms.TicketGuestForm

    if request.method == 'POST':
        form = form_cls(request.POST, request.FILES)

        if form.is_valid():
            requestor_meta = '%s %s <%s>' % (
                form.cleaned_data['first_name'],
                form.cleaned_data['last_name'],
                request.user.email
            )

            meta = (
                ('Opened by', request.user),
                ('Category', dict(settings.TICKET_CATEGORIES)[form.cleaned_data['category']]),
                ('Resource', 'DesignSafe'),
            )
            if form.cleaned_data['error_page'] is not None:
                meta += (
                    ('Error Page', form.cleaned_data['error_page']),
                    ('HTTP Referer', form.cleaned_data['http_referer']),
                )

            header = '\n'.join('[%s] %s' % m for m in meta)
            ticket_body = '%s\n\n%s\n\n---\n%s' % (
                header,
                form.cleaned_data['problem_description'],
                requestor_meta
            )

            ticket = rtModels.Ticket(subject=form.cleaned_data['subject'],
                                     problem_description="\n  ".join(ticket_body.splitlines()),
                                     requestor=request.user.email,
                                     cc=form.cleaned_data.get('cc', ''))

            logger.debug('Creating ticket for user: %s' % form.cleaned_data)

            rt = rtUtil.DjangoRt()
            ticket_id = rt.createTicket(ticket)
            if ticket_id > -1:
                messages.success(request, 'Your ticket has been submitted.')
                if 'attachment' in request.FILES:
                    f = request.FILES['attachment']
                    rt.replyToTicket(
                        ticket_id,
                        files=[(f.name,
                                ContentFile(f.read()), f.content_type)
                    ])

                if request.user.is_authenticated:
                    return HttpResponseRedirect(reverse('djangoRT:ticketdetail',
                                                        args=[ticket_id]))
                else:
                    return HttpResponseRedirect(reverse('djangoRT:ticketcreate'))
            else:
                messages.error(
                    request, 'There was an error creating your ticket. Please try again.')
        else:
            messages.error(request, 'You ticket is missing some information. '
                                    'Please see below for details.')
    else:
        initial_data = {
            'subject': request.GET.get('subject'),
            'category': request.GET.get('category'),
            'problem_description': request.GET.get('problem_description'),
            'error_page': request.GET.get('error_page'),
            'http_referer': request.GET.get('http_referer'),
        }
        if request.user.is_authenticated:
            initial_data['email'] = request.user.email
            initial_data['first_name'] = request.user.first_name
            initial_data['last_name'] = request.user.last_name
        form = form_cls(initial=initial_data)
    return render(request, template_name, {'form': form})

@login_required
def ticketreply(request, ticketId):
    rt = rtUtil.DjangoRt()

    if not rt.hasAccess(ticketId, request.user.email):
        raise PermissionDenied

    ticket = rt.getTicket(ticketId)
    if request.method == 'POST':
        form = forms.ReplyForm(request.POST, request.FILES)

        if form.is_valid():
            reply_text = '[Reply from] {}\n\n{}\n\n---\n{} {} <{}>'.format(
                request.user.username,
                form.cleaned_data['reply'],
                request.user.first_name,
                request.user.last_name,
                request.user.email
            )
            attachments = []
            if 'attachment' in request.FILES:
                attachments.append(
                    (
                       request.FILES['attachment'].name,
                       request.FILES['attachment'],
                       mimetypes.guess_type(request.FILES['attachment'].name),
                    ))
            if rt.replyToTicket(ticketId, text=reply_text, files=attachments):
                return HttpResponseRedirect(reverse('djangoRT:ticketdetail',
                                                    args=[ticketId]))
    else:
        form = forms.ReplyForm()

    return render(request, 'djangoRT/ticketReply.html', {
        'ticket_id': ticketId,
        'ticket': ticket,
        'form': form
    })

@login_required
def ticketclose(request, ticketId):
    rt = rtUtil.DjangoRt()

    if not rt.hasAccess(ticketId, request.user.email):
        raise PermissionDenied

    ticket = rt.getTicket(ticketId)
    data = {}

    if request.method == 'POST':
        form = forms.CloseForm(request.POST)
        if form.is_valid():
            if (rt.commentOnTicket(ticketId, text=form.cleaned_data['reply']) and
                    rt.closeTicket(ticketId)):
                return HttpResponseRedirect(reverse('djangoRT:ticketdetail',
                                                    args=[ticketId]))
    else:
        form = forms.CloseForm(initial=data)
    return render(request, 'djangoRT/ticketClose.html', {
        'ticket_id': ticketId,
        'ticket': ticket,
        'form': form
    })


@login_required
def ticketattachment(request, ticketId, attachmentId):
    title, attachment = rtUtil.DjangoRt().getAttachment(ticketId, attachmentId)
    if attachment['Headers']['Content-Disposition'] == 'inline':
        return render(request, 'djangoRT/attachment.html', {'attachment' : attachment['Content'], 'ticketId' : ticketId, 'title' : title});
    else:
        response = HttpResponse(attachment['Content'], content_type=attachment['Headers']['Content-Type'])
        response['Content-Disposition'] = attachment['Headers']['Content-Disposition']
        return response


class FeedbackView(BaseApiView):
    def post(self, request):
        """Post a feedback response
        """
        rt = rtUtil.DjangoRt(queue=settings.DJANGO_RT['RT_FEEDBACK_QUEUE'])

        data = json.loads(request.body)
        email = request.user.email if request.user.is_authenticated else data['email']
        name = "{} {}".format(request.user.first_name, request.user.last_name) if request.user.is_authenticated else data['name']
        subject = data['subject']
        body = data['body']
        project_id = data['projectId']
        project_title = data['title']

        if subject is None or email is None or body is None:
            return HttpResponseBadRequest()

        requestor_meta = '%s <%s>' % (
            name,
            email
        )

        meta = (
            ('Opened by', request.user.username),
            ('Category', 'Project Feedback'),
            ('Resource', 'DesignSafe'),
            ('Project ID', project_id),
            ('Project Title', project_title),
        )

        header = '\n'.join('[%s] %s' % m for m in meta)

        ticket_body = '%s\n\n%s\n\n---\n%s' % (
            header,
            body,
            requestor_meta
        )

        ticket = rtModels.Ticket(subject=subject,
                                 problem_description="\n  ".join(ticket_body.splitlines()),
                                 requestor=email,
                                 cc='')

        logger.debug('Creating ticket for user: %s' % ticket)

        ticket_id = rt.createTicket(ticket)

        if ticket_id > -1:
            return HttpResponse("OK")
        else:
            return ApiException(status=400, message="There was a problem submittin your ticket.")
