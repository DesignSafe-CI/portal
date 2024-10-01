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
