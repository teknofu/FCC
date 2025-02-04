### 2025-02-02

### Technical Changes
- Updated useEffect dependencies to include new filters
- Modified chore creation and update functions to handle room field
- Restructured filter UI layout for better organization
- Improved filter logic to handle multiple filter combinations
- Updated chore data structure to include `parentAccess` array
- Modified chore queries to check both creator and parent access
- Updated family member retrieval to show all available parents in the system

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

### 2025-02-03

### Technical Changes
- Migrated from React defaultProps to JavaScript default parameters in components:
  - PaymentScheduleForm
  - PaymentProcessor
  - EarningsOverview
- Removed deprecated defaultProps pattern to prevent future React warnings

### Fixed
- Transaction history now shows actual chore name instead of generic "chore" type in the description field
- Reset button in chore management now includes a refresh icon for better visual clarity
- Fixed uncaught TypeError when selecting days in weekly chore schedule
  - Properly initialize scheduledDays when switching to weekly timeframe
  - Ensure scheduledDays object exists before accessing properties

## 2025-02-04

### Added
- Chore duplication feature
  - New "Duplicate" button in chore edit dialog
  - Creates exact copy of existing chore with:
    - Same title, description, and schedule
    - Same reward and room assignment
    - Cleared assignment field for reassignment
    - Reset status to pending
  - Helps quickly create similar chores for different children

### Fixed
- Bug fix: Added initial 'pending' status when creating new chores to ensure proper status tracking
- Fixed "Mark Complete" button functionality in Chore Management by simplifying the completion flow. The button now directly marks chores as complete instead of using an intermediate state, improving reliability and user experience.
- Restored chore comment system functionality:
  - Re-added comment dialog when children mark chores complete
  - Re-added feedback dialog for parent verification
  - Fixed display of completion comments and verification feedback in chore cards