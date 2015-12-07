# DesignSafe-CI Portal

## Prequisites for running the portal application

The DesignSafe-CI Portal can be run using [Docker][1] and [Docker Compose][2]. You will
need both Docker and Docker Compose pre-installed on the system you wish to run the portal
on.

- [Install Docker][3]
- [Install Docker Compose][4]

If you are on a Mac or a Windows machine, the recommended method is to install
[Docker Toolbox][5], which will install both Docker and Docker Compose as well as Docker
Machine, which is required to run Docker on Mac/Windows hosts.

## First time setup

1. Clone the repo

   ```
   $ git clone https://github.com/DesignSafe-CI/portal.git
   $ cd portal
   ```

2. Build the container(s)

   ```
   $ docker-compose build
   ```

3. Configure environment variables

   Make a copy of [designsafe.env.sample](designsafe.env.sample) and rename it to
   `designsafe.env`. Configure variables as necessary.

3. Set up local/testing database

   ```
   $ docker-compose up -d
   $ docker exec -it portal_django_1 bash
   # ./manage.py migrate
   # ./manage.py createsuperuser
   ```

4. Open in browser

   Navigate to [http://localhost:8000](http://localhost:8000) in your browser.

   **Note:** On Mac/Windows hosts running Docker Machine you will need to navigate
   to the IP Address of the Docker Machine VM. You can find this using the command
   `docker-machine ip <machine-name>`. For example:

   ```
   $ docker-machine ip default
   192.168.99.100
   ```

   Then, navigate to: [http://192.168.99.100:8000](http://192.168.99.100:8000)

## Next steps

### Importing data from production

If you need or want to import data from production see [this wiki page][6] for instructions.

## Developing

### Apps

DesignSafe custom apps should be put into `designsafe/apps`. You can then enable them in
the Django `settings.py` with `designsafe.apps.{app_name}`.

### CSS/Styling

See the [DesignSafe Styles Reference][7] for style reference and custom CSS documentation.

## Production setup

The production setup registers the container composition as a systemd service.

1. Create a non-root user in the docker group, e.g., portal.
2. Create the directory `/designsafe` owned by portal
3. Create `/designsafe/media` for user-uploaded data and `/designsafe/certs`.
4. Place the main site TLS certificate/key in `/designsafe/certs/www` and the EF site TLS
   certificate/key in `/designsafe/certs/ef`.
5. Copy [`docker-compose-prod.yml`](docker-compose-prod.yml) to `/designsafe/docker-compose.yml`.
6. Copy ['etc/designsafe.service'](etc/designsafe.service) to `/etc/systemd/system/designsafe.service`.
7. Copy [`designsafe.env.sample`](designsafe.env.sample) to `/designsafe/designsafe.env` and configure
   as necessary.
8. Enable and start the service:

   ```
   $ systemctl enable designsafe
   $ systemctl start designsafe
   ```



[1]: https://docs.docker.com/
[2]: https://docs.docker.com/compose/
[3]: https://docs.docker.com/installation/
[4]: https://docs.docker.com/compose/install/
[5]: https://www.docker.com/toolbox
[6]: https://github.com/DesignSafe-CI/portal/wiki/Importing-data-from-Production-to-Development
[7]: https://github.com/DesignSafe-CI/portal/wiki/CSS-Styles-Reference

