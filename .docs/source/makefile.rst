.. _makefile::

When writing code there's a few tasks that one needs to do recurrently. For instance, checking code quality, clearing
out docker containers, etc... Designsafe offers a :code:`Makefile` with a few targets that make these tasks easier to
execute.

It is recommended to add the next snippet to your :code:`.bashrc` so you can have easy access to the make targets and
autocompletion:

   .. code-block:: bash

       ds-mk() {
       Make -f <path_to_designsafe>/portal/Makefile "$@"
       }
       source <path_to_designsafe>/bin/make-autocomplete.bash

The following are every make target available. To use them run:

    .. code-block:: bash

        $ make <target>

Or, if you added the previous snippet to your :code:`.bashrc`

    .. code-block:: bash

        $ ds-mk <target>

Where target is one of:

help
    display this help message

**### Most used targets to start/stop services. ###**

start
    Run everything and attach to output.

stop
    Stop services

down
    Stop services and remove containers

build
    Build images needed for local dev

**### Clean targets. ###**

clean.py
    Cleans env, e.g. remove \*.pyc

clean.npm
    Removes node_modules

**### Start services in daemon mode. ###**

dev.up
    Start everything using docker-compose.

dev.up.%
    Start one specific service. run.dev.<service> translates to docker-compose -f conf/docker/docker-compose.yml <service>

**### Remove docker objects. For cleanup. ###**

docker.rm.all
    Stop and remove containers, volumes and networks..

docker.rm.images
    Stop and remove containers, volumes and networks and images

**### Show docker logs. ###**

docker.logs
    Attach to docker output and look at the logs.

docker.logs.%
    Usage: docker.logs.<service_name>

**### Drop into a container's bash. ###**

docker.bash.django
    Drop into django container's bash. Uses "exec" if container is running otherwise "run"..

docker.bash.workers
    Drop into workers container's bash. Uses "exec" if container is running otherwise "run"..

docker.bash.cms
    Drop into workers container's bash. Uses "exec" if container is running otherwise "run"..

docker.bash.%
    Drop into a running container's bash.

docker.attach.%
    Usage: docker.attach.<service_name>. Attach to service.

**### Pip management. ###**

pip.compile.dev
    Compile dev requirements.

pip.compile.prod
    Compile prod requirements.

pip.compile.cms
    Compile prod requirements.

pip.compile.all
    Compile prod and dev requirements.

pip.sync.prod
    Sync pip using requirements/prod.txt. This runs locally and not inside a docker container.

pip.sync.dev
    Sync pip using requirements/dev.txt. This runs locally and not inside a docker container.

pip.sync.cms
    Sync pip using requirements/cms.txt. This runs locally and not inside a docker container.

**### Django management. Commands are run inside docker containers. ###**

django.migrate
    Run migrate in django container.

django.makemigrations
    Run makemigrations in django container.

django.check
    Run django check..

django.static
    Run django collectstatic

**### CMS Django management. Commands are run inside docker containers. ###**

cms.migrate
    Run migrate in django container.

cms.makemigrations
    Run makemigrations in django container.

cms.check
    Run django check..

cms.static
    Run django collectstatic

**### Celery workers management. Commands are run inside docker containers. ###**

workers.active
    Run celery inspect active.

workers.reserved
    Run celery inspect reserved.

workers.scheduled
    Run celery inspect scheduled.

workers.stats
    Run celery inspect stats.

**### NPM management. Commands are run inside docker containers. ###**

npm.dev
    Run npm run-script dev

npm.install
    Runs npm install

**### Python Tests. ###**

test.unit
    Run unit tests.

test.unit.collect
    Collect test with Pytest. This does not run the tests.

test.integration
    Run integration tests.

test.integration.collect
    Collect test with Pytest. This does not run the tests.

test.pylint
    Run pylint

test.pydocstyle
    Run pydocstyle

test.eslint
    Run eslint

test.quality
    Run code quality tests.

**### Sphinx documentation. ###**

docs.build
    Build docs.

docs.automodule
    Build automodule docs.

**### Local environment Certificates. ###**

certs.create
    Create/renew designsafe.dev certificates.

Custom make targets
--------------------

You can create a local make file alongside the main :code:`Makefile`. Anything with an extension of :code:`.mk` will be
imported. Meaning, you can create custom make targets to use alongside the ones offered by Designsafe.
