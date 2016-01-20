# DesignSafe Authentication App

Authentication app for DesignSafe. Provides backends, middlewares, and views necesary to
support the various authentication requirements of DesignSafe.

## Backends

### TASBackend

Authenticate directly against TACC's TAS Identity Store. This backend is used when
authenticating directly to the Django Admin app. An OAuth token will not be obtained when
using this backend, so using Agave/DesignSafe API features will not work.

### AgaveOAuthBackend

Authenticate using Agave OAuth Webflow (authorization code). See the [Agave Authentication Docs][1]
for complete documentation.

#### AgaveTokenRefreshMiddleware

OAuth tokens obtained from Agave are valid for a limited time, usually one hour (3600s).
The app can automatically refresh the OAuth token as necessary. Add the refresh middleware
in `settings.py`. The middleware *must* appear after
`django.contrib.sessions.middleware.SessionMiddleware`:

```
MIDDLEWARE_CLASSES = (
  ...,
  'django.contrib.sessions.middleware.SessionMiddleware',
  designsafe.apps.auth.middleware.AgaveTokenRefreshMiddleware,
  ...,
)
```

[1]: http://agaveapi.co/documentation/authorization-guide/#authorization_code_flow