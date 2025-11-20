import os
import requests


def clarivate_single_api(doi: str):
    """Fetch Clarivate citation count for a DOI."""
    base_url = 'https://api.clarivate.com/apis/wos-starter/v1/documents'
    apikey = os.environ.get('WOS_APIKEY')

    if not apikey:
        return {"error": "Clarivate API key is missing"}

    if not doi:
        return {"error": "DOI is required"}

    params = {'db': 'DRCI', 'q': f"DO={doi}"}

    try:
        response = requests.get(
            base_url,
            headers={'X-Apikey': apikey},
            params=params
        )
        response.raise_for_status()
        rspdict = response.json()

        citations = sum(
            source['count']
            for source in rspdict['hits'][0]['citations']
            if source['db'] in ('WOK', 'PPRN')
        )

        return citations

    except requests.exceptions.RequestException as exc:
        return {
            "error": str(exc),
        }
    except (KeyError, IndexError):
        return {
            "error": "Unexpected response format",
        }
