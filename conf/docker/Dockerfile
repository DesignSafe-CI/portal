FROM node:16 as node_build
COPY package.json package-lock.json /designsafe/
WORKDIR /designsafe
RUN npm ci

COPY . /designsafe/
RUN npm run build


FROM python:3.8-buster

LABEL MAINTAINER="DesignSafe-CI <designsafe-ci@tacc.utexas.edu>"

ARG DEBIAN_FRONTEND=noninteractive

EXPOSE 8000

ENV TERM xterm
USER root

# install locales for en_us.utf-8
RUN apt-get update && apt-get install -y \
    dialog \
    apt-utils \
    locales \
    && rm -rf /var/lib/apt/lists/* \
    && localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8

ENV LC_ALL en_US.utf-8
ENV LANG en_US.utf-8

RUN apt-get update && apt-get install -y \
    gawk \
    unzip \
    wget \
    git \
    vim

RUN pip install poetry
COPY poetry.lock pyproject.toml /srv/www/
WORKDIR /srv/www
RUN poetry config virtualenvs.create false && \
    poetry install && \
    pip install -e git+https://bitbucket.org/taccaci/pytas.git@1e6e488716fd42437c568acad161ae54d0077446#egg=pytas

RUN groupadd --gid 816877 G-816877 && \
    useradd --uid 458981 --gid G-816877 -m --shell /bin/bash tg458981 -d /home/tg458981

COPY --from=node_build /designsafe/ /srv/www/designsafe
RUN chown tg458981:G-816877 /srv/www/designsafe /srv/www/designsafe/*
RUN chown -R tg458981:G-816877 /srv/www/designsafe/designsafe

USER tg458981

WORKDIR /srv/www/designsafe
