#!/bin/bash

##
# Run Flower monitor UI
#
su tg458981 -c "flower -A designsafe proj --broker=$FLOWER_BROKER --broker_api=$FLOWER_BROKER_API"
