hostname=`hostname`
if [[ $hostname == "*cms" ]]; then
    source ~/cms/env/bin/activate
else
    source ~/portal_env/bin/activate
fi
