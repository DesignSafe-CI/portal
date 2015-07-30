# DesignSafe-CI Portal

## First time setup

1. Clone the repo

   ```
   $ git clone https://github.com/DesignSafe-CI/portal.git
   ```

2. Build the container

   ```
   $ docker build -t designsafe-ci/portal .
   ```

3. Set up local/testing database

   ```
   $ docker run -it --rm -v $(pwd):/portal designsafe-ci/portal bash
   # ./manage.py migrate
   # ./manage.py createsuperuser
   ```

4. Start container

   ```
   $ docker run -it --rm -v $(pwd):/portal designsafe-ci/portal
   ```