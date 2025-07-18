# DesignSafe-CI Portal

## Prequisites for running the portal application

The DesignSafe-CI Portal can be run using [Docker][1] and [Docker Compose][2]. You will
need both Docker and Docker Compose pre-installed on the system you wish to run the portal
on.

- [Install Docker][3]
- [Install Docker Compose][4]
- [Install Make][11]
- [Node.js][12] 20.x

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
   - `DJANGO_SECRET_KEY`: should be changed for production
   - `TAS_*`: should be set to enable direct access to `django.contrib.admin`
   - `TAPIS_*`: should be set to enable Tapis API integration (authentication, etc.)
   - `RT_*`: should be set to enable ticketing

   Make a copy of [rabbitmq.sample.env](conf/env_files/rabbitmq.sample.env)
   then rename it to `rabbitmq.env`.

3. Configure ngrok

   a. Install [ngrok](https://ngrok.com/docs/getting-started/), and create an ngrok account.

   b. Copy [conf/env_files/ngrok.sample.env](conf/env_files/ngrok.sample.env) to `conf/env_files/ngrok.env`.

   c. In `conf/env_files/ngrok.env`, set the `NGROK_AUTHTOKEN` and `NGROK_DOMAIN` variables using your authtoken and static ngrok domain found in your [ngrok dashboard](https://dashboard.ngrok.com/).

4. Build the containers and frontend packages

   1. Containers:
      ```sh
      make build-dev
      ```
      or
      ```sh
      docker-compose -f conf/docker/docker-compose-dev.yml build
      ```

   2. Angular Frontend + static assets:
      ```sh
      npm ci
      docker run -v `pwd`:`pwd` -w `pwd` -it node:16  /bin/bash -c "npm run build"
      ```

      **Note:** If you are working with the frontend code and want it to automatically update, use `npm run dev` rather than `npm run build` to have it build upon saving the file.

   3. React Frontend (in another terminal):
      ```sh
      cd client
      npm ci
      npm run start
      ```

5. Start local containers

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
   $ ./manage.py collectstatic --ignore demo --no-input
   $ ./manage.py createsuperuser
   ```

6. Setup local access to the portal:

   Add a record to your local hosts file for `127.0.0.1 designsafe.dev`
   ```
   $ sudo vim /etc/hosts
   ```

7. Login to the Portal in your browser at [designsafe.dev/login](https://designsafe.dev/login).

    _To [login to the CMS admin](designsafe.dev/admin), [set your user as staff or superuser](https://github.com/DesignSafe-CI/portal/wiki/How-to-Set-Your-User-as-Staff-or-Superuser). To access [the workspace](https://designsafe.dev/workspace/) quickly, [bypass the profile edit form](https://github.com/DesignSafe-CI/portal/wiki/How-to-Bypass-Profile-Edit-Form)._

## Next steps

### Installing local CA

Every file needed is in `conf/nginx/certs`.

#### OSX

1. Open mac's Keychain Access
2. File > Import Items
3. Navigate to `$PROJECT/conf/nginx/certificates`
4. Select `designsafe.dev.crt`
5. Search for designsafe and double click on Designsafe.dev
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

1. Generate key and pem for root CA: `openssl req -x509 -sha256 -days 1825 -newkey rsa:2048 -keyout ca.key -out ca.crt` (These files should already be in the repo, and valid for 5 years from time of creation)
2. Generate RSA-2048 key for local dev site and Cert Request (CSR): `openssl req -newkey rsa:2048 -noenc -keyout designsafe.dev.key -out designsafe.dev.csr` (Common name should be `designsafe.dev`)
3. Generate certificate for local dev site: `openssl x509 -signkey designsafe.dev.key -in designsafe.dev.csr -req -days 365 -out designsafe.dev.crt`
5. Make sure `designsafe.dev.ext` is correct
6. Sign Cert with root CA: `openssl x509 -req -CA ca.pem -CAkey ca.key -in designsafe.dev.csr -out designsafe.dev.crt -days 365 -CAcreateserial -extfile designsafe.dev.ext` (Cert is valid for 365 days)
7. Files created: `designsafe.dev.key` (site private key), `designsafe.dev.csr` (site certificate signing request), `designsafe.dev.crt` (actual site certificate), `ca.key` (CA private key) and `ca.pem` (CA certificate).

## Developing DesignSafe-CI Portal

### Apps

DesignSafe custom apps should be put into `designsafe/apps`. You can then enable them in
the Django `settings.py` with `designsafe.apps.{app_name}`.

### CSS/Styling

See the [DesignSafe Styles Reference][7] for style reference and custom CSS documentation.

### Updating Python dependencies

This project uses [Python Poetry](https://python-poetry.org/docs/) to manage dependencies. To add a new dependency:

1. Run `poetry add $NEW_DEPENDENCY`.
2. Rebuild the dev image with `make build-dev`

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
$ docker exec -it des_django pytest -ra designsafe
```

### Frontend tests

Frontend tests are [Vitest][9] tests executed using [Nx][10].

To run frontend tests, run the command:

```shell
$ npm run test
```

## Development setup

Use `docker compose` to run the portal in development. The default compose file,
[`docker-compose.yml`](conf/docker/docker-compose.yml) runs the main django server in development
mode with a redis service for websockets support. You can optionally enable the EF sites
for testing.

```shell
$ make build-dev
$ make start
$ npm run start
$ docker run -v `pwd`:`pwd` -w `pwd` -it node:16  /bin/bash -c "npm run dev"
```

When using this compose file, your Tapis Client should be configured with a `callback_url`
of `http://$DOCKER_HOST_IP:8000/auth/tapis/callback/`.


```shell
$ docker-compose -f docker-compose-http.yml build
$ docker-compose -f docker-compose-http.yml up
```


## Production setup

Production deployment is managed by Camino. See https://github.com/TACC/Camino.


[1]: https://docs.docker.com/
[2]: https://docs.docker.com/compose/
[3]: https://docs.docker.com/installation/
[4]: https://docs.docker.com/compose/install/
[5]: https://docs.docker.com/desktop/
[7]: https://github.com/DesignSafe-CI/portal/wiki/CSS-Styles-Reference
[8]: https://docs.djangoproject.com/en/dev/topics/testing/
[9]: https://vitest.dev/
[10]: https://nx.dev/getting-started/intro
[11]: https://www.gnu.org/software/make/
[12]: https://nodejs.org/
