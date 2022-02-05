FROM python:3.6-buster as dev

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

# install node 12.x
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

COPY requirements.txt /tmp/
RUN pip install -r /tmp/requirements.txt && \
    pip install -e git+https://bitbucket.org/taccaci/pytas.git@1e6e488716fd42437c568acad161ae54d0077446#egg=pytas

RUN groupadd --gid 816877 G-816877 && \
    useradd --uid 458981 --gid G-816877 -m --shell /bin/bash tg458981 -d /home/tg458981

COPY . /srv/www/designsafe
RUN chown -R tg458981:G-816877 /srv/www/designsafe

USER tg458981

# RUN echo "prefix=~/.npm-global" >> ~/.npmrc

WORKDIR /srv/www/designsafe

FROM dev as prod
RUN npm ci
RUN npm run build
