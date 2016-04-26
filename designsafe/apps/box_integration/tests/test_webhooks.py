# from django.test import TestCase
# from django.http import QueryDict
# import mock
#
#
# class BoxWebhookTestCase(TestCase):
#     fixtures = ['user-data.json', 'box-user-token.json', 'box-event-stream-position.json']
#
#     @mock.patch('designsafe.apps.box_integration.tasks.handle_box_webhook_event.apply_async')
#     def test_box_webhook(self, m_handle_box_webhook_event_task):
#         """
#         Ensure the webhook processes webhook posts from Box.com as expected. Notably, the
#         `to_user_ids` parameter handled oddly because the list is decoded in the QueryDict
#         as a single string and must then be post-processed into a list of strings.
#
#         Args:
#             m_handle_box_webhook_event_task: mock for handle_box_webhook_event Celery task
#         """
#         post_body = 'event_type=uploaded&item_id=55555512345&' \
#                     'item_name=all_of_the_data.tar.gz&item_extension=gz&item_type=file&' \
#                     'item_parent_folder_id=55555500001&from_user_id=100000000&' \
#                     'to_user_ids=%5B%22100000000%22%5D'
#
#         self.client.generic('POST', '/webhooks/box/', data=post_body,
#                             content_type='application/x-www-form-urlencoded')
#
#         event_data = QueryDict(mutable=True)
#         event_data['event_type'] = u'uploaded'
#         event_data['item_id'] = u'55555512345'
#         event_data['item_name'] = u'all_of_the_data.tar.gz'
#         event_data['item_extension'] = u'gz'
#         event_data['item_type'] = u'file'
#         event_data['item_parent_folder_id'] = u'55555500001'
#         event_data['from_user_id'] = u'100000000'
#         event_data['to_user_ids'] = [u'100000000']
#
#         m_handle_box_webhook_event_task.assert_called_with(args=(event_data,))
