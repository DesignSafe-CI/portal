FROM centos/python-36-centos7

MAINTAINER DesignSafe-CI <designsafe-ci@tacc.utexas.edu>

EXPOSE 8000

ENV TERM xterm

USER root

RUN yum upgrade -y
# add EPEL repo
RUN yum install -y epel-release
RUN yum install -y python-pip \
    python-setuptools \
    gcc \
    python-devel \
    unzip \
    wget \
    git \
    mysql-devel \
    vim \
    nfs-utils \
    libsemanage-python \
    postgresql-devel --enablerepo=epel \
    openssl-devel \
    bzip2-devel \
    libffi-devel
RUN yum groupinstall -y 'Development Tools'

# install node 12.x
RUN curl --silent --location https://rpm.nodesource.com/setup_12.x | bash -
RUN yum -y install nodejs

# install uwsgi
RUN pip install uwsgi

# RUN pip install --upgrade pip && pip install uwsgitop
RUN pip install --upgrade pip
RUN pip install uwsgitop pip-tools

COPY requirements/prod.txt /tmp/requirements.txt

RUN pip-sync /tmp/requirements.txt

RUN groupadd --gid 816877 G-816877 && \
    useradd --uid 458981 --gid G-816877 -m --shell /bin/bash tg458981 -d /home/tg458981

RUN mkdir -p /srv/www/designsafe &&\
    chown -R tg458981:G-816877 /srv/www/designsafe

RUN chown -fR tg458981:G-816877 "/opt/app-root/src/.npm" || true

COPY package*.json /srv/www/designsafe/

RUN cd /srv/www/designsafe npm install

USER tg458981

WORKDIR /srv/www/designsafe

# RUN mkdir -p  designsafe/static/cascade/css/fonts/ && cp -R designsafe/static/vendor/bootstrap/fonts/* designsafe/static/cascade/css/fonts/.
