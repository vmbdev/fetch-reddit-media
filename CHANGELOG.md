# Changelog

## [0.4.0] - 2023-11-20

### Added

- A LICENSE.md file (MIT).
- A README.md file with installation and usage information.
- Well, a CHANGELOG.md.

### Changes

- Disabled use of Gfycat as the service went down permanently.
- Migrated to Commander to manage arguments and (more importantly) to show
a help menu with --help.
- RG videos work again.
- Heavily revamped Imgur plugin to check for the image to exists through the
API even when given a direct link, as with their last policy changes a lot of
their was deleted.

### Fixed

- Better detection when a link fails to be resolved before downloaded.
- Removed the global flags present in some regular expressions.
