# Changelog

## 2-2-2025

### Added
- New room field for chores
  - Added room selection dropdown in ChoreForm
  - Common room options: Kitchen, Living Room, Bedroom, Bathroom, Garage, Yard, Other
  - Room field stored in database for each chore

### Enhanced
- Improved filtering capabilities in ChoreManagement
  - Added filter by child (dropdown)
  - Added filter by room (dropdown)
  - Added "Due Today" checkbox for parent accounts
  - All filters now update results immediately without needing refresh

### Fixed
- "Due Today" filter logic improved
  - Daily chores now always shown when filter is active
  - Weekly chores shown based on scheduled days
  - Monthly chores shown based on start date
  - Fixed issue where no results were showing when filter was active

### Technical Changes
- Updated useEffect dependencies to include new filters
- Modified chore creation and update functions to handle room field
- Restructured filter UI layout for better organization
- Improved filter logic to handle multiple filter combinations

## [Unreleased]

### Added
- Multiple parent chore management
  - Parents can now share chore management responsibilities
  - New "Manage Access" button on each chore
  - Dialog to add or remove parent access to individual chores
  - Parents can see and manage any chores they have been given access to
  - Security rules updated to check parent access permissions

### Changed
- Updated chore data structure to include `parentAccess` array
- Modified chore queries to check both creator and parent access
- Updated family member retrieval to show all available parents in the system