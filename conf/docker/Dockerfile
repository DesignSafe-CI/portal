FROM centos:7

MAINTAINER DesignSafe-CI <designsafe-ci@tacc.utexas.edu>

EXPOSE 8000

ENV TERM xterm

ENV LC_ALL en_US.utf-8
ENV LANG en_US.utf-8

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
    libffi-devel \
    centos-release-scl

RUN yum install -y rh-python36

RUN yum groupinstall -y 'Development Tools'

SHELL ["/usr/bin/scl", "enable", "rh-python36"]

# Install python 3.7
# CentOS supports 3.6 but not 3. yet. Although we can install it 
# we should wait until everything works with python3.6

# RUN curl --output /tmp/python3.7.4.tgz https://www.python.org/ftp/python/3.7.4/Python-3.7.4.tgz && \
#     tar xzf /tmp/python3.7.4.tgz -C /opt/ && \
#     ls /opt && \
#     cd /opt/Python-3.7.4 && \
#     ./configure --enable-optimizations && \
#     make altinstall

# install node 12.x
RUN curl --silent --location https://rpm.nodesource.com/setup_12.x | bash -
RUN yum -y install nodejs

# RUN pip install --upgrade pip && pip install uwsgitop
RUN pip install --upgrade pip && pip install uwsgi uwsgitop

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

USER tg458981

RUN virtualenv ~/portal_env

RUN ~/portal_env/bin/pip install --upgrade pip && \
    ~/portal_env/bin/pip install pip-tools

COPY requirements.txt /tmp/

RUN ~/portal_env/bin/pip-sync /tmp/requirements.txt

COPY package*.json /srv/www/designsafe/
RUN cd /srv/www/designsafe npm install

RUN echo "prefix=~/.npm-global" >> ~/.npmrc

WORKDIR /srv/www/designsafe