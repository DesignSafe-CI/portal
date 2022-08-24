[![Build Status](https://travis-ci.org/DesignSafe-CI/portal.svg?branch=master)](https://travis-ci.org/DesignSafe-CI/portal)
[![codecov](https://codecov.io/gh/DesignSafe-CI/portal/branch/master/graph/badge.svg)](https://codecov.io/gh/DesignSafe-CI/portal)

# DesignSafe-CI Portal

## Prequisites for running the portal application

The DesignSafe-CI Portal can be run using [Docker][1] and [Docker Compose][2]. You will
need both Docker and Docker Compose pre-installed on the system you wish to run the portal
on.

- [Install Docker][3]
- [Install Docker Compose][4]
- [Install Make][12]
- Nodejs 12.x

If you are on a Mac or a Windows machine, the recommended method is to install
[Docker Desktop][5], which will install both Docker and Docker Compose, which is required to run Docker on Mac/Windows hosts.

## First time setup

1. Clone the repo

   ```
   $ git clone https://github.com/DesignSafe-CI/portal.git
   $ cd portal
   ```

2. Configure environment variables

   Make a copy of [designsafe.sample.env](conf/env_files/designsafe.sample.env) and rename it to
   `designsafe.env`. Configure variables as necessary. See
   [designsafe.sample.env](conf/env_files/designsafe.sample.env) for details of configuration.

   Required variables:

   - `DJANGO_DEBUG`: should be set to `True` for development
   - `DJANGO_SECRET`: should be changed for production
   - `TAS_*`: should be set to enable direct access to `django.contrib.admin`
   - `AGAVE_*`: should be set to enable Agave API integration (authentication, etc.)
   - `RT_*`: should be set to enable ticketing

   Make copies of [rabbitmq.sample.env](conf/env_files/rabbitmq.sample.env) and [mysql.sample.env](conf/env_files/mysql.sample.env),
   then rename them to `rabbitmq.env` and `mysql.env`.

   Make copies of [mysql.sample.cnf](conf/mysql.sample.cnf), [redis.sample.conf](conf/redis.sample.conf),
   and [rabbitmq.sample.conf](conf/rabbitmq.sample.conf), then rename them to `mysql.cnf`, `redis.conf`, and `rabbitmq.conf`.

   Make a copy of [external_resource_secrets.sample.py](designsafe/settings/external_resource_secrets.sample.py)
   and rename it to `external_resource_secrets.py`.

3. Build the containers and frontend package

   ```
   $ make build
   ```
   or
   ```
   $ docker-compose -f conf/docker/docker-compose.yml build
   ```

   These lines install the node packages required for DesignSafe,
   and build the frontend package.
   ```
   $ npm ci
   $ npm run build
   ```

   If you are working with the frontend code and want it to automatically update,
   use `npm run dev` rather than `npm run build` to have it build upon saving the file.

4. Start local containers

   ```
   $ make start
   ```
   or
   ```
   $ docker-compose -f ./conf/docker/docker-compose-dev.all.debug.yml up
   ```
   then, in a new tab
   ```
   $ docker exec -it des_django bash
   $ ./manage.py migrate
   $ ./manage.py collectstatic -i demo
   $ ./manage.py createsuperuser
   ```

5. Setup local access to the portal:

   Add a record to your local hosts file for `127.0.0.1 designsafe.dev`
   ```
   sudo vim /etc/hosts
   ```

   Now you can navigate to [designsafe.dev](designsafe.dev) in your browser.

## Next steps

### Installing local CA

Every file needed is in `conf/nginx/certs`.

#### OSX

1. Open mac's Keychain Access
2. File > Import Items
3. Navigate to `$PROJECT/conf/nginx/certificates`
4. Select `ca.pem`
5. Search for designsafe and double click on Designsafe CA
6. Click on Trust and select "Trust Always"
7. Close the window to save.

#### Linux

##### Ubuntu & Debian
1. `$ cd $PROJECT/conf/nginx/certificates`
2. `$ sudo mkdir /usr/local/share/ca-certificates/extra`
3. `$ sudo cp ca.pem /usr/local/share/ca-certificates/extra/designsafeCA.pem`
4. `$ sudo update-ca-certificates`

##### Fedora & CentOS & RHEL
1. `$ sudo dnf install ca-certificates` or </br>`$ sudo yum install ca-certificates`
2. `$ sudo update-ca-trust enable`
3. `$ cd $PROJECT/conf/nginx/certificates`
4. `$ sudo cp ca.pem /usr/share/pki/ca-trust-source/anchors/designsafeCA.pem` or </br>`$ sudo cp ca.pem /etc/pki/ca-trust/source/anchors/designsafeCA.pem`
5. `$ sudo update-ca-trust`

#### Firefox UI

1. Go to preferences
3. Search for Authorities
4. Click on "View Certificates" under "Certificates"
5. On the Certificate Manager go to the "Authorities" tab
6. Click on "Import..."
7. Browse to `$PROJECT/conf/nginx/certificates`
8. Select `ca.pem`

#### Firefox CLI (not tested)

1. `sudo apt-get install libnss3-tools` (or proper package manager)
2. `certutil -A -n "designsafeCA" -t "TCu,Cu,Tu" -i ca.pem -d ${DBDIR}`
3. `$DBDIR` differs from browser to browser for more info:
    Chromium: https://chromium.googlesource.com/chromium/src/+/master/docs/linux_cert_management.md
    Firefox: https://support.mozilla.org/en-US/kb/profiles-where-firefox-stores-user-data?redirectlocale=en-US&redirectslug=Profiles#How_to_find_your_profile

### NOT REQUIRED: Creating Local CA and signed cert

1. Generate RSA-2048 key for CA: `openssl genrsa -des3 -out ca.key 2048` (This file should already be in the repo)
2. Generate root CA certificate: `openssl req -x509 -new -nodes -key ca.key -sha256 -days 365 -out ca.pem` (Root CA cert is valid for 365 days. Keep any form values to "Designsafe CA")
3. Generate RSA-2048 key for local dev site: `openssl genrsa out designsafe.dev.key 2048` (This file should already be in the repo)
4. Generate Cert Request (CSR): `openssql req -new -key -designsafe.dev.key -out designsafe.dev.csr` (Keep any form values to "Designsafe CA")
5. Make sure `designsafe.dev.ext` is correct
6. Generate Cert: `openssl x509 -req -in designsafe.dev.csr -CA ca.pem -CAkey ca.key -CAcreateserial -out designsafe.dev.crt -days 365 -sha256 -extfile designsafe.dev.ext` (Cert is valid for 365 days. Keep default form values defined in .conf file)
7. Files created: `designsafe.dev.key` (site private key), `designsafe.dev.csr` (site certificate signing request), `designsafe.dev.crt` (actual site certificate), `ca.key` (CA private key) and `ca.pem` (CA certificate).

### Re-creating self signed cert

The necessary configuration is already in `conf/nginx/designsafe.dev.conf`.

Run this command to create a self signed cert using the corresponding configuration.

`openssl req -config conf/nginx/designsafe.dev.conf -new -sha256 -newkey rsa:2048 -nodes -keyout conf/nginx/designsafe.dev.key -x509 -days 365 -out designsafe.dev.crt`

## Developing DesignSafe-CI Portal

### Apps

DesignSafe custom apps should be put into `designsafe/apps`. You can then enable them in
the Django `settings.py` with `designsafe.apps.{app_name}`.

### CSS/Styling

See the [DesignSafe Styles Reference][7] for style reference and custom CSS documentation.

### Updating Python dependencies

For simplicity the Dockerfile uses a `requirements.txt` exported from Poetry. To add a new dependency:

1. Run `poetry add $NEW_DEPENDENCY`.
2. Run `poetry export > requirements.txt --dev --without-hashes` in the repository root.
3. Rebuild the dev image with `docker-compose -f conf/docker/docker-compose.yml build`

## Testing

The easiest way to run the tests is from inside a running Docker container. While you can
install all the Python/Django/npm dependencies locally (ideally within a virtualenv), this
is already done in the docker container.

We assume you have the image built or checked out locally and it is called
`des_django`.

### Django tests

Django tests should be written according to standard [Django testing procedures][8].

You can run Django tests with the following command:

```shell
$ docker exec -it des_django pytest designsafe
```

### Frontend tests

Frontend tests are [Jasmine][9] tests executed using the [Karma engine][10]. Testing
guidelines can be found in the [AngularJS Developer Guide on Unit Testing][11].

To run frontend tests, ensure that all scripts and test scripts are configured in
[`karma-conf.js`](karma-conf.js) and then run the command:

```shell
$ npm run test
```

## Development setup

Use `docker-compose` to run the portal in development. The default compose file,
[`docker-compose.yml`](docker-compose.yml) runs the main django server in development
mode with a redis service for websockets support. You can optionally enable the EF sites
for testing.

```shell
$ docker-compose -f conf/docker/docker-compose.yml build
$ docker-compose -f conf/docker/docker-compose-dev.all.debug.yml up
$ npm run dev
```

When using this compose file, your Agave Client should be configured with a `callback_url`
of `http://$DOCKER_HOST_IP:8000/auth/agave/callback/`.

For developing some services, e.g. Box.com integration, https support is required. To
enable an Nginx http proxy run using the [`docker-compose-http.yml`](docker-compose-http.yml)
file. This file configures the same services as the default compose file, but it also sets
up an Nginx proxy secured by a self-signed certificate.

```shell
$ docker-compose -f docker-compose-http.yml build
$ docker-compose -f docker-compose-http.yml up
```

When using this compose file, your Agave Client should be configured with a `callback_url`
of `https://$DOCKER_HOST_IP/auth/agave/callback/`.

### Agave filesystem setup
1. Delete all of the old metadata objects using this command:

  `metadata-list Q '{"name": "designsafe metadata"}' | while read x; do metadata-delete $x; done;`
2. Run `dsapi/agave/tools/bin/walker.py` to create the metadata objects for the existing files in your FS.

  `python portal/dsapi/agave/tools/bin/walker.py <command> <api_server> <token> <systemId> <base_folder>`
  - `base_folder` is your username, if you want to fix everything under your home dir.
  - `command`:
    - `files`: Walk through the files and print their path.
    - `meta`: Walk through the metadata objs in a filesystem-like manner and print their path.
    - `files-fix`: Check if there's a meta obj for every file, if not create the meta obj.
    - `meta-fix`: Check if there's a file for every meta obj, if not delete the meta obj.

## Production setup

Production deployment is managed by ansible. See https://github.com/designsafe-ci/ansible.


[1]: https://docs.docker.com/
[2]: https://docs.docker.com/compose/
[3]: https://docs.docker.com/installation/
[4]: https://docs.docker.com/compose/install/
[5]: https://docs.docker.com/desktop/
[7]: https://github.com/DesignSafe-CI/portal/wiki/CSS-Styles-Reference
[8]: https://docs.djangoproject.com/en/dev/topics/testing/
[9]: http://jasmine.github.io/1.3/introduction.html
[10]: http://karma-runner.github.io/0.12/intro/installation.html
[11]: https://docs.angularjs.org/guide/unit-testing
[12]: https://www.gnu.org/software/make/
