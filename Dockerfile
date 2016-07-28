FROM buildpack-deps:trusty

MAINTAINER Matthew R Hanlon <mrhanlon@tacc.utexas.edu>

EXPOSE 8000

CMD ["/usr/local/bin/uwsgi", "--ini", "/portal/conf/uwsgi.ini"]

ENV DEBIAN_FRONTEND noninteractive
ENV TERM xterm

RUN apt-get update && \
    apt-get upgrade -y && \
    curl -sL https://deb.nodesource.com/setup_4.x | bash - && \
    apt-get install -y python python-dev gettext nodejs xvfb chromium-browser ruby-sass && \
    curl -SL 'https://bootstrap.pypa.io/get-pip.py' | python && \
    pip install uwsgi

COPY requirements.txt /tmp/requirements.txt

RUN pip install -r /tmp/requirements.txt

RUN groupadd --gid 816877 G-816877 && \
    useradd --uid 458981 --gid G-816877 --groups staff -m --shell /bin/bash tg458981

COPY . /portal

WORKDIR /portal

RUN npm install

RUN python manage.py collectstatic --noinput

RUN chown -R tg458981:G-816877 /var/www/designsafe-ci.org
