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

## 2-2-2025 (Update 2)

### Added
- Chore completion comments
  - Children can now add comments when marking a chore complete
  - Parents can see child's comments when reviewing completed chores
  - Parents can add feedback when approving or rejecting chores
  - Comments are displayed in the chore card:
    - Child's completion comment shown in italics
    - Parent's approval feedback shown in green
    - Parent's rejection reason shown in red

### Enhanced
- Improved chore verification UI
  - Changed from separate Approve/Reject buttons to a single "Verify" button
  - Added verification dialog showing:
    - Child's completion comment
    - Text field for parent's feedback
    - Options to Approve or Reject
  - Better visual organization of comments in chore cards

### Fixed
- Comment reset functionality
  - Child's comment now properly resets when:
    - Daily chores automatically reset
    - Parent rejects a chore
    - Chore is manually reset
  - Fixed updateChore service to properly handle both completion and verification comments
  - Added back the "Assigned to" label in chore cards that was accidentally removed

### Technical Changes
- Updated markChoreComplete service to accept and store completion comments
- Modified verifyChore service to handle verification comments
- Enhanced updateChore service to properly manage both comment types
- Restructured chore card layout to better display multiple comments
- Added proper null handling for comment fields in database