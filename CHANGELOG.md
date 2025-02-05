# Changelog

All notable changes to this project will be documented in this file.

## [2025-02-04]

### Added
- Chore duplication feature
  - New "Duplicate" button in chore edit dialog
  - Creates exact copy of existing chore with:
    - Same title, description, and schedule
    - Same reward and room assignment
    - Cleared assignment field for reassignment
    - Reset status to pending

### Enhanced
- Improved chore reward calculation system
  - Rewards now automatically calculated based on child's pay per period and active chores
  - Added detailed reward calculation formula display in chore form
  - Rewards dynamically update when chores are added, removed, or completed
  - Added real-time reward recalculation when child's pay per period changes
- Improved due date clarity in chore management
  - Removed "Next" from weekly chore due dates to prevent confusion
  - Example: "Due: Next Wednesday" is now "Due: Wednesday"
- Simplified chores overview display
  - Clear text-based presentation of active and completed chores
  - Dynamic messaging based on chore status
  - Improved reliability by removing problematic chart component
- Due today filter improvements
  - Fixed issue where daily chores would always show when "due today" was checked
  - Child and room filters are now properly applied before due today check
  - Improved filter logic organization for better maintainability
- Improved chore card layout
  - Transformed single-column list into responsive grid layout
  - Cards automatically adjust based on screen size:
    - 4 cards per row on large screens
    - 3 cards per row on medium screens
    - 2 cards per row on small screens
    - 1 card per row on mobile
  - Better visual organization of chore information
  - Consistent card heights and spacing

### Fixed
- Added initial 'pending' status when creating new chores
- Fixed "Mark Complete" button functionality in Chore Management
  - Simplified completion flow
  - Button now directly marks chores as complete
  - Improved reliability and user experience
- Restored chore comment system functionality
  - Re-added comment dialog for chore completion
  - Re-added feedback dialog for parent verification
  - Fixed display of completion comments and verification feedback
- Due today filter now properly respects other active filters
  - Child and room filters are now properly applied before due today check
  - Improved filter logic organization for better maintainability
- Fixed issue where chore rewards were being recalculated when chores were verified, causing remaining active chores to have increased rewards
  - Modified reward calculation to consider all chores (including verified ones) when determining reward amounts
  - Removed reward recalculation logic from loadChores() and handleSubmit()
  - Rewards now stay fixed at their initial calculated value throughout the chore lifecycle

### Technical Changes
- Refactored reward calculation logic in ChoreManagement component
- Added helper functions for getting child's pay per period and active chore count
- Updated family service to handle payPerPeriod field
- Added new useEffect hook for reward recalculation
- Modified loadChores function to batch update rewards
- Replaced chores overview chart with text-based display
- Removed unused chart-related dependencies
- Improved chores overview loading state handling

## [2025-02-03]

### Fixed
- Transaction history now shows actual chore name instead of generic "chore" type
- Reset button in chore management now includes a refresh icon
- Fixed uncaught TypeError in weekly chore schedule
  - Properly initialize scheduledDays when switching to weekly timeframe
  - Ensure scheduledDays object exists before accessing properties

### Technical Changes
- Migrated from React defaultProps to JavaScript default parameters in components:
  - PaymentScheduleForm
  - PaymentProcessor
  - EarningsOverview
- Removed deprecated defaultProps pattern

## [2025-02-02]

### Added
- Multiple parent chore management
  - Parents can now share chore management responsibilities
  - New "Manage Access" button on each chore
  - Dialog to add or remove parent access to individual chores
  - Parents can see and manage any chores they have been given access to
  - Security rules updated to check parent access permissions
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

### Technical Changes
- Updated useEffect dependencies to include new filters
- Modified chore creation and update functions to handle room field
- Restructured filter UI layout
- Improved filter logic for multiple filter combinations
- Updated chore data structure to include `parentAccess` array
- Modified chore queries to check both creator and parent access
- Updated family member retrieval to show all available parents
