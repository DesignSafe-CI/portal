=============
Contributing
=============

Anyone can contribute to Designsafe's code.
Every contribution is done via github Pull Requests. Please fill out the PR template when submitting a PR.

.. contents::
    :local:

Versions
=========

Version numbers follow the semantic versioning format (http://semver.org). Designsafe uses releases and pre-releases
with slightly different formatting:

* Relase: `v[0-9]+.[0-9]+.[0-9]+` each set of digits separated by a dot (`.`) belong to a *mayor*, *minor* and *release
  number*.
* Pre-release: `v[0-9]+.[0-9]+.[0-9]+-[0-9]{8,}` Before a release there can be multiple pre-releases which are denoted with
  a `-` followed by a series of digits. The digits after a `-` in a version follow the format: YYYMMNN where:
  + `YYYY`: Four digits for year when pre-release was done.
  + `MM`: Two digits for month when pre-release was done.
  + `NN`: Two digits for number of pre-release done in a month. This will be consecutive and will restart when a new month arrives.

Commits
=========

Commit messages must follow `Conventional Commits <https://www.conventionalcommits.org/en/v1.0.0-beta.2/>`_. Since every
contribution must be submitted through a Pull Request then it is up to the maintainers to squash the commits in a PR and
follow the Conventional Commits format. Meaning, formatting commit messages does not falls on the contributor rather on
the maintainers.

It is acceptable to use `emojis <https://gist.github.com/rxaviers/7360908>`_ supported by github in commit messages.

Suggested emojis to use:

* hot fix: :fire:
* fix: :wrench:
* feat: :tada:
* BREAKING CHANGE: :exclamation:, :boom:
* chore: :clipboard:
* docs: :books:
* style: :tophat:
* refactor: :hocho:
* perf: (performance) :hammer:
* test: :microscope:

Suggested scopes:

* workspace
* data-depot
* celery
* search
* permissions
* tapis


Branches
=========

`master` branch.
-----------------

The `master` branch is used as the main development branch and every release is created off of this branch.

`task/*` branches.
-------------------

Any feature, improvement or addition that is not a *bug* should be developed in a branch with a `task/` prefix. It is
preferred to use the jira task after `task/` but any significant string can be used.

`bug/*` branches.
------------------

Bug fixes should be developed in a branch with a `bug/` prefix.

Git workflow
=============

Designsafe follows a git workflow based off of the `cactus workflow
<https://barro.github.io/2016/02/a-succesful-git-branching-model-considered-harmful/>`_ with some small differences.

The main characteristics are:

1. Any development is done against `master`. Meaning, `master`'s `HEAD` is not necessarily stable at any given point in
   time.
2. Any *task* (i.e. *feature*) branch is eventually squashed and merged into `master`.
3. Squashing pull requests before merging into master is optional and up to the maintainer who is doing the merging.
4. It is still encourage to rebase early and rebase often when working on a *task* branch.
5. `master` might include *merge* commits and this is OK, but rebasing *task* branches is still encouraged.
6. Releases are only *tags* pointing to a commit in `master` and they *are not* branches.
7. Every *bug* branch must always be created off of a release tag.
8. When working on *bug* branches the committer *must not* rebase the branch since it will be merged into `master` to
   keep commit order intact.

Working with bug fixes
-----------------------

Steps to create, work and merge bug fix branches:

1. Create a branch off of a tag, e.g. `git checkout -b v4.7.0`
2. Work on the code an create commits.
3. Create the bug fix tag while in the `bug` branch.
4. If `master`'s `HEAD` is already after the tag that the `bug` fix was created off of then merge `master` into the
   `bug` branch.
   By merging `master` into the `bug` branch any conflicts are resolved in the bug branch. After merging `master`,
   commits in the `bug` branch will be applied in the correct order and will end up after the tag the `bug` branch was
   based off of.
5. Once the `bug` branch has been updated with master a pull request can be submitted.
6. If master advances further and the PR has to be updated it is better to reset the `bug` branch to before merging
   `master` and merge the updated `master`.
7. Merge the PR into `master` and do a bug release.

Development environment setup
==============================

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
