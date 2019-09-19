#!/home/tg458981/portal_env/bin/dumb-init /bin/sh
source scl_source enable

##
# Run Flower monitor UI
#
flower -A designsafe proj --broker=$FLOWER_BROKER --broker_api=$FLOWER_BROKER_API 2>&1 | \
    gawk -f /srv/www/designsafe/conf/docker/colorize_logs.awk
