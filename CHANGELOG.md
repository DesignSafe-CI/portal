# DesignSafe-CI Portal Release Notes

##v4.9.3
Enhancements: 
* Visual updates to the publication download feature.

## v4.9.2-20200403
Fixes: 
* Publications display and paginate properly in the workspace.
* Speed up publications listings.

## v4.9.1
Fixes:
* Add download button to legacy publications.

## v4.9.0-20200402
Fixes:
* Update Markupsafe to fix issue with setuptools

## v4.9.0-20200401
Enhancements:
* Python 3 Migration
* Add ability to download published file archives
Fixes:
* Publications and Data Files display bugfixes

## v4.8.2-20200207
Fixes:
* RAPID admin page bugfix

## v4.8.2-20200206
Fixes:
* Updates to NCO schedule page.
* FR Model bug fix.

## v4.8.2-20200205
Fixes:
* Merge Field Recon upgrades into Master ahead of production deployment
* FR Model bug fixes.

## v4.8.1-20200204
Fixes:
* Set Google Dataset Search tag json type to ld+json
* Update CMS index non-destructively and only once per day.
* FR Model bug fixes.

## v4.8.1-20200203
Enhancements:
* FR Model enchancements
* Google Dataset Search

Fixes:
* Allow anonymous users to download and preview public files
* Specify default Elasticsearch connection

## v4.8.1-20200202
Enhancements:
* FR Model enchancements
* Users must submit a ticket to republish or overwrite their publications

Fixes:
* Remove field from experimental-data.json
* Fix shared with me listing

## v4.8.1-20200201
Enhancements:
* FR Model enhancements

## v4.7.7
Enhancements:
* New options for experimental models.

## v4.8.1-20200106
Fixes:

Fix webpack build error

## v4.8.1-20200105
Enhancements:
* Collections Form revisions
* Update project review process in publication pipeline
* Allow inter-sorting of different collection types
* Update UUIDs of file tags for published files
* Require users to submit a ticket to republish/overwrite publications

Fixes:
* Remove faulty options from experimental-data.json

## v4.8.1-20200104
Enhancements:
* Additions to equipment and experiment types in experimental models
* Project styling improvements

Fixes:
* Fix bug causing Edit Prj. Modal break upon selection of FR Model
* Fix project typos

## v4.8.1-20200101
Enhancements:
* Paginate Applications Builder page
* Logging for file previews
* Data Depot Infinite Scroll
* Field Research Model improvements

## v4.8.1-20191202
* Dev release for publication pipeline upgrades in task/DES-1358

## v4.8.1-20191201
* Upgrade to Elasticsearch v7.4
* Fix image preview carousel and links to NEES publications
* Frontend enhancements for publications

## v4.7.6
* update header to include NSF logo

## v4.8.0-20191103
Enhancements:
* Allow multiple procedures to be published through the pipeline
* Add metadata for multiple publication types for SEO
* Add modal for displaying author information in publications
* Add description for the Field Research project type
* Remove elevation from Field Research mission metadata and make endDate optional.

Fixes:
* Encode google drive filenames as utf-8
* Remove some team members from citations

## v4.7.5
Fixes:
* Curation enhancements

## v4.7.4-20191102
Fixes:
* Fix Webpack minification error in site search

## v4.7.4-20191101
Fixes:
* Fix bugs with adding self to Team Members section
* Prevent ui data from being removed from published project metadata
* Hide citation for projects without citations
* Fix KeyError in site search
* Fix Projects with Blank Author/DOI Field in site search

## v4.7.4-20191005
Fixes:
* NEES data in publications browsing view
* Site Location (lat long) Formatting
* Improve data transfer messages in Data Depot
* Add Project ID to Project Invitation E-mail
* Multiple metadata values need to align top with the key, not align center
* Uncheck author boxes after creating experiment/simulation/hybrid simulation
* Change published and project listing header
* Fix NEES publications not showing up when filter is selected

## v4.7.4 [2019-10-31]
* Hotfix for Professional Profile fields that weren't updating correctly.
## v4.7.3 [2019-10-30]
* Publication Pipeline fixes
* Enforce mandatory profile updates.

* fix(publication): Field Research Template fixes
* feat: Add manage account to user menu dropdown
## v4.7.3-20191004
Fixes:
* Edit profile update message.

## v4.7.3-20191003
Fixes:
* Field Recon project bugfixes.

## v4.7.3-20191002
Fixes:
* Styling changes for Edit Profile page.

## v4.7.3-20191017
Improvements:
* Add new fields to user profiles
Fixes:
* Publication Pipeline fixes
* Fix navigation in Google Drive

## v4.7.2 [2019-10-08]

* fix(publication): Field Research Template fixes
* feat: Add manage account to user menu dropdown

## v4.7.1 [2019-10-08]

Improvements:

- Failed jobs will now archive.

Fixes:

- Publication pipeline fixes.

## v4.7.0-20190906

Improvements:

- User profile updates.
- Failed jobs will now archive.

Fixes:

- Publication pipeline fixes.


## v4.7.0-20190905

* Make sure to get project DOI if no entity uuid is given.

## v4.6.4 [2019-09-12]

* Fix typo in Download citation button.

## v4.6.3 [2019-09-11]

* Download citation button and award numbers serialization.

## v4.6.2 [2019-09-11]

* fix: :fire: Other project type publications identifiers.

## v4.6.1 [2019-09-11]

* fix(publication): :fire: Indentation bug when getting publication's file paths.

## v4.7.0-20190904

* feat(nco scheduler): :star: NCO scheduler updates.
* fix(data-depot): license selection clear button and remove unused session storage lines

## v4.6.0

* Fix Published view.

## v4.6.1-20190903

* Add 'publishing' to the publications filter - task/DES-1267

## v4.6.1-20190901

* Setup mongo lib to load NCO projects and setup nco app. - task/DES-1224
* Added conditional statement to title block that fills in 'Data Depot' when the page has no citation title. - task/DES-1260
* increase field limit for publications on reindex - task/DES-1262

## v4.6.1-20190804

* Fix d3plus bundling with webpack - DES-1259

## v4.6.0-20190803

* moved prj id column, added styles for column widths - DES-1203
* Add text wrap to long names in Data Diagram - DES-1142
* Close dropdowns by default in older publication template - DES-1210
* Add recurring task for community data indexing - DES-1211
* Enable selection boxes for published area - DES-1219
* Fix breadcrumbs href creation - DES-1218
* Check for datetime obj or date string when setting creation date - DES-1253
* Update node-sass version for compatibility with Node 12 - DES-1206
* Add field recon to publication filter checklist - DES-1209
* Update DOI workflow to fix bugs and use Datacite DOI - DES-1183

## v4.5.1

* bug/DES-1205 NEES tag rendering bug fix.
* task/DES-1207 minimize entity tabs in published area.

## v4.5.0

* task/DES-866 keep order of awards and related work.
* task/DES-1200 minimize all entity fields in publication preview by default.
* Task/DES-1179 - Replace (other) with datatype if provided in published listing.
* task/DES-818 fix sitemap to catch all publications.
* bug/Des-1201 fix bug causing publication preview to make redundant listings.
* task/DES-1187 - Update Meta Tags on Published Projects.

## v4.5.0-20190802

Fixes:

- Remove placeholder text (DES-976).
- Allow for more than one Natural Hazard Type (DES-974).
- Don't show empty metadata values (DES-1004).
- Vertical align of input titles in Collections and Missions (DES-977).

## v4.5.0-20190801

Improvements:

- Metadata rendering speed in publication preview (DES-1158).
- Related works improved rendering (DES-1117).
- Better file ordering in listings (DES-1100).
- Merge Help documentation (DES-1028).

Fixes:

- Change 'This category is empty' legend (DES-436).
- Allow authors to be re-ordered (DES-987).
- Fix links in publish agreement modal (DES-989).
- Update "this category is empty" message (DES-967).
- Show "Simulation Model File Tags" for file tags (DES-1073).
- Fix "An Analysis File Tag" string (DES-1096).
- Not show trashed files in category listings (DES-1099).
- Field Recon Collection Modal fixes (DES-1106).

## v4.5.0-20190703

Improvements:

- Field Recon publishing pipeline.
- Show published project's citations and awards.
- Add community data to workspace.
- Add PRJ column and removing icon from project name listing.
- Add interactive webhook security.

Fixes:

- Various template bug fixes.
- Fix formatting and rendering issues on edit project modal.
- Update project mapping for ES.
- Update canonical URL for sitemap.
- Improve job notification implementation.

## v4.5.2-20190702

Improvements:

- Field recon model UI improvements.

## v4.5.0-20190701

Improvements:

- Re-write of search backend.

## v4.4.4

Improvements:

- Sitemap enhancements.

Fixes:

- Fixes the setfacl app to adhere to aloe conventions.
- Updates job status fields to aloe fields.
- Fixes email confirmation message.
- Fixes repeated file listing breadcrumbs.
- Fixes 403 on published file listings.
- Fixes user directive to support 'Other' type project authors.

## v4.4.3-20190605

Fixes:

- Switch to production Tapis tokens from Aloe sandbox in dev.

## v4.4.3

Improvements:

- Show end date for published experiments.
- App form validation improvements.
- Remove old unused code.
- Adds default fields to app form in the workspace.
- Adds validation to fields from app def.

Fixes:

- Exclude trash from Community Data search.
- Zip Publication task improvements.
- Fix project mounting in app containers where projectId is None.
- Fix file metadata request in published area.
- Fixes workspace data browser panel collapsibility.
- Fix to allow project edits if meta_obj is missing certain fields.
- Fix email message sent to users invited to a project.
- Fix onBrowse method for projects and search.

## v4.4.2-20190604

Improvements:

- Show end date for published experiments.
- App form validation improvements.

Fixes:

- Exclude trash from Community Data search.
- Zip Publication task improvements.
- Fix bad field validation.

## v4.4.2-20190603

Fixes:

- Hotfix reference to old indexer.

## v4.4.2-20190602

Improvements:

- Remove old unused code.
- Enables Field Recon selection in dev.

Fixes:

- Only use regex form validation if regex is valid.
- Fix project mounting in app containers where projectId is None.


## v4.4.2-20190601

Improvements:

- Adds default fields to app form in the workspace.
- Adds validation to fields from app def.

Fixes:

- Fix file metadata request in published area.
- Fixes workspace data browser panel collapsibility.
- Fix to allow project edits if meta_obj is missing certain fields.
- Fix email message sent to users invited to a project.
- Fix onBrowse method for projects and search.

## v4.4.2

Fixes:

- Hotfix for project file nav.

## v4.4.1

Fixes:

- Add PI to project upon project creation.
- Set default move destination to be current location.
- Add separators in Data Depot.
- Fix PI display issue for published other type projects.
- Disable "Preview Images" button until fixed.
- Change category selector for appropriate project type.
- Disable "Preview Citation" button in Data Depot Toolbar.
- Allow blank or null procedure end dates for experiment publications.
- Fix navigation/preview in search listings.
- Changed Tree Diagram to Related Data Diagram.
- Move data relation tree in publication and preview areas.

## v4.4.0-20190527

Fixes:

- Hotfix moving within project folder error.

## v4.4.0-20190526

Fixes:

- Hotfix error not sending emails on project creation.
- Hotfix styling in curation.

## v4.4.0-20190525

Fixes:

- Add PI to project upon project creation.
- Set default move destination to be current location.
- Add separators in Data Depot.
- Fix PI display issue for published other type projects.
- Disable "Preview Images" button until fixed.
- Change category selector for appropriate project type.
- Disable "Preview Citation" button in Data Depot Toolbar.

## v4.4.0-20190524

Fixes:

- Allow blank or null procedure end dates for experiment publications, v2.

## v4.4.0-20190523

Fixes:

- Allow blank or null procedure end dates for experiment publications.
- Fix navigation/preview in search listings.
- Changed Tree Diagram to Related Data Diagram.
- Move data relation tree in publication and preview areas.

## v4.4.0

Fixes:

- Preserve ordering of experiment authors when editing.
- Reformat email to new project collaborators.
- Change display of Field Recon to Field Research.
- Disable publish button for Field Recon.
- Add natural hazard metadata to project header for field recon.
- Fixed linux/windows file category css.
- Add published details to 'Other' type project template.
- Rapid metadata in preview window hotfix.
- Infinite recursive indexing fix.
- Fix views not showing in 'Other' and 'Field Recon type projects.
- Format authors for other projects.
- Changed Tree Diagram to Related Data in Experimental Overview.
- Fix template for multiple publication licenses.
- Update Publication Citation popup.
- Rapid/RApp metadata preview bug fix.

## v4.3.9-20190522

Fixes:

- Roll back hotfix.

## v4.3.9-20190521

Fixes:

- Hotfix to give published experiments an empty Procedure End date if none given.

## v4.3.9-20190520

Fixes:

- Hotfix to reenable Publish button in pipeline.

## v4.3.9-20190519

Fixes:

- Preserve ordering of experiment authors when editing.
- Fix 'None' string publication end date.
- Reformat email to new project collaborators.
- Change display of Field Recon to Field Research.
- Disable publish button for Field Recon.
- Add natural hazard metadata to project header for field recon.
- Fixed linux/windows file category css.

## v4.3.9-20190518

Fixes:

- Add published details to 'Other' type project template.
- Rapid metadata in preview window hotfix.
- Infinite recursive indexing fix.
- Fix views not showing in 'Other' and 'Field Recon type projects.

## v4.3.9-20190517

Fixes:

- Format authors for other projects.
- Changed Tree Diagram to Related Data in Experimental Overview.
- Use agave prod tokens.

## v4.3.9-20190516

Fixes:

- Fix template for multiple publication licenses.
- Update Publication Citation popup.
- Rapid/RApp metadata preview bug fix.

## v4.3.9

Fixes:

- Hotfix to filter null guests from experiment addition.

## v4.3.8

Improvements:

- Added FAQ link to side nav.
- Update project icons and change field recon description.
- Render PI/author names in published when not logged in.
- Add links to license websites for project publications.

Fixes:

- Fix bug where null guests prevented new experiments.
- Fix null date bug when editing an experiment.
- Fix bug preventing new experiments from being added.
- Fixes issue where new user permissions and ACLs were not being set when editing a project.
- Fixes to Edit Project Modal in Pipeline
- Added icon to FAQ.
- Update experiment on deletion.
- Fix license deselect option.
- Add event file tags
- Various cosmetic publication fixes.
- Add publication subdirectory navigation.
- Format experiment details in published and project areas.
- Fix copis not saving to project
- Removed 'tag files' button from file upload.
- Allow selections of multiple licenses in project publication.
- Fix experiment links in NEES projects.
- Fix issue causing new project entities to 500.

## v4.3.7-20190515

Fixes:

- Fix bug where null guests prevented new experiments.
- Disable download project zip button.

## v4.3.7-20190514

Fixes:

- Fix null date bug when editing an experiment.
- Fix bug preventing new experiments from being added.
- Fixes issue where new user permissions and ACLs were not being set when editing a project.
- Fixes to Edit Project Modal in Pipeline

## v4.3.7-20190513

Improvements:

- Download published project files.

Fixes:

- Added icon to FAQ.
- Update experiement on deletion.
- Fix license deselect option.
- Add event file tags
- Various cosmetic publication fixes.

## v4.3.7-20190512

Improvements:

- Added FAQ link to side nav.
- Update project icons and change field recon description.
- Render PI/author names in published when not logged in.

Fixes:

- Add publication subdirectory navigation.
- Format experiment details in published and project areas.
- Fix copis not saving to project
- Removed 'tag files' button from file upload.

## v4.3.7-20190511

Improvements:

- Add links to license websites for project publications.

Fixes:

- Allow selections of multiple licenses in project publication.
- Fix experiment links in NEES projects.
- Fix issue causing new project entities to 500.

## v4.3.7

Improvements:

- Limits project indexer to once per day.
- Enables iFrame embedding in CMS pages via ckeditor.

Fixes:

- Fixes a bug with user data views.
- Fixes to publication templates and file tag formatting.
- Fixes for published template and project type template.

## v4.3.0-20190510

Improvements:

- Limits project indexer to once per day.
- Enables iFrame embedding in CMS pages via ckeditor.

## v4.3.0-20190509

Fixes:

- Fixes a bug where users could see other users' indexed data.
- Fixes to publication templates and file tag formatting.

## v4.3.0-20190508

Fixes:

- Fixes for published template and project type template.

## v4.0.2

Fixes:

- Curation directory fixes.

## v4.0.1

Fixes:

- Agave sandbox code.

## v4.0.0

Improvements:

- Publication V2.
- Updates on search and published views.

## v3.2.3

Fixes:

- Datacite uri.

## v3.2.2

Fixes:

- Datacite settings.

## v3.2.1

Fixes:

- Fix users details in publication pipeline.

## v3.2.0

v3.2.0 Release

## v3.1.0-20181204

Improvements:

- Update to ezid API (DES-597).
- Recon portal URL per event (DES-714).
- Haxmap Bring in multiple pictures at once (DES-107).

Fixes:

- Angular Json Form fix (DES-753).

## v3.1.0-20181203

Improvements:

- Update docker image to node 10.x

## v3.1.0-20181202

Improvements:

- Applications edit UX improvements (DES-703).
- Redirect to applications page after dismiss edit success modal (DES-703).
- Add parens around single args, formatting (DES-703).

Fixes:

- Fix import errors on workspace apps (DES-703)
- Rename workspace 'Apps' service to 'WorkspaceApps' (DES-703).
- Fix final reference to the WorkspaceApps service (DES-703).
- Add application-form unit tests for workspace (DES-703).

## v3.1.0-20181201

Improvements:

- Move to DataCite API (DES-597)
- Update node to 10.x (DES-753)

Fixes:

- Hybrid sim was not showing correct output files (DES-735).
- Associated project links broken (DES-737).
- Hybrid sim missing some DOIs and adjustments on global models (DES-740).
- Fix App forms (DES-753).
- Fix bug in application-add controller (DES-703).

## v3.1.0-20181107

Fixes:

- Removing references to deleted django templates.

## v3.1.0-20181106

Improvements:

- Re-write Data Depot controllers into components (DES-731).
- Site search result enhancements (DES-711).
- Add app dropdown description model (DES-685).
- Improve app builder(DES-703).

Fixes:

- Published search not showing (DES-732).
- Fix interactive web socket message (DES-703).
- Change Dashboard wording (DES-686).
- "Connect" button on modal for interactive apps (DES-543).

## v3.0.8

- Minot release to add app description capability (DES-685)

## v3.0.7

Fixes:

- Hybrid Sim published output rendering

## v3.0.6

Fixes:

- User data undefined in projects (DES-725).

## v3.0.5

Fixes:

- Hazmapper save objects.
- Hazmapper load.
- Hazmapper map icons.

## v3.0.4

Fixes:

- Notifications html rendering.
- Hybrid sim, adding report or analysis was failing (DES-721).

## v3.0.3

Fixes:

- Fonts.
- Jupyter notebook path construction.

## v3.0.2

Fixes:

- Open in Jupyter for preview.

## v3.0.1

Fixes:

- Recon Portal css.
- nbv rendering issue.

## v3.0.0

Improvements:

- Travis CI setup
- Codecov setup
- Codeclimate setup
- ES6 Setup
- App dropdown. (DES-618)
- Opensees app form. (DES-618)
- Project mount on vnc apps. (DES-618)
- Improve missing metadata check. (DES-677)
- Index published files. (DES-617)
- Better breadcrumbs for Angular 1.6+ (DES-706).
- Add tooltip with event title on hazmapper (DES-521).

Fixes:

- Remove unnecessary Django `static` usage.
- Add angular-schema-form-ui-codemirror to repo
- Fix workspace template URL
- Remove unused metadata on templates and `!` alert icons. (DES-677)
- Citation modal fix. (DES-693)
- Help links for workspace (DES-526).
- Applications templates (DES-526).
- Appicon not showing in applications (DES-526).
- Haystack Connections (DES-196).
- Recon portal's admin link (DES-541).

## v3.0.0-20181104

Fixes:

- Componentized Dashboard.
- Dashboard graphs working with D3.
- Hybrid Sim wording.

## v3.0.0-20181103

Fixes:

- Fix service injection in data browser service.

## v3.0.0-20181102

Fixes:

- Add missing `'ngInject';`.

## v3.0.0-20181101

Improvements:

- Better breadcrumbs for Angular 1.6+ (DES-706).
- Add tooltip with event title on hazmapper (DES-521).

Fixes:

- Help links for workspace (DES-526).
- Applications templates (DES-526).
- Appicon not showing in applications (DES-526).
- Haystack Connections (DES-196).
- Recon portal's admin link (DES-541).

## v3.0.0-20181009

Improvements:

- Using only one webpack config.

## v3.0.0-20181008

Fixes:

- Fixing inject issues.

## v3.0.0-20181007

Improvements:

- App dropdown. (DES-618)
- Opensees app form. (DES-618)
- Project mount on vnc apps. (DES-618)
- Improve missing metadata check. (DES-677)
- Improve missing metadata check. (DES-677)
- Index published files. (DES-617)

Fixes:

- Remove unused metadata on templates and `!` alert icons. (DES-677)
- Citation modal fix. (DES-693)

## v3.0.0-20181006

Fixes:

- Fix workspace template URL

## v3.0.0-20181005

Fixes:

- Add angular-schema-form-ui-codemirror to repo

## v3.0.0-20181004

Fixes:

- Remove unnecessary Django `static` usage.

## v3.0.0-20181003

Improvements:

- Travis CI setup
- Codecov setup
- Codeclimate setup
- ES6 Setup

## v2.7.7

Fixes:

- Correctly construct project path when using for job.

## v2.7.6

Fixes:

- Notifications on publication workflow.
- Sorting of entities.

## v2.7.5

Fixes:

- Error when creating recursive directories for publication

## v2.7.4

Fixes:

- Correct EF settings import.
- Recon portal fix for event listing.
- Better string handling when processing publications.

## v2.7.3

Fixes:

- Do not decode response from EZID to avoid encoding issues.

## v2.7.2 (v2.7.2-20181002)

Fixes:

- Rollback apps version dropdown.

## v2.7.1

Release to Prod

## v2.7.1-20180903

Fixes:

- Publication tasks.
- Hybrid Sim tree CSS.
- Publication search results.

## v2.7.1-20180902

Improvements:

- Remove `nodeCount` parameter in front end.
- Add email notification for new users.
- Add user report for admins.
- Add drop down selector for different versions of the same app.

Fixes:

- Licenses names for publication.
- File toolbar pems checking.

## v2.7.1-20180805

Fixes:

- Hybrid Sim Wording.
- Citation date.

## v2.7.0 (20180804)

Improvements:

- Send email to users added to a project using Celery.

## v2.7.0-20180803

Fixes:

- Publication citations.
- Publication tree modal.
- Hybrid Sim drop down select labels.

## v2.7.0-20180802

Improvements:

- Correctly indexing mimetypes on Elasticsearch.

Fixes:

- Hybrid Simulation Published view.

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
