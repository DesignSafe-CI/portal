import re
import logging
import json
import requests
from bs4 import BeautifulSoup
from designsafe.apps.api.mixins import SecureMixin
from designsafe.apps.api.views import BaseApiView
from django.http import JsonResponse, HttpResponseBadRequest

logger = logging.getLogger(__name__)

YAMZ_BASE_URL = 'http://www.yamz.net/term/concept='

class YamzBaseView(BaseApiView):
    def get(self, request, term_id):
        res = requests.get(''.join([YAMZ_BASE_URL, term_id]))
        soup = BeautifulSoup(res.text)
        definition_trs = soup.find_all(string=re.compile(r'^\s*Definition\:\s*$'))
        if definition_trs:
            definition = definition_trs[0].findParent('tr').text.encode('utf8').replace('Definition:', '', 1).strip()
        else:
            definition = ''

        examples_trs = soup.find_all(string=re.compile(r'^\s*Examples\:\s*$'))
        if examples_trs:
            examples = examples_trs[0].findParent('tr').text.encode('utf8').replace('Examples:', '', 1).strip()
        else:
            examples = ''

        return JsonResponse({'definition': definition, 'examples': examples})
