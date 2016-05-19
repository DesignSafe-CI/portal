FROM buildpack-deps:trusty

MAINTAINER Matthew R Hanlon <mrhanlon@tacc.utexas.edu>

EXPOSE 8000

CMD ["/usr/local/bin/uwsgi", "--ini", "/portal/conf/uwsgi.ini"]

RUN apt-get update && \
    curl -sL https://deb.nodesource.com/setup_4.x | bash - && \
    apt-get install -y nfs-common portmap python python-dev gettext nodejs xvfb chromium-browser ruby-sass && \
    curl -SL 'https://bootstrap.pypa.io/get-pip.py' | python && \
    pip install uwsgi

COPY requirements.txt /tmp/requirements.txt

RUN pip install -r /tmp/requirements.txt

RUN groupadd --gid 816877 G-816877 && adduser --uid 458981 --ingroup G-816877 tg458981

COPY . /portal

WORKDIR /portal

RUN npm install

RUN python manage.py collectstatic --noinput

RUN chown -R tg458981:G-816877 /var/www/designsafe-ci.org
