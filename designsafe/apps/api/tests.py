from django.test import TestCase, RequestFactory
from django.conf import settings
from django.contrib.auth import get_user_model

from designsafe.apps.projects.models.agave.experimental import (
    ExperimentalProject,
    ModelConfig,
    FileModel,
)

# from agavepy.agave import Agave
import mock
import json

import logging
import pytest

pytestmark = pytest.mark.django_db

logger = logging.getLogger(__name__)


# Create your tests here.
class ProjectDataModelsTestCase(TestCase):
    fixtures = ["user-data.json", "auth.json"]

    def setUp(self):
        user = get_user_model().objects.get(pk=2)
        user.set_password("password")
        user.save()
        self.user = user
        with open("designsafe/apps/api/fixtures/agave-model-config-meta.json") as f:
            model_config_meta = json.load(f)
        self.model_config_meta = model_config_meta

        with open("designsafe/apps/api/fixtures/agave-file-meta.json") as f:
            file_meta = json.load(f)
        self.file_meta = file_meta

        with open("designsafe/apps/api/fixtures/agave-experiment-meta.json") as f:
            experiment_meta = json.load(f)
        self.experiment_meta = experiment_meta

        with open("designsafe/apps/api/fixtures/agave-project-meta.json") as f:
            project_meta = json.load(f)
        self.project_meta = project_meta


class InitExperimentalModels(ProjectDataModelsTestCase):
    def test_init_experimental_project(self):
        """Test initializing ExperimentalProject"""
        # logger.debug('project_meta: %s',
        #             json.dumps(self.project_meta, indent=4))
        exp = ExperimentalProject(**self.project_meta)
        # logger.debug('experiment dict: %s',
        #             json.dumps(exp.to_body_dict(), indent=4))


class InitModelConfigurationModel(ProjectDataModelsTestCase):
    def test_init_model_configuration(self):
        """Test initializing ModelConfiguration"""
        # logger.debug('model_config_meta: %s',
        #             json.dumps(self.model_config_meta, indent=4))
        model_config = ModelConfig(**self.model_config_meta)
        # logger.debug('model_config dict: %s',
        #             json.dumps(model_config.to_body_dict(), indent=4))


class InitFileModel(ProjectDataModelsTestCase):
    def test_init_file_model(self):
        """Test initializing File Model"""
        # logger.debug('file meta: %s',
        #             json.dumps(self.file_meta, indent=4))
        file_meta = FileModel(**self.file_meta)
        # logger.debug('dict: %s', file_meta._meta._reverse_fields)
        # file_meta.modelconfiguration_set()
        # logger.debug('file meta dict: %s',
        #             json.dumps(file_meta.to_body_dict(), indent=4))
