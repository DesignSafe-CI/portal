.PHONY: build
build:
	docker-compose -f ./conf/docker/docker-compose.yml build

.PHONY: start
start:
	docker-compose -f ./conf/docker/docker-compose-dev.all.debug.yml up

.PHONY: stop
stop:
	docker-compose -f ./conf/docker/docker-compose-dev.all.debug.yml down
