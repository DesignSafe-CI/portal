FROM python:3.6-buster

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
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y nodejs

RUN pip3 install --upgrade pip wheel && pip3 install uwsgi uwsgitop pip-tools setuptools==57

RUN mkdir -p /opt/uwsgi && \
    curl -SLk -o /opt/uwsgi/uwsgi-2.0.15.tar.gz https://projects.unbit.it/downloads/uwsgi-2.0.15.tar.gz && \
    tar -xvzf /opt/uwsgi/uwsgi-2.0.15.tar.gz -C /opt/uwsgi && \
    uwsgi --build-plugin /opt/uwsgi/uwsgi-2.0.15/plugins/zabbix && \
    mkdir -p /usr/lib/uwsgi/plugins && \
    mv zabbix_plugin.so /usr/lib/uwsgi/plugins/.

RUN groupadd --gid 816877 G-816877 && \
    useradd --uid 458981 --gid G-816877 -m --shell /bin/bash tg458981 -d /home/tg458981

COPY . /srv/www/designsafe

RUN chown -R tg458981:G-816877 /srv/www/designsafe
RUN mkdir /src
RUN chown -R tg458981:G-816877 /src

USER tg458981

COPY requirements.txt /tmp/

ENV PATH="/home/tg458981/.local/bin:${PATH}"
RUN pip3 install -r /tmp/requirements.txt

RUN chmod u+x /srv/www/designsafe/bin/build_client.sh && /srv/www/designsafe/bin/build_client.sh $DJANGO_DEBUG

RUN echo "prefix=~/.npm-global" >> ~/.npmrc

WORKDIR /srv/www/designsafe
