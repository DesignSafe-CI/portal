# Setup global variables
.DEFAULT_GOAL := help
VENV_NAME = .env
MKPATH = $(abspath $(lastword $(MAKEFILE_LIST)))
# Helpful if this is used outside of the current folder, e.g. make -f /path/to/Makefile
PWD = $(shell dirname $(MKPATH))
# Variable for docker-compose
COMPOSE = docker-compose -f $(PWD)/conf/docker/docker-compose.yml
# Variable to enable python36 in Centos
ENABLE_PYTHON = scl enable rh-python36
# Portal virtualenv python
PORTAL_PY = /home/tg458981/portal_env/bin/python
# CMS virtualenv python
CMS_PY = /home/tg458981/portal_env/bin/python
# Variable to run django manage
DJMANAGE = /home/tg458981/portal_env/bin/python /srv/www/designsafe/manage.py
# Variable to run celery 
CELERY = /home/tg458981/portal_env/bin/celery --workdir=/srv/www/designsafe -A designsafe 

## See if django container is running
ifneq ($(shell docker ps | grep des_django),)
	DJ_COMPOSE = $(COMPOSE) exec django
else
	DJ_COMPOSE = $(COMPOSE) run --rm django
endif

## See if CMS container is running
ifneq ($(shell docker ps | grep des_django_cms),)
	CMS_COMPOSE = $(COMPOSE) exec cms
else
	CMS_COMPOSE = $(COMPOSE) run --rm cms
endif

# See if workers container is running.
ifneq ($(shell docker ps | grep des_workers),)
	WK_COMPOSE = $(COMPOSE) exec workers
else
	WK_COMPOSE = $(COMPOSE) run --rm workers
endif

# Check if there's any local make file to include
# If you want to extend this Make file create a
# local.mk file and add custom targets.
ifneq ("$(widlcard $(PWD)/*.mk)", "")
	include *.mk
endif

help: ## display this help message
	@echo $(AWK_SCRIPT)
	@echo "Usage: make <target>\n"
	@echo "\033[1;37m Tragets:\033[0m \n"
	@awk '/^### / { printf "\n%s\n", "\033[1;37;40m" $$0 "\033[0m"; } /^[a-zA-Z_\-\.%]+:/ { target=gensub(/([a-zA-Z_\-\.%]+):.*?##(.*)/, "\033[1;36m\\1\033[0m", "G", $$0); desc=gensub(/([a-zA-Z_\-\.%]+):.*?##(.*)/, "\033[0;33m\\2\033[0m", "G", $$0); printf "%-40s %s\n", target, desc }'$(MAKEFILE_LIST)

################################################
# To make the "help" target print every target with correct formatting please follow the following format:
# 1. Group title must start with three # and a space followed by the group title.
# 	e.g. ### Targets to prevent us from panicking. ###
# 		 target.guide
#
# 2. Targets are printed in the same order they are here. Group them accordingly.
# 3. Target description must be written in the same line as the target starting with two # and a space.
# 	 There can be multiple requirements for the specific target.
# 	 e.g. target.with.description: ## Target's description.
# 	 	  target.with.requirements.and.description: req1 req2 req3 ## Target's description.
##################################################

### Most used targets to start/stop services. ###
#################################################
start: ## Run everything and attach to output.
	$(COMPOSE) up --no-build --remove-orphans --force-recreate

stop: ## Stop services
	$(COMPOSE) stop

down: ## Stop services and remove containers
	$(COMPOSE) down

build: ## Build images needed for local dev
	$(COMPOSE) build --compress --force-rm --no-cache django

### Clean targets. ###
######################
# For now there are only two.
# One to clean *.pyc file and another one
# to remove npm's node_module. There should
# be more, e.g. clean Celery tasks,
# clean static files, etc...
clean.py: ## Cleans env, e.g. remove *.pyc
	find $(PWD)/designsafe/ -name '*.pyc' -delete

clean.npm: ## Removes node_modules
	rm -rf $(PWD)/node_modules

### Start services in daemon mode. ###
######################################
dev.up: ## Start everything using docker-compose.
	$(COMPOSE) up -d

dev.up.%: ## Start one specific service. run.dev.<service> translates to docker-compose -f conf/docker/docker-compose.yml <service>
	$(COMPOSE) up -d $*

### Remove docker objects. For cleanup. ###
###########################################
docker.rm.all: ## Stop and remove containers, volumes and networks..
	$(COMPOSE) down -v --remove-orphans

docker.rm.images: ## Stop and remove containers, volumes and networks and images
	$(COMPOSE) down -v --remove-orphans -rmi=all

### Show docker logs. ###
#########################
# Colorized using.
# conf/docker/colorize_logs.awk
docker.logs: ## Attach to docker output and look at the logs.
	$(COMPOSE) logs -f

docker.logs.%: ## Usage: docker.logs.<service_name>
	$(COMPOSE) logs -f $*

### Drop into a container's bash. ###
#####################################
# The django and worker targets are different because we
# need to enable rh-python36. This should not be necessary
# if we move away from Cenetos.
docker.bash.django: ## Drop into django container's bash. Uses "exec" if container is running otherwise "run"..
	$(DJ_COMPOSE) $(ENABLE_PYTHON) bash

docker.bash.workers: ## Drop into workers container's bash. Uses "exec" if container is running otherwise "run"..
	$(WK_COMPOSE) $(ENABLE_PYTHON) bash

docker.bash.cms: ## Drop into workers container's bash. Uses "exec" if container is running otherwise "run"..
	$(CMS_COMPOSE) $(ENABLE_PYTHON) bash 

docker.bash.%: ## Drop into a running container's bash.
	$(COMPOSE) exec $* bash

docker.attach.%: ## Usage: docker.attach.<service_name>. Attach to service.
	$(COMPOSE) attach $*

### Pip management. ###
#######################
pip.compile.dev: ## Compile dev requirements.
	pip-compile $(PWD)/requirements/prod.in $(PWD)/requirements/dev.in $(PWD)/requirements/django2x.in -o $(PWD)/requirements/dev.txt

pip.compile.prod: ## Compile prod requirements.
	pip-compile $(PWD)/requirements/prod.in $(PWD)/requirements/django2x.in -o $(PWD)/requirements/prod.txt

pip.compile.cms: ## Compile prod requirements.
	pip-compile $(PWD)/requirements/prod.in $(PWD)/requirements/django1.11.in $(PWD)/requirements/cms.in -o $(PWD)/requirements/cms.txt

pip.compile.all: pip.compile.dev pip.compile.prod pip.compile.cms## Compile prod and dev requirements.

pip.sync.prod: ## Sync pip using requirements/prod.txt. This runs locally and not inside a docker container.
	pip-sync $(PWD)/requirements/prod.txt

pip.sync.dev: ## Sync pip using requirements/dev.txt. This runs locally and not inside a docker container.
	$(warning Make sure you are running this inside a virtual env if needed.)
	pip-sync $(PWD)/requirements/dev.txt

pip.sync.cms: ## Sync pip using requirements/cms.txt. This runs locally and not inside a docker container.
	$(warning Make sure you are running this inside a virtual env if needed.)
	pip-sync $(PWD)/requirements/cms.txt

### Django management. Commands are run inside docker containers. ###
##########################
django.migrate: ## Run migrate in django container.
	$(DJ_COMPOSE) $(ENABLE_PYTHON) "$(DJMANAGE) migrate"

django.makemigrations: ## Run makemigrations in django container.
	$(DJ_COMPOSE) $(ENABLE_PYTHON) "$(DJMANAGE) makemigrations"

django.check: ## Run django check..
	$(DJ_COMPOSE) $(ENABLE_PYTHON) "$(DJMANAGE) check"

django.static: ## Run django collectstatic
	$(DJ_COMPOSE) $(ENABLE_PYTHON) "$(DJMANAGE) collectstatic --noinput -c -v3"

### CMS Django management. Commands are run inside docker containers. ###
##########################
cms.migrate: ## Run migrate in django container.
	$(CMS_COMPOSE) $(ENABLE_PYTHON) "$(DJMANAGE) migrate --fake-initial"

cms.makemigrations: ## Run makemigrations in django container.
	$(CMS_COMPOSE) $(ENABLE_PYTHON) "$(DJMANAGE) makemigrations"

cms.check: ## Run django check..
	$(CMS_COMPOSE) $(ENABLE_PYTHON) "$(DJMANAGE) check"

cms.static: ## Run django collectstatic
	$(CMS_COMPOSE) $(ENABLE_PYTHON) "$(DJMANAGE) collectstatic --noinput -c -v3"

### Celery workers management. Commands are run inside docker containers. ###
##################################
workers.active: ## Run celery inspect active.
	$(WK_COMPOSE) $(ENABLE_PYTHON) "$(CELERY) inspect active"

workers.reserved: ## Run celery inspect reserved.
	$(WK_COMPOSE) $(ENABLE_PYTHON) "$(CELERY) inspect reserved"

workers.scheduled: ## Run celery inspect scheduled.
	$(WK_COMPOSE) $(ENABLE_PYTHON) "$(CELERY) inspect scheduled"

workers.stats: ## Run celery inspect stats.
	$(WK_COMPOSE) $(ENABLE_PYTHON) "$(CELERY) inspect stats"

### NPM management. Commands are run inside docker containers. ###
#######################
npm.dev: ## Run npm run-script dev
	$(DJ_COMPOSE) $(ENABLE_PYTHON) "npm run-script dev"

npm.install: ## Runs npm install
	$(DJ_COMPOSE) $(ENABLE_PYTHON) "npm install"

### Python Tests. ###
######################
test.unit: ## Run unit tests.
	$(DJ_COMPOSE) $(ENABLE_PYTHON) "$(PORTAL_PY) -m pytest $$(find /srv/www/designsafe/designsafe -name unit -type d)" 
test.integration: ## Run integration tests.
	$(DJ_COMPOSE) $(ENABLE_PYTHON) "$(PORTAL_PY) pytest $$(find /srv/www/designsafe/designsafe -name integration -type d)"
