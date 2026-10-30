FROM --platform=linux/amd64 designsafeci/ds-user-guide AS ds-user-guide

FROM node:16 AS node_build
COPY package.json package-lock.json /designsafe/
WORKDIR /designsafe
RUN npm ci

COPY . /designsafe/
RUN npm run build

FROM node:22 AS node_nx_build
COPY client/package.json client/package-lock.json /designsafe/
WORKDIR /designsafe/client
RUN npm ci

COPY client/ /designsafe/client/
RUN npm run build

FROM python:3.12-slim AS python-base

LABEL maintainer="DesignSafe-CI <designsafe-ci@tacc.utexas.edu>"
ARG DEBIAN_FRONTEND=noninteractive

EXPOSE 8000

# Install locales for en_us.utf-8
RUN apt-get update && apt-get install -y git gcc build-essential libmagic-dev ldap-utils libldap2-dev libsasl2-dev
RUN groupadd --gid 816877 G-816877 && \
    useradd --uid 458981 --gid G-816877 -m --shell /bin/bash tg458981 -d /home/tg458981

# Ensure that system pip is not using compromised certifi bundle [https://discuss.python.org/t/information-for-python-users-regarding-emudhra-emsign-ca-certificate-security-incident/109576]
RUN python -m pip install "pip @ https://files.pythonhosted.org/packages/3f/06/3e4420302363fbb71be3c7f35ce042f54bfca330e3e66b3a2e3c4cca579f/pip-26.2.2-py3-none-any.whl#sha256=fd7f4dfa8190e014013b9f08f3e973f4e4c26ffd179a204895533a7254813a70"

COPY --from=ghcr.io/astral-sh/uv:0.13.5 /uv /uvx /bin/
ENV PYSETUP_PATH="/opt/pysetup"
ENV PATH="$PYSETUP_PATH/.venv/bin:$PATH"

WORKDIR $PYSETUP_PATH
COPY pyproject.toml uv.lock ./
# install runtime deps
RUN --mount=type=cache,id=uv-ds-prod,target=/uv/sync-prod uv sync --locked --no-dev

##############
# `development` image target is used for local development
FROM python-base AS development

RUN --mount=type=cache,id=uv-core-ds-dev,target=/uv/sync-dev uv sync --locked --dev

# Copy in base project directory without built client assets for local development
COPY --from=ds-user-guide --chown=tg458981:G-816877 /docs/ /docs/
COPY --chown=tg458981:G-816877 . /srv/www/designsafe

USER tg458981

WORKDIR /srv/www/designsafe

##############
# `production` image target is used for deployed runtime environments
FROM python-base AS production

# Copy user guide material for populating RAG
COPY --from=ds-user-guide --chown=tg458981:G-816877 /docs/ /docs/
# Copy in built client assets
COPY --from=node_build --chown=tg458981:G-816877 /designsafe/ /srv/www/designsafe
COPY --from=node_nx_build --chown=tg458981:G-816877 /designsafe/client/dist/client/. /srv/www/designsafe/designsafe/static/react-assets
COPY --from=node_nx_build --chown=tg458981:G-816877 /designsafe/client/dist/client/react-assets.html /srv/www/designsafe/designsafe/templates/react-assets.html

USER tg458981

WORKDIR /srv/www/designsafe
