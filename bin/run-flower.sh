#!/opt/app-root/bin/dumb-init /bin/sh

##
# Run Flower monitor UI
#
flower -A designsafe proj --broker=$FLOWER_BROKER --broker_api=$FLOWER_BROKER_API
