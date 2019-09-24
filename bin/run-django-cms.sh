#!/home/tg458981/cms_env/bin/dumb-init /bin/sh
source scl_source enable

# run django dev server as designsafe community account
/home/tg458981/cms_env/bin/python manage.py runserver 0.0.0.0:8080 2>&1 | \
    gawk -f /srv/www/designsafe/conf/docker/colorize_logs.awk --
