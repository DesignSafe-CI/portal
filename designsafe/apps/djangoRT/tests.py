import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_index(client, authenticated_user):
    """
    For authenticated users, the default/index view redirects to the mytickets view.
    """
    resp = client.get(reverse("djangoRT:index"))
    assert resp.status_code == 302
    assert resp.url == reverse("djangoRT:mytickets")


@pytest.mark.django_db
def test_mytickets_none(client, authenticated_user, requests_mock):
    requests_mock.post("/REST/1.0/", text="RT/4.2.1 200 Ok")
    with open("designsafe/apps/djangoRT/fixtures/user_tickets_resp.txt") as f:
        requests_mock.get("/REST/1.0/search/ticket?format=l", text=f.read())

    resp = client.get(reverse("djangoRT:mytickets"))
    assert "No tickets to display!" in resp.content.decode()


@pytest.mark.django_db
def test_mytickets_resolved(client, authenticated_user, requests_mock):
    requests_mock.post("/REST/1.0/", text="RT/4.2.1 200 Ok")
    with open("designsafe/apps/djangoRT/fixtures/user_tickets_resolved_resp.txt") as f:
        requests_mock.get("/REST/1.0/search/ticket?format=l", text=f.read())

    resp = client.get(reverse("djangoRT:mytickets") + "?show_resolved=1")
    assert "No tickets to display!" not in resp.content.decode()


@pytest.mark.django_db
def test_detail(client, authenticated_user, requests_mock):
    requests_mock.post("/REST/1.0/", text="RT/4.2.1 200 Ok")
    ticket_id = 29152
    with open("designsafe/apps/djangoRT/fixtures/ticket_detail.txt") as f:
        requests_mock.get(f"/REST/1.0/ticket/{ticket_id}/show", text=f.read())
    with open("designsafe/apps/djangoRT/fixtures/ticket_history.txt") as f:
        requests_mock.get(f"/REST/1.0/ticket/{ticket_id}/history", text=f.read())

    resp = client.get(reverse("djangoRT:ticketdetail", args=[ticket_id]))
    assert "Test Post, Please Ignore" in resp.content.decode()


@pytest.mark.django_db
def test_create(client, authenticated_user):
    resp = client.get(reverse("djangoRT:ticketcreate"))
    assert "Captcha" not in resp.content.decode()


@pytest.mark.django_db
def test_create_with_error_context(client, authenticated_user):
    query = "error_page=/page/that/failed&http_referer=https://www.google.com"
    resp = client.get(reverse("djangoRT:ticketcreate") + "?" + query)

    assert "Captcha" not in resp.content.decode()
    assert (
        '<input type="hidden" name="error_page" value="/page/that/failed" id="id_error_page">'
        in resp.content.decode()
    )
    assert (
        '<input type="hidden" name="http_referer" value="https://www.google.com" id="id_http_referer">'
        in resp.content.decode()
    )


@pytest.mark.django_db
def test_reply(client, authenticated_user, requests_mock):
    requests_mock.post("/REST/1.0/", text="RT/4.2.1 200 Ok")
    ticket_id = 29152
    with open("designsafe/apps/djangoRT/fixtures/ticket_detail.txt") as f:
        requests_mock.get(f"/REST/1.0/ticket/{ticket_id}/show", text=f.read())

    resp = client.get(reverse("djangoRT:ticketreply", args=[ticket_id]))
    assert f"Reply to #{ticket_id}" in resp.content.decode()


@pytest.mark.django_db
def test_reopen(client, authenticated_user, requests_mock):
    requests_mock.post("/REST/1.0/", text="RT/4.2.1 200 Ok")
    ticket_id = 29152
    with open("designsafe/apps/djangoRT/fixtures/ticket_detail_resolved.txt") as f:
        requests_mock.get(f"/REST/1.0/ticket/{ticket_id}/show", text=f.read())

    resp = client.get(reverse("djangoRT:ticketreply", args=[ticket_id]))
    assert f"Reopen #{ticket_id}" in resp.content.decode()


@pytest.mark.django_db
def test_close(client, authenticated_user, requests_mock):
    requests_mock.post("/REST/1.0/", text="RT/4.2.1 200 Ok")
    ticket_id = 29152
    with open("designsafe/apps/djangoRT/fixtures/ticket_detail.txt") as f:
        requests_mock.get(f"/REST/1.0/ticket/{ticket_id}/show", text=f.read())

    resp = client.get(reverse("djangoRT:ticketclose", args=[ticket_id]))
    assert f"Close #{ticket_id}" in resp.content.decode()
