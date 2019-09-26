.. _dev_env_setup:

Pre-requisites:

* `Docker <https://docs.docker.com/install/>`_ `>=19.03.01`
* `docker-compose <https://docs.docker.com/compose/install/>`_ `>=1.24.1`

Recommendations:

* For OSX `install
  <https://www.topbug.net/blog/2013/04/14/install-and-use-gnu-command-line-tools-in-mac-os-x/>`_ 
  `GNU Coreutils <https://en.wikipedia.org/wiki/GNU_Core_Utilities>`_ via homebrew.
* Create a virtual environment.
* Add this to your `.bashrc` so you'll have direct access to the project's makefile and autocompletion:

   .. code-block:: bash

       ds-mk() {
       Make -f <path_to_designsafe>/portal/Makefile "$@"
       }
       source <path_to_designsafe>/bin/make-autocomplete.bash

Follow these steps to setup your local dev environment:

#. Build images:

   .. code-block:: bash

       $ ds-mk build

#. Run mysql to make sure it's initialized correctly:

   .. code-block:: bash

       $ ds-mk dev.up.mysql

#. Run django migrations:

   .. code-block:: bash

       $ ds-mk django.migrate

#. Run services:

   A. To run every service and attach to the output:

       .. code-block:: bash

           $ ds-mk start

   B. To run every service as a daemon:

       .. code-block:: bash

           $ ds-mk dev.up

#. Install `designsafe.dev` CA certificates:

  * OSX

    #. Open Keychain Access.
    #. Go to `File > Import Items`.
    #. Navigate to `<path_to_designsafe>/conf/nginx/certificates`.
    #. Select `ca.pem`.
    #. Search for designsafe and double click on `Designsafe CA`.
    #. Click on Trust and select *"Trust Always"*.
    #. Close the window to save.

#. Go to `https://designsafe.dev <https://designsafe.dev>`_.



