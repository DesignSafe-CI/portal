from designsafe.apps.api.agave import get_service_account_client
import json


def create_or_update_metrics(client, metrics_json):
    meta_query = {'name': 'designsafe.metrics.{}'.format(metrics_json['projectId'])}
    body = {**metrics_json, 'name': 'designsafe.metrics.{}'.format(metrics_json['projectId'])}
    try:
        existing_meta = client.meta.listMetadata(q=json.dumps(meta_query))[0]
        patched_metrics = patch_metrics(existing_meta, metrics_json)
        client.meta.updateMetadata(uuid=existing_meta['uuid'], body=patched_metrics)
    except IndexError:  # No existing record for this publication
        client.meta.addMetadata(body=body)


def ingest_metrics():
    client = get_service_account_client()
    with open('designsafe/libs/metrics/metrics_patch.json') as f:
        data = json.load(f)
        for meta in data:
            create_or_update_metrics(client, meta)


def patch_metrics(existing_meta, metrics_json):
    for doi_metrics in metrics_json['value']:
        try:
            doi_index = next(i for (i, v) in enumerate(existing_meta['value']) if v['doi'] == doi_metrics['doi'])
            for metrics in doi_metrics['metrics']:
                try:
                    metrics_index = next(i \
                        for (i, v) in enumerate(existing_meta['value'][doi_index]['metrics']) \
                            if v['Year'] == metrics['Year'] \
                                and v['Month'] == metrics['Month'])
                    existing_meta['value'][doi_index]['metrics'][metrics_index] = metrics
                except StopIteration:
                    existing_meta['value'][doi_index]['metrics'] += [metrics]
        except StopIteration:
            existing_meta['value'] += [doi_metrics]
    return existing_meta
