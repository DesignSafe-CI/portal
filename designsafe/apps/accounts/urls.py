"""Accounts urls."""
from django.conf.urls import path, re_path
from designsafe.apps.accounts import views

urlpatterns = [
    path('profile/edit/', views.profile_edit, name='profile_edit'),
    path('profile/', views.manage_profile, name='manage_profile'),
    path('professional-profile/edit', views.pro_profile_edit, name='pro_profile_edit'),
    path('professional-profile/', views.manage_pro_profile, name='manage_pro_profile'),
    path('authentication/', views.manage_authentication, name='manage_authentication'),
    path('identities/', views.manage_identities, name='manage_identities'),
    path('licenses/', views.manage_licenses, name='manage_licenses'),
    path('applications/', views.manage_applications, name='manage_applications'),
    path('notifications/settings/', views.manage_notifications, name='manage_notifications'),
    path('register/', views.register, name='register'),
    path('departments.json', views.departments_json, name='departments_json'),
    re_path(r'^nees-account/(?:(?P<step>\d+)/)?$', views.nees_migration, name='nees_migration'),
    re_path(r'^registration-successful/$', views.registration_successful, name='registration_successful'),
    re_path('password-reset/(?:(?P<code>.+)/)?$', views.password_reset, name='password_reset'),
    re_path('activate/(?:(?P<code>.+)/)?$', views.email_confirmation, name='email_confirmation'),

    re_path(r'^mailing-list/(?P<list_name>.*)/$', views.mailing_list_subscription,
            name='mailing_list_subscription'),

    re_path(r'^user-report/(?P<list_name>.*)/$', views.user_report,
            name='user_report'),

    path('terms-conditions/', views.termsandconditions, name="terms_conditions"),
    path('', views.index, name='index'),
]
