hostname=`hostname`
if [[ $hostname == *cms ]] && [ -f "~/cms_env/bin/activate" ]; then
    source ~/cms_env/bin/activate
else
    if [ -f "~/portal_env/bin/activate" ]; then
        source ~/portal_env/bin/activate
    fi
fi
