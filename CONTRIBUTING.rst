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

Git workflow (Submitting PRs)
==============================

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

Githooks
----------

Designsafe recommends using a :code:`pre-commit` and :code:`pre-push` hook. You can use the ones in this repository at
:code:`.github/hooks/`:

.. rubric:: Pre-commit hook.

.. include:: ../../.github/hooks/pre-commit
   :code: bash


.. rubric:: Pre-push hook.

.. include:: ../../.github/hooks/pre-push
   :code: bash

Reviewing Pull Requests
========================

When reviewing Pull Requests is recommended to add the following template to your `github replies
<https://help.github.com/en/articles/using-saved-replies>`_:

.. include:: ../../.github/review_template.md
   :code: bash

Development environment setup
==============================

.. include:: dev_env_setup.rst

Requirements management
========================

Python requirements
--------------------

Designsafe use `pip-tools <https://github.com/jazzband/pip-tools>`_ to manage requirements. Every :code:`.in` file lives
in :code:`requirements/`.

prod.in
    This are the main requirements file. Every application docker container (:code:`django`, :code:`cms`, and :code:`workers`) will install these requirements. When the :code:`prod.txt` file is compiled the files :code:`prod.in` and :code:`django2x.in` are used.

dev.in
    This are the requirements specific for development. This mainly contains the packages needed for testing. When the
    :code:`dev.txt` file is compiled the files :code:`prod.in`, :code:`dev.in`, and :code:`django2x.in` are used.

cms.in
    This are the requirements specific for the cms. Every cms plugin and cms specific package should be lsited here to
    avoid conflicts with the main application. When the :code:`cms.txt` file is compiled the files :code:`prod.in`,
    :code:`django1.11.in`, and :code:`cmsn.in` files are used.

Javascript requirements
------------------------

Designsafe use `npm <https://docs.npmjs.com/packages-and-modules/>`_ to keep track of javascript dependencies.

Tests
======

Designsafe runs multiple tests when a PR is submitted. 

- **Quality tests:** To verify that the code submitted is written in a specific standard.
- **Unit tests:** Must only test small unit of code. These tests **must not** call any external services.
  Python unit tests **must** be placed inside a :code:`unit` subfolder and the file **must** start with :code:`test`. It
  is recommended to place test files nearby the code they are testing.
  Javascript unit test files **must** end with :code:`spec.js`.
- **Integration Tests:** Must verify the correct integration between Designsafe's code and any external libraries or
  services.
  Python integration tests **must** be placed inside a :code:`integration` subfolder and the file **must** start with :code:`test`. It
  is recommended to place test files nearby the code they are testing.
- **End-to-end Tests:** Must verify the correct functionality of Designsafe from the user's point of view.

Running quality tests
-----------------------

Designsafe use `pylint <https://www.pylint.org>`_ (with `django-pylint <https://github.com/PyCQA/pylint-django>`_
plugin), `flake8 <http://flake8.pycqa.org/en/latest/>`_, `pydocstyle <http://www.pydocstyle.org/en/4.0.0/>`_ and `eslint
<https://eslint.org>`_ to check for code quality.

The included :code:`Makefile` includes targets to run each one of these code quality checkers:

:code:`make test.pylint`
    Run pylint checker. Configuration file: :code:`.pylintrc` 

:code:`make test.flake8`
    Run flake8 checker. Configuration file: :code:`.flake8`.
    Configuration can also be added in the :code:`setup.cfg` file.

:code:`make test.pydocstyle`
    Run pydocstyle checker. Configuration file: :code:`.pydocstyle`.
    Configuration can also be added in the :code:`setup.cfg` file.

:code:`make test.eslint`
    Run eslint checker.

Running unit Tests
-------------------

Unit test are run using `pytest <https://docs.pytest.org/en/latest/>`_ and `karma
<https://karma-runner.github.io/latest/index.html>`_.

Run tests using:

    .. code-block::

        $ make test.unit

Python unit tests
    Every module should have a submodule called :code:`tests` within which there should be a :code:`unit` and
    :code:`integration` submodules. A regular module should look like this in the file system:

    .. code-block::

        + designsafe
          + apps
            + sample_module
              + tests
                + unit
                  - test_views.py
                  - test_models.py
                + integration

    Test files **must** start with :code:`"test"`.

Javsacript unit tests
    Test files **must** end with :code:`".spec.js"`.

Running integration Tests
--------------------------

.. warning::
    As of Sept/2019 there are not integration tests and this section is a placeholder

Integration test are run using `pytest <https://docs.pytest.org/en/latest/>`_ and `TestCafe
<https://devexpress.github.io/testcafe/>`_.

Run tests using:

    .. code-block::

        $ make test.integration

Running end-to-end Tests
--------------------------

.. warning::
    As of Sept/2019 there are not integration tests and this section is a placeholder

Automated recurrent tasks
==========================

.. include:: makefile.rst

Documentation
==============

Designsafe use `sphinx <https://www.sphinx-doc.org/en/master/contents.html>`_ to build it documentation. The `napoleon
<https://www.sphinx-doc.org/en/master/usage/extensions/napoleon.html>`_, `sphinx-js
<https://github.com/mozilla/sphinx-js>`_ and `sphinx-redoc <https://sphinxcontrib-redoc.readthedocs.io/en/stable/>`_
plugins are enabled.

It is recommended to go over the `rst quick reference
<http://docutils.sourceforge.net/docs/user/rst/quickref.html#directives>`_.

Python documenation
--------------------

Documenting python objects should be done in docstrings following `PEP 257 <https://www.python.org/dev/peps/pep-0257/>`_
and either `sphinx's reStructuredText <https://www.sphinx-doc.org/en/master/usage/restructuredtext/index.html>`_ or
`Google  <https://google.github.io/styleguide/pyguide.html>`_ or `Numpy
<https://numpydoc.readthedocs.io/en/latest/format.html#docstring-standard>`_ formatting. Designsafe does not enforce a
specific docstring format.

Make sure to go over `sphinx's python domain
<https://www.sphinx-doc.org/en/master/usage/restructuredtext/domains.html#the-python-domain>`_ to better use all the
directives. Designsafe's sphinx configuration sets python as the project's domain so you don't have to prepen python
directives with :code:`py:`.

REST API documentation
-----------------------

Desigsafe's REST API is documented in `Open API <https://openapis.org/>`_ spec in the file :code:`specs/api.yml`. Note
that only the REST API details are documented using OpenAPI, the implementation details **must** be documented in the
python code to keep one single source of documentation.

Javascript documentation
-------------------------

Javascript objects **should** be docuemnted using `JSDoc <https://devdocs.io/jsdoc/>`_. There's a very handy `cheatsheet
<https://devhints.io/jsdoc>`_. Designsafe uses `sphinx-js
<https://github.com/mozilla/sphinx-js>`_ to render javascript's documentation. It is advisable to read Sphinx-JS
`caveats <https://github.com/mozilla/sphinx-js#caveats>`_.

Building documentation
-----------------------

To build Designsafe's documentation run::

    $ make docs.build

The previous command will run everything necessary to build the documentation. The output dir will be
:code:`.docs/build/html`. The rendered documentation will also be available on `https://designsafe.dev/docs
<https://designsafe.dev/docs>`_ in your development environment.
