# DesignSafe-CI Portal Release Notes

## v2.7.0-20180801

Improvements:

- Hybrid Simulation updates.
- "Open in Jupyter" for notebooks.
- Add link to retrieve forgotten username.

Fixes:

- PI is required to create a project.
- Fixed pagination on My Data.

## v2.7.0-20180703

Improvements:

- Hybrid Sim metadata check

Fixes:

- Hybrid Sim

## v2.7.0-20180702

Fixes:

- Hybrid Sim
- Citations
- Breadcrumbs

## v2.7.0-20180701

Improvements:

- Citation Preview in Publish Area....
- Video banner for preview modals.

Fixes:

- Breadcrumbs fix within project search.
- Hybrid Outputs models.

## v2.7.0-20180701

Improvements:

- Project indexing.
- Add app icons to application tray.
- SCEC jupyter notebook creates a specific folder and file before launching.
- Search in My Projects.
- Hybrid Simulation publication pipeline.

Fixes:

- Associated projects.
- Nees projects not loading.
- Remove integrate analysis and report.
- Show spinner in My Projects on search/navigation.
- Ensue project data is retrieved before doing anything else.

## v20180601

Fixes:

- Loading spinners across data browsers.
- Publications breadcrumbs.
- My Projects pagination.

Improvements:

- Refresh files listing in Workspace.
- Hybrid Simulation data model.
- Execution Systems Monitor.
- EZID download link on publications.
- Search in My Projects.
- `ProcessorsPerNode` option in app.

## v2.6.10

Fixes:

- Showing correct year on citation.

## v2.6.9 (20180508)

Fixes:

- Hot-fix for marker placement

## v2.6.8 (20180507)

Improvements:

- Publication file listing fallback
- Search string supports AND and OR

Fixes:

- Public search
- External resources error message
- User agent string check
- Hash symbol escaped correctly from files urls

## v2.6.7

Fixes:

- Files from "Other" projects are not being copied correctly when publishing

## 20180506

Improvements:

- Launch jupyter notebooks from App Tray
- Altmetrics metadata in publications

Fixes:

- Public search fix
- Datadepot left navbar highlight

## v2.6.6

Fixes:

- Project's ACLs when adding members
- User creation error on table field

## v2.6.5 

Fixes:

- Analysis and Reports are not required on simulation project anymore
- Citation button working on simulations
- Associated projects rendered correctly on publications

## v2.6.4 (20180505)

Fixes:

- Fix typo on copying files to corral

## v2.6.3 (20180504)

Fixes:

- Related file paths for Sim Pubs

## v2.6.2 (20180503)

Fixes:

- Breadcrumbs
- Partner Data Apps on workspace

## v2.6.1 (20180502)

Improvements:

- App categories
- Usage of Partner Data Apps

Fixes:

- Simulation publication rendering issues
- Simulation project client validation
- Site map bug

## v2.6.0 (20180501)

Improvements:

- Ticket form update
- Job status notifications
- File search within Data Depot
- Removal of search on external resources
- Publication form validation
- HTML application can be disabled now
- Publish apps can be now marked as not published for edit needs
- Check user agent and show a ribbon if not 100% supported
- Data Depot button labels and messages

Fixes:

- Preview for files that are not marked as files
- Navbar dropdown spacing
- Stampede app warning text
- App Category in app definition's tags
- Get App Category from metadata
- App cloning form
- Data Depot ribbon floating

## v2.5.1 (20180413)

Fixes:

- Typo moving files to published

## 20180412

Fixes:

- Typo when checking for filepaths to publish

## 20180411

Fixes:

- Making sure published files are copied for "Other" project

## 2.5.0 (20180410)

Improvements:

- Admin ability to re-publish project

## 20180409

Fixes:

- Search UI updates

## 2.4.8 (20180408)

Fixes:

- Authorship for Team Members

## 20180407

Improvements:

- Improve workspace category handling

Fixes:

- Community search
- User home creation

## 20180406

Fixes:

- Root directory was not being indeed when sharing files

## 20180405

Fixes:

- Ignoring 404 when deleting documents from elasticsearch

## 20180404

Fixes:

- Shared with Me is working again

## 20180403

Fixes:

- Nees listing was not working correctly

## 2.4.7 (20180402)

Fixes:

- Moving to Recaptcha 2

## 2.4.6 (20180401)

Fixes:

- Listing NEES data directly from the filesystem

## 2.4.5

Fixes:

- Permission indexing

## 2.4.4

Fixes:

- NEES elasticsearch query

## 2.4.3

Fixes:

- Removing `_links` from indexed permissions

## 2.4.2

Fixes:

- Settings project ID after creation

## 2.4.1

Fixes:

- Using correct NESS index

## 2.4.0

Improvements:

- Disable Stampede 1 apps
- Add aspect ratio on CMS for podcasts

Fixes:

- Update local dev certificates
- Add CA root certificate
- Fix Elasticsearch migration
- Simulation metadata preview

## 20180304

Fixes:

- Correct model lookup for entities

## 20180303

Improvements:

- Video notifications

Fixes:

- Workspace categories
- Project create validation
- Django command to remove null pointer references on metadata association Ids
- Authorship on simulations
- Merging parallel metadata calls into one
- Simulation entitites class and API correctness

## 20180302

Fixes:

- Collaborator modal works better
- Google secrets managed in settings.py

## 20180301

Improvements:

- Add community data to Hazmapper
- Updating ticket submission form

Fixes:

- Add action link to VNC notification
- Avoid multiple job submission
- Simulation Preview Tree

## 20180205

Improvements:

- Search improvements - better ES queries.
- Static files handling improvements - no `django-pipeline`, adding SASS to webpack.

Fixes:

- Google Drive Token expiration error.
- Update `nodeCount` to dropdown.

## 20180204

Fixes:

- Listing analysis/rerpot correct files listing

## 20180203

Fixes:

- Simulation Model CSS color coding
- Preview Videos Chrome bug

## 20180202

Improvements:

- Adding first version of Simulation Data Model

Fixes:

- Performance on workspace loading.
- Data depot selection of files.
- Video previewer not working on Chrome.

## 20180201

Improvements:

- Updating Nginx config to point to new local cert name.
- Creating new cert for local dev.
- Adding configuration to create local dev cert in the future.
- Enabling video preview embedded in browser
- Adding My Projects to Workspace file browser

Fixes:

- Displaying correct project name on breadcrumbs

## v2.3.2

Fixes:

- Typo when appending team members
- Add files for addition

## 20180105

Improvements:

- Updating MATLAB Software License Language
- Adding subsites to Sitemaps
- Re-enabling Data Depot search bar with improvements.
- Disabling extra step on login workflow
- Adding LS-DYNA to app list and corresponding license.

Fixes:

- Remove 'maxRunTime' and 'archivePath' on job form for simplicity.
- Adding 'My Projects' to Worksapce mini browser.
- Calculating 'processesPerNode' for jobs without 'nodeCount'.
- Rejecting pending promises on data depot for files listing.
- Temporarily removing projet image and non-supported project types.

## 20180104

Improvements:

- Adding profiling decorator to use on any view (Class or Function). Uses cProfiler and writes a profile and human readable stats to `designsafe/stats`.

## 20180103

Improvements:

- Configuring Webhooks correctly to work with Potree

## 20180102

Fixes:

- Fixed error when adding team members
- Fixed error when adding files for publishing

## v2.3.1

Fixes:

- Correct defaults on node and processes for job sumission

## v2.3.0

Fixes:

- Correct next parameted after login
- Retry failed uploads
- Publication pipeline bugs

Improvements:

- `setfacl` on files in data depot
- Image viewer
- Workspace apps categorization
- Sitemap
- Search

## v2.2.1

Fixes:

- Elasticsearch connection config

## v2.2.0

Fixes:

- DOI builder bugs
- Adding team members in projects
- Curation pipeline bugs

Improvements:

- Elasticsearch connection timeout and retry
- Moving models files

## v2.1.0

Fixes:

- PDF previewer
- Experimental Project view
- Data Depot listings

Improvements:

- Hazmapper images
- Notifications UI
- RAPID UI
- Adding Google Drive to Data Depot
- HPC apps node count and max run time
- Elasticsearch connection

## v2.0.5

Fixes:

- Shared with me bug

## v2.0.4

Fixes:

- Showing correct entity on tree view when multiple siblings

## v2.0.3

Fixes:

- Missing div in analysis list

## v2.0.2

Fixes:

- Sorting authors in project and experiments

## v2.0.1

Fixes:

- Publication metadata rendering

## v2.0.0

Updates:

- Django == 1.10
- Django-cms == 3.3
- Elasticsearch == 5.x
- Celery == 4.x

Improvements:

- First version of API REST end point to manage projects
- HazMapper metrics
- Rapid admin interface
- QGIS
- "Other" selections for experiments
- "Other" data model for projects
- Re-organizing config files and docker-compose files

Fixes:

- Folder download button disabled
- Using correct EZID shoulder
- Re-organizing projects view
- Re-organizing published view
- Updating Elasticsearch filtered queries
- Fix various task errors
- Rapid admin links

## v1.1.1

Improvements:

- Using more processes for uWSGI

Fixes:

- Registration form bugs
- Rapid links

## v1.1.0

Features:

- Rapid Admin interface

Improvements:

- Deleting stale code
- Change configuration of uWSGI to add more processes
- Adding New Relic monitoring
- Improving Agave client creation

Fixes:

- Project metadata serialization

## v1.0.2

Fixes:

- Category tags in files were breaking serialization of categories and entities.


## v1.0.1

Fixes:

- Using ReCaptcha for forms.
- Elasticsearch queries configuration work better for site-wide search.
- Breadcrumb links in published data.
- Report file listing for a public project.
- Better serialization for entities.
- Correctly showing newly published projects in listings.
- Using os library to copy published files in corral.
- Using customized names when publishing project.
- Celery Tasks retry fixes.

## v1.0.0

Note:

This is a transition version.
From now on versions will correctly be in semver format < mayor >.< minor >.< bug fix >

## v0.9.28

Improvements:

- Dashboard layout.
- Publication Messages.

## v0.9.27

Fixes:
- Published files preview.
- CHANGELOG

## v0.9.26

Improvements:

- HAZMAP Reconnaisance.
- Data Curiation for Projects.
- Publication pipeline.
- Projects mounting on notebooks.

Fixes:

- Dropbox path encoding.
- Site Menu improvements.
- Site Search improvements.
- External Resource enabling bug.
- Project human readable ID.
- Setting permissions on home directories.
- Site Header improvements.

## v0.9.25

Improvements:

- Community Data available.

Fixes:

- Sitewide Search IE11 fix.
- Public data is viewable by Anonymous user.

## v0.9.24

Fixes:

- All forms can be submitted.
- Project creation without a PI.

## v0.9.23

Improvements:

- Site-wide search.
- Image previewer.
- Dropbox capabilities.

Fixes:

- Configuring celery to make sure tasks do not run very long.
- Upating public data index mappings (elasticsearch).

## v0.9.22

Fixes:

- Workspace Jupyter app is showing correct `Launch` button.
- Pagination is not skiping files.
- `Loading ..` legend in data depot.
- Karma config for correct test running.
- Creating come directory only if the user was created TODAY.
- Using `retry()` for `job_watch` and user home directory creation.

## v0.9.21

Fixes:

- Link to project in email notification.
- Workspace drag and drop functionality.
- Public data metadata rendering.
- Public data breadcrumb links.
- Pagination in projects files listing.


## v0.9.20

Features:

- Python Notebook preview

Improvements:

- Notifications architecture.
- Email notifications when user is added to a project.


Fixes:

- Remove NEEShub Account Access from Register and Login pages.
- Copy/move to Box.com disappeared as an option.


## v0.9.19

Fixes:

- Uploading folders to 'My Data'.
- Allow creation of projects with long titles.
- Correctly redirecting to new Data Depot view from job 'output' button.

## v0.9.18

Features:

- Professional profile in account profile.

Improvements:

- File toolbar is more visible.
- File toolbar icons show legends for easier use.
- Move to trash functionality in Projects.
- Search capability on every data depot section.

Fixes:

- Data Depot UI.
- Notification toasters showing up correctly.
- Information button correctly wired.

## v0.9.17

Enhancements:

- Data Depot - New Version
  - Improved UI.
  - Improved search.
  - Improved file transfers.
  - Projects collaboration space.


Fixes: 

- Improving system monitors
- Added terms and conditions link to profile page.
- Changes to header and footer.

## v0.9.16

- Add RAPID facility site config.

## v0.9.15

Fixes:

- Fixed ISE when token refresh fails and user is logged out; this triggers
  a logout message but MessagesMiddleware wasn't available yet.

## v0.9.14

Fixes:

- Fixed bug in old public data browser

## v0.9.13

Enhancements:

- Improved shared files display; no longer need to click though multiple
  directory levels to access shared content

Fixes:

- Fixed bug with text preview and non-unicode content encoding
- Fixed bug with connecting to VNC sessions from Job Status modal
- Fixed CSRF errors when accessing Public Data as Anonymous
- Fixed permissions on accessing mailing list subscribers
- Fixed unicode encoding bugs on mailing list subscribers
- Fixed Application display to show label instead of app ID

Other:

- Improved server logs

## v0.9.12

Enhancements:

- Enhanced rendering of public data metadata
- Added opt-out feature for DesignSafe announce
- Added monitors for app execution systems

## v0.9.11

Enhancements:

- Public data is back! We've fixed and improved the public data search
- Search URLs in the Data Browser are now shareable
- Added a link to submit a ticket if an error page is encountered. The
  ticket will automatically include the URL of the page that triggered the
  error as well as the referrer URL.

Fixes:

- Apps properly display name and version in the workspace instead of the
  internal app identifier.
- Corrected the state of some operations in the data browser that should
  not have been available for Public data or Box data.

## v0.9.10

Fixes:

- Fixed issue with notifications for interactive jobs
- Fixed issue recording metadata for interactive jobs
- Disabled source selection on move dialog, since it is not supported
- Improved notification messages in Data Browser

## v0.9.9

Enhancements:

- Improved notifications for files sharing, jobs; #10093
- Improved handling of token negotiation and refresh with Agave; #10111
- Improved application catalog (tray); #10391
- Added message when file preview is not available; #10475
- Various interface improvements

Bug fixes:

- Improved indexing and permissions validation on shared files and folders
- Fixed multiple issues surrounding file path encoding; #10266
- Fixed links to job outputs from workspace; #10124
- Fixed drag and drop effects; #10397
- Fixed notification for box transfers; #10275

## v0.9.8

Bug fixes:

- Apply workaround to issue creating user home directories, #10447

## v0.9.7

Bug fixes:

- Fix bug in public data Elasticsearch query

## v0.9.6

Bug fixes:

- Fixed issue with copying files from DesignSafe to Box
- Fixed issue folder uploads not indexing properly

Improvements:

- Added infinite scroll to data browser for directories with lots of files. The data 
  browser will load additional contents when scrolled to the bottom of the listing.
- Added metadata interface to new data browser
- Added "registration successful" page redirect to better inform new users of account 
  activation steps.
- When sharing files, only apply changes to permissions, instead of reapplying all 
  permissions.


## v0.9.5

June 5, 2016

Improvements:

- Brand new Data Browser with several new features:
    - Box Integration
    - Streamlined interface
    - Improved drag-and-drop
    - Multiple file download
    - Expanded preview file type support
    - Folder upload (Chrome browser only)
    - Notifications
    - Single URL space for files/sharing
    - And More!

## v0.9.4

April 21, 2016

Bug fixes:

- Fixed timeout/error when sharing large collections of files
- Fixed problems related to deleting files
- Fixed issue where sharing permissions displayed incorrect values
- Fixed errors when uploading a large number of files at once

Improvements:

- Significant improvements to indexing of files/permissions
- Added a Trash folder; file deletion is now two-step: Move to trash, then permenant delete
- Added ability to copy/move to the root folder in My Data; previously you could only move to a subfolder

## v0.9.3

March 21, 2016

Bug fixes:

- Fixed a bug when two files/folders exists with the same name but different case
- Fixed a bug when sharing files/folders with spaces in the path
- Fixed a bug where download/preview was failing due to the files URL being double-encoded
- Fixed an issue where the portal would show as "logged out" when editing profile

Improvements:

- Added a fallback to Agave Files List when a path is loaded in the data browser but it has
  not been indexed yet.

## v0.9.2

March 9, 2016

Bug fixes:

- Fixed a bug when moving/renaming files

Improvements:

- Multi-file uploads are done in parallel
- Data depot browser "Actions" menu updated
- Added "Connect" links in Job Status and Notification for VNC-type jobs such as MATLAB
- Updated text/working/typos throughout site

## v0.9.0

March 7, 2016

First public release of the DesignSafe-CI Portal

## v0.9.0-alpha-1

February 15, 2016

First alpha release of the Portal.

Features:

- Research Workbench
    - Discovery Workspace
        - ...
    - Data Depot Browser
        - ...
- Updated site navigation to support per-section navigation
    - Driven by CMS


## v0.4.2

February 12, 2016

- Support per-site CMS permissions

## v0.4.1

January 06, 2016

- Add individual EF sites.

## v0.3.0

December 04, 2015

- Add CMS plugin for responsive embed

## v0.2.0

November 24, 2015

- Added EF site subdomains

## v0.1.1

- Fixed style bugs in forms template
- Added styled error templates

## v0.1.0

October 1, 2015

- Initial release
