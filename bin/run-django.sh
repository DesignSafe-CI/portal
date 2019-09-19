#!/home/tg458981/portal_env/bin/dumb-init /bin/sh
source scl_source enable

# run django dev server as designsafe community account
npm run dev &
/home/tg458981/portal_env/bin/python manage.py runserver 0.0.0.0:8000 2>&1 | \
    gawk -f /srv/www/designsafe/conf/docker/colorize_logs.awk --
