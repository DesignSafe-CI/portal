# DesignSafe-CI Portal Release Notes

## v0.9.21

Fixes:

- Link to project in email notification.
- Workspace drag and drop functionality.
- Public data metadata rendering.
- Public data breadcrumb links.


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
