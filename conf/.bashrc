hostname=`hostname`
if [[ $hostname == *cms ]] && [ -f "/home/tg458981/cms_env/bin/activate" ]; then
    source /home/tg458981/cms_env/bin/activate
else
    if [ -f "/home/tg458981/portal_env/bin/activate" ]; then
        source /home/tg458981/portal_env/bin/activate
    fi
fi

export PATH=$PATH:/home/tg458981/.npm-global/bin
