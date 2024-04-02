import pytest
import json
from designsafe.apps.api.datafiles.models import (
    DataFilesSurveyResult,
    DataFilesSurveyCounter,
)


@pytest.mark.django_db
def test_survey_post(client, regular_user):

    client.post(
        "/api/datafiles/microsurvey/",
        data=json.dumps(
            {
                "projectId": "PRJ-1234",
                "comments": "",
                "reasons": '["reason1", "reason2"]',
                "professionalLevel": "student",
                "didCollect": True,
            }
        ),
        content_type="application/json",
    )

    # assert response.status_code == 200

    result = DataFilesSurveyResult.objects.all()[0]

    assert result.project_id == "PRJ-1234"
    assert result.comments == ""
    assert json.loads(result.reasons) == ["reason1", "reason2"]
    assert result.professional_level == "student"
    assert result.did_collect == True
    assert result.created


@pytest.mark.django_db
def test_survey_put_show(client, regular_user):
    counter = DataFilesSurveyCounter(count=-1)
    counter.save()
    response = client.put("/api/datafiles/microsurvey/")

    assert response.json() == {"show": True}

    db_counter = DataFilesSurveyCounter.objects.all()[0]
    assert db_counter.count == 0


@pytest.mark.django_db
def test_survey_put_skip(client, regular_user):
    counter = DataFilesSurveyCounter(count=0)
    counter.save()
    response = client.put("/api/datafiles/microsurvey/")

    assert response.json() == {"show": False}

    db_counter = DataFilesSurveyCounter.objects.all()[0]
    assert db_counter.count == 1
