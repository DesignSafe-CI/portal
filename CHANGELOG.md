# DesignSafe-CI Portal Release Notes

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
