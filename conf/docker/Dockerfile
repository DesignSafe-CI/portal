FROM node:16 as node_build
COPY package.json package-lock.json /designsafe/
WORKDIR /designsafe
RUN npm ci

COPY . /designsafe/
RUN npm run build

FROM node:20 as node_nx_build
COPY client/package.json client/package-lock.json /designsafe/
WORKDIR /designsafe/client
RUN npm ci

COPY client/ /designsafe/client/
RUN npm run build

FROM python:3.11-bullseye as python-base

LABEL maintainer="DesignSafe-CI <designsafe-ci@tacc.utexas.edu>"

ARG DEBIAN_FRONTEND=noninteractive

EXPOSE 8000

# Install locales for en_us.utf-8
RUN apt-get update && apt-get install -y --no-install-recommends \
    dialog \
    apt-utils \
    locales \
    && rm -rf /var/lib/apt/lists/* \
    && localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8

ENV LC_ALL en_US.utf-8
ENV LANG en_US.utf-8

# https://python-poetry.org/docs/configuration/#using-environment-variables
ENV POETRY_VERSION=1.8.2 \
    POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    PYSETUP_PATH="/opt/pysetup" \
    VENV_PATH="/opt/pysetup/.venv"

# Prepend venv and poetry to path
ENV PATH="$VENV_PATH/bin:$POETRY_HOME/bin:$PATH"

RUN groupadd --gid 816877 G-816877 && \
    useradd --uid 458981 --gid G-816877 -m --shell /bin/bash tg458981 -d /home/tg458981

# Install poetry version $POETRY_VERSION to $POETRY_HOME
RUN pip3 install --no-cache-dir --upgrade pip setuptools wheel \
    && python3 -m venv "$POETRY_HOME" \
    && "$POETRY_HOME/bin/pip" install --no-cache-dir poetry=="$POETRY_VERSION"

# Copy project requirement files here to ensure they will be cached.
WORKDIR $PYSETUP_PATH
COPY poetry.lock pyproject.toml ./

##############
# `development` image target is used for local development
FROM python-base as development

RUN "$POETRY_HOME/bin/poetry" install
# Copy in base project directory without built client assets for local development
COPY --chown=tg458981:G-816877 . /srv/www/designsafe

USER tg458981

# Install dev dependencies
RUN "$POETRY_HOME/bin/poetry" install --with dev

WORKDIR /srv/www/designsafe

##############
# `production` image target is used for deployed runtime environments
FROM python-base as production

# Install runtime dependencies
RUN "$POETRY_HOME/bin/poetry" install --without dev

# Copy in built client assets
COPY --from=node_build --chown=tg458981:G-816877 /designsafe/ /srv/www/designsafe
COPY --from=node_nx_build --chown=tg458981:G-816877 /designsafe/client/dist/client/. /srv/www/designsafe/designsafe/static/react-assets
COPY --from=node_nx_build --chown=tg458981:G-816877 /designsafe/client/dist/client/react-assets.html /srv/www/designsafe/designsafe/templates/react-assets.html

USER tg458981

WORKDIR /srv/www/designsafe
