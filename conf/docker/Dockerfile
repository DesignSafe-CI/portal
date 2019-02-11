FROM buildpack-deps:trusty

MAINTAINER DesignSafe-CI <designsafe-ci@tacc.utexas.edu>

EXPOSE 8000

ENV DEBIAN_FRONTEND noninteractive
ENV TERM xterm

RUN apt-get update && \
    apt-get upgrade -y && \
    curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash - && \
    apt-get install -y build-essential python python-dev gettext nodejs xvfb chromium-browser ruby-sass && \
    curl -SL 'https://bootstrap.pypa.io/get-pip.py' | python

RUN npm install -g bower

RUN pip install --upgrade pip && pip install uwsgi uwsgitop

RUN mkdir -p /opt/uwsgi && \
    curl -SLk -o /opt/uwsgi/uwsgi-2.0.15.tar.gz https://projects.unbit.it/downloads/uwsgi-2.0.15.tar.gz && \
    tar -xvzf /opt/uwsgi/uwsgi-2.0.15.tar.gz -C /opt/uwsgi && \
    uwsgi --build-plugin /opt/uwsgi/uwsgi-2.0.15/plugins/zabbix && \
    mkdir -p /usr/lib/uwsgi/plugins && \
    mv zabbix_plugin.so /usr/lib/uwsgi/plugins/.

COPY requirements.txt /tmp/requirements.txt

RUN pip install -r /tmp/requirements.txt

RUN groupadd --gid 816877 G-816877 && \
    useradd --uid 458981 --gid G-816877 --groups staff -m --shell /bin/bash tg458981

COPY . /srv/www/designsafe

#COPY bin/* /usr/local/bin/

WORKDIR /srv/www/designsafe

RUN chown -R tg458981:G-816877 /srv/www/designsafe

RUN npm install

RUN mkdir -p  designsafe/static/cascade/css/fonts/ && cp -R designsafe/static/vendor/bootstrap/fonts/* designsafe/static/cascade/css/fonts/.

RUN python manage.py collectstatic -c --traceback --noinput --ignore=demo
