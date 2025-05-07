NGROK_ENV_FILE = ./conf/env_files/ngrok.env
ifeq ("$(wildcard $(NGROK_ENV_FILE))","")
    NGROK_ENV_FILE = ./conf/env_files/ngrok.sample.env
endif


.PHONY: build
build:
	docker compose -f ./conf/docker/docker-compose.yml build

.PHONY: build-dev
build-dev:
	docker compose -f ./conf/docker/docker-compose-dev.yml build

.PHONY: python-install
python-install:
	pyenv local 3.11 && POETRY_VIRTUALENVS_IN_PROJECT=true poetry sync || echo \
	'Command failed. Do you have Poetry (https://python-poetry.org/docs/#installation) \
	and pyenv (https://github.com/pyenv/pyenv?tab=readme-ov-file#a-getting-pyenv) installed? \
	You may also need to run "pyenv install 3.11".'


.PHONY: start
start:
	docker compose --env-file $(NGROK_ENV_FILE) -f ./conf/docker/docker-compose-dev.all.debug.yml up

.PHONY: stop
stop:
	docker compose --env-file $(NGROK_ENV_FILE) -f ./conf/docker/docker-compose-dev.all.debug.yml down

.PHONY: start-m1
start-m1:
	docker compose --env-file $(NGROK_ENV_FILE) -f ./conf/docker/docker-compose-dev.all.debug.m1.yml up

.PHONY: stop-m1
stop-m1:
	docker compose --env-file $(NGROK_ENV_FILE) -f ./conf/docker/docker-compose-dev.all.debug.m1.yml down
