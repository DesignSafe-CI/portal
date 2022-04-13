# DesignSafe Authentication App

Authentication app for DesignSafe. Provides backends, middlewares, and views necesary to
support the various authentication requirements of DesignSafe.

## Backends

### TASBackend

Authenticate directly against TACC's TAS Identity Store. This backend is used when
authenticating directly to the Django Admin app. An OAuth token will not be obtained when
using this backend, so using Agave/DesignSafe API features will not work.

### TapisOAuthBackend

Authenticate using Tapis OAuth Webflow (authorization code). See the [Tapis Authentication Docs][1]
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

[1]: https://tapis.readthedocs.io/en/latest/technical/authentication.html#authorization-code-grant-generating-tokens-for-users