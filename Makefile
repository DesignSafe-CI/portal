.DEFAULT GOAL := help
VENV_NAME = .env
MKPATH = $(abspath $(lastword $(MAKEFILE_LIST)))
PWD = $(shell dirname $(MKPATH))
COMPOSE = docker-compose -f $(PWD)/conf/docker/docker-compose.yml
PYTHON = scl enable rh-python36
DJMANAGE = /srv/www/designsafe/manage.py

ifneq ("$(widlcard $(PWD)/*.mk)", "")
	include *.mk
endif

help: ## display this help message
	@echo "Please use \`make <target>' where <target> is one of"
	@grep '^[a-zA-Z]' $(MAKEFILE_LIST) | sort | awk -F ':.*?## ' 'NF==2 {printf "\033[36m  %-25s\033[0m %s\n", $$1, $$2}'

start: ## Run everything and attach to output.
	$(COMPOSE) up --no-build --remove-orphans --force-recreate 

stop: ## Stop everything
	$(COMPOSE) stop

down: ## Stop services and remove containers
	$(COMPOSE) down

build: ## Build images needed for local dev
	$(COMPOSE) build --compress --force-rm --no-cache django

clean: ## Cleans env, e.g. remove *.pyc
	find $(PWD)/designsafe/ -name '*.pyc' -delete

dev.up: ## Start everything using docker-compose.
	$(COMPOSE) up -d

dev.up.%: ## Start one specific service. run.dev.<service> translates to docker-compose -f conf/docker/docker-compose.yml <service>
	$(COMPOSE) up -d $*

docker.rm.all: ## Stop and remove containers, volumes and networks..
	$(COMPOSE) down -v --remove-orphans

docker.rm.images: ## Stop and remove containers, volumes and networks and images
	$(COMPOSE) down -v --remove-orphans -rmi=all

docker.logs: ## Attach to docker output and look at the logs.
	$(COMPOSE) logs -f

docker.logs.%: ## Usage: docker.logs.<service_name>
	$(COMPOSE) logs -f $*

docker.bash.%: ## Usage: docker.logs.<service_name>. This target uses docker-compose exec.
	# WARNING, since this code is inside a target's indented code we are running bash.
	@if [ "$*" = "django" ] || [ "$*" = "workers" ]; then \
		$(COMPOSE) exec django scl enable rh-python36 bash; \
	else \
		$(COMPOSE)
	fi

docker.attach.%: ## Usage: docker.attach.<service_name>. Attach to service.
	$(COMPOSE) attach $*

pip.compile.dev: ## Compile dev requirements.
	pip-compile $(PWD)/requirements/prod.in $(PWD)/requirements/dev.in -o $(PWD)/requirements/dev.txt

pip.compile.prod: ## Compile prod requirements.
	pip-compile $(PWD)/requirements/prod.in -o $(PWD)/requirements/prod.txt

pip.compile.all: pip.compile.dev pip.compile.prod ## Compile prod and dev requirements.

pip.sync.prod: ## Sync pip using requirements/prod.txt
	pip-sync $(PWD)/requirements/prod.txt

pip.sync.dev: ## Sync pip using requirements.dev.txt
	$(warning Make sure you are running this inside a virtual env if needed.)
	pip-sync $(PWD)/requirements/dev.txt

django.migrate: ## Run migrate in django container.
	$(COMPOSE) run --rm django $(PYTHON) "$(DJMANAGE) migrate"

django.makemigrations: ## Run makemigrations in django container.
	$(COMPOSE) run --rm django $(PYTHON) "$(DJMANAGE) makemigrations"

django.check: ## Run django check..
	$(COMPOSE) run --rm django $(PYTHON) "$(DJMANAGE) check"
