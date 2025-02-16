import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  createChore,
  getChores,
  getAssignedChores,
  updateChore,
  deleteChore,
  markChoreComplete,
  verifyChore,
  getChildStats,
  addParentAccess,
  removeParentAccess,
  rotateChoreAssignee
} from "../services/chores";
import { getFamilyMembers } from "../services/family";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormGroup,
  FormControlLabel,
  InputAdornment,
  Chip
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Fab } from "@mui/material";

// Days of the week for scheduling
const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const ChoreManagement = () => {
  const { user, role } = useSelector((state) => state.auth);
  const [chores, setChores] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [childStats, setChildStats] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedChore, setSelectedChore] = useState(null);
  const [parentAccessDialog, setParentAccessDialog] = useState(false);
  const [availableParents, setAvailableParents] = useState([]);
  const [selectedParent, setSelectedParent] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    timeframe: "all",
    dueToday: false,
    child: "all",
    room: "all",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetRewardsToggle, setResetRewardsToggle] = useState(false);
  const [verifyComment, setVerifyComment] = useState("");
  const [completionComment, setCompletionComment] = useState('');
  const [completingChoreId, setCompletingChoreId] = useState(null);
  const [verifyingChore, setVerifyingChore] = useState(null);

  // Form state for new/edit chore
  const [choreForm, setChoreForm] = useState({
    title: "",
    description: "",
    reward: "",
    timeframe: "daily",
    assignedTo: "",
    startDate: "",
    room: "",
    scheduledDays: null,
    assignees: [],
    rotationEnabled: false,
    rotationType: "completion",
    rotationSchedule: null
  });

  const getSelectedChildPayPeriod = () => {
    const child = familyMembers.find(m => m.uid === choreForm.assignedTo);
    return child ? parseFloat(child.payPerPeriod) || 0 : 0;
  };

  const getActiveChoreCount = async (childId) => {
    if (!childId) return 0;
    const allChores = await getAssignedChores(childId);
    // Count ALL chores regardless of status to maintain consistent reward amounts
    return allChores.length;
  };

  // Function to calculate frequency weight for reward distribution
  const getFrequencyWeight = (timeframe) => {
    switch (timeframe) {
      case 'daily':
        return 1; // Done every day, so smallest per-task reward
      case 'weekly':
        return 7; // ~7x more than daily
      case 'biweekly':
        return 15; // ~15x more than daily
      case 'monthly':
        return 30; // ~30x more than daily
      default:
        return 1;
    }
  };

  // Calculate reward based on child's pay per period and number of chores
  const calculateReward = async (childId) => {
    if (!childId) return 0;
    
    // Get the child's pay per period
    const child = familyMembers.find(m => m.uid === childId);
    if (!child) return 0;
    
    const payPerPeriod = parseFloat(child.payPerPeriod) || 0;

    try {
      // Get all chores for this child, including ones they're in rotation for
      const childChores = chores.filter(c => {
        // Check if child is directly assigned
        if (c.assignedTo === childId) return true;
        
        // Check if child is part of rotation
        if (c.rotationEnabled && Array.isArray(c.assignees)) {
          return c.assignees.includes(childId);
        }
        
        return false;
      });

      // Calculate total frequency weight
      const totalWeight = childChores.reduce((sum, c) => sum + getFrequencyWeight(c.timeframe), 0);
      
      // Calculate this chore's reward based on its frequency weight
      const choreWeight = getFrequencyWeight(choreForm.timeframe);
      
      // Add the new chore's weight if we're creating a new chore
      const finalTotalWeight = totalWeight + (selectedChore ? 0 : choreWeight);
      
      const newReward = finalTotalWeight > 0 ? (payPerPeriod * choreWeight) / finalTotalWeight : 0;
      return Number(newReward.toFixed(2));
    } catch (error) {
      console.error('Error calculating reward:', error);
      return 0;
    }
  };

  const handleAssignedToChange = async (event) => {
    const selectedAssignees = event.target.value;
    const reward = await calculateReward(selectedAssignees[0]); // Use first assignee for initial reward calculation
    setChoreForm({
      ...choreForm,
      assignedTo: selectedAssignees[0], // Set primary assignee
      assignees: selectedAssignees, // Store all assignees
      reward: reward
    });
  };

  const handleRotationTypeChange = (event) => {
    setChoreForm({
      ...choreForm,
      rotationType: event.target.value
    });
  };

  const handleRotationScheduleChange = (event) => {
    setChoreForm({
      ...choreForm,
      rotationSchedule: event.target.value
    });
  };

  useEffect(() => {
    // Only load chores if user exists and has a role
    if (user && role) {
      loadChores();

      // Only load family members and parents for parents
      if (role === "parent" && user.uid) {
        loadFamilyMembers(user.uid);
        loadAvailableParents();
      }

      // Set up rotation schedule checker
      const rotationChecker = setInterval(async () => {
        try {
          // Check each chore for schedule-based rotation
          const choresToRotate = chores.filter(chore => 
            chore.rotationEnabled && 
            chore.rotationType === 'schedule' &&
            chore.rotationSchedule
          );

          for (const chore of choresToRotate) {
            const lastRotation = chore.lastRotation?.toDate() || new Date(0);
            const now = new Date();
            let shouldRotate = false;

            switch (chore.rotationSchedule) {
              case 'daily':
                shouldRotate = now.getDate() !== lastRotation.getDate();
                break;
              case 'weekly':
                const weekDiff = Math.floor((now - lastRotation) / (7 * 24 * 60 * 60 * 1000));
                shouldRotate = weekDiff >= 1;
                break;
              case 'monthly':
                shouldRotate = now.getMonth() !== lastRotation.getMonth();
                break;
            }

            if (shouldRotate) {
              await rotateChoreAssignee(chore.id);
            }
          }
        } catch (error) {
          console.error('Error checking rotation schedules:', error);
        }
      }, 60000); // Check every minute

      return () => clearInterval(rotationChecker);
    }
  }, [role, user, filters.status, filters.timeframe, filters.dueToday, filters.child, filters.room]);

  useEffect(() => {
    if (familyMembers.length > 0) {
      loadChores();
    }
  }, [familyMembers]);

  // Function to update all chore amounts based on current state
  const updateAllChoreAmounts = async (childId) => {
    if (!childId) return;

    try {
      setLoading(true);
      
      // Get all chores for this child, including rotations
      const childChores = chores.filter(c => 
        c.assignedTo === childId || 
        (c.rotationEnabled && Array.isArray(c.assignees) && c.assignees.includes(childId))
      );

      // Calculate total frequency weight
      const totalWeight = childChores.reduce((sum, c) => sum + getFrequencyWeight(c.timeframe), 0);
      
      // Get child's pay per period
      const child = familyMembers.find(m => m.uid === childId);
      if (!child) return;
      
      const payPerPeriod = parseFloat(child.payPerPeriod) || 0;

      // Update each chore's reward
      for (const chore of childChores) {
        const choreWeight = getFrequencyWeight(chore.timeframe);
        const newReward = totalWeight > 0 ? (payPerPeriod * choreWeight) / totalWeight : 0;
        
        await updateChore(chore.id, {
          ...chore,
          reward: Number(newReward.toFixed(2))
        });
      }

      // Refresh chores list
      await loadChores();
    } catch (error) {
      console.error('Error updating chore amounts:', error);
      setError('Failed to update chore amounts');
    } finally {
      setLoading(false);
    }
  };

  // Effect to update amounts when chores or family members change
  useEffect(() => {
    if (familyMembers.length > 0 && chores.length > 0) {
      updateAllChoreAmounts();
    }
  }, [familyMembers, chores.length]); // Only trigger on family member changes or chore count changes

  // Load available parents
  const loadAvailableParents = async () => {
    try {
      // Get all family members
      const allMembers = await getFamilyMembers(user.uid);

      // Filter to only include parents (excluding current user)
      const parents = allMembers.filter(member => {
        const isParent = member.role === 'parent';
        const isNotCurrentUser = member.uid !== user.uid;
        const hasRequiredFields = member.uid && (member.displayName || member.email);
        return isParent && isNotCurrentUser && hasRequiredFields;
      });

      setAvailableParents(parents);
    } catch (error) {
      console.error("Error loading parents:", error);
      setError("Failed to load parents");
    }
  };

  const loadChores = async () => {
    try {
      setLoading(true);

      // Extract UID from user object
      const userId = user?.uid || user?.user?.uid;

      if (!userId) {
        throw new Error("Could not extract valid User ID");
      }

      let fetchedChores = [];

      if (role === "child") {
        fetchedChores = await getAssignedChores(userId);
      } else {
        fetchedChores = await getChores(userId);
      }

      // Apply filters
      const filteredChores = fetchedChores.filter((chore) => {
        // Status filter
        if (filters.status !== "all") {
          if (filters.status === "completed" && !chore.completed) return false;
          if (filters.status === "pending" && chore.completed) return false;
        }

        // Timeframe filter
        if (filters.timeframe !== "all" && chore.timeframe !== filters.timeframe)
          return false;

        // Child filter
        if (filters.child !== "all" && chore.assignedTo !== filters.child)
          return false;

        // Room filter
        if (filters.room !== "all" && chore.room !== filters.room)
          return false;

        // Due today filter
        if (filters.dueToday) {
          const today = new Date().toLocaleString("en-US", { weekday: "long" });

          // Check based on timeframe
          if (chore.timeframe === "daily") {
            return true; // Daily chores are always due
          }
          if (chore.timeframe === "weekly") {
            return chore.scheduledDays && chore.scheduledDays[today];
          }
          if (chore.timeframe === "monthly") {
            const currentDate = new Date().toISOString().split("T")[0];
            return chore.startDate === currentDate;
          }
          return false;
        }

        return true;
      });

      setChores(filteredChores);
    } catch (error) {
      console.error("Error loading chores:", error);
      setError(error.message || "Failed to load chores");
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyMembers = async (uid) => {
    if (role !== "parent") {
      console.warn("Not a parent role");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const members = await getFamilyMembers(uid);
      setFamilyMembers(members);

      // Load stats for each child
      const stats = {};
      for (const member of members) {
        if (member.role === "child" && member.uid) {
          const memberStats = await getChildStats(member.uid);
          stats[member.uid] = memberStats;
        }
      }
      setChildStats(stats);
    } catch (error) {
      console.error("Error loading family members:", error);
      setError(error.message || "Failed to load family members");
    } finally {
      setLoading(false);
    }
  };

  // Handle adding parent access
  const handleAddParentAccess = async () => {
    if (!selectedChore || !selectedParent) return;

    try {
      await addParentAccess(selectedChore.id, selectedParent);
      // Refresh chores list
      loadChores();
      setParentAccessDialog(false);
      setSelectedParent("");
    } catch (error) {
      console.error("Error adding parent access:", error);
      setError("Failed to add parent access");
    }
  };

  // Handle removing parent access
  const handleRemoveParentAccess = async (choreId, parentId) => {
    try {
      await removeParentAccess(choreId, parentId);
      // Refresh chores list
      loadChores();
    } catch (error) {
      console.error("Error removing parent access:", error);
      setError("Failed to remove parent access");
    }
  };

  const handleOpenDialog = (chore = null) => {
    if (chore) {
      const formData = {
        title: chore.title,
        description: chore.description,
        reward: chore.reward || 0,
        timeframe: chore.timeframe,
        assignedTo: chore.assignedTo,
        startDate: chore.startDate || "",
        room: chore.room || "",
        scheduledDays: chore.timeframe === "weekly" ? 
          (chore.scheduledDays || DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: false }), {})) 
          : null,
        assignees: chore.assignees || [],
        rotationEnabled: chore.rotationEnabled || false,
        rotationType: chore.rotationType || "completion",
        rotationSchedule: chore.rotationSchedule || null
      };

      setChoreForm(formData);
      setSelectedChore(chore);
    } else {
      setChoreForm({
        title: "",
        description: "",
        reward: 0,
        timeframe: "daily",
        assignedTo: "",
        startDate: "",
        room: "",
        scheduledDays: null,
        assignees: [],
        rotationEnabled: false,
        rotationType: "completion",
        rotationSchedule: null
      });
      setSelectedChore(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedChore(null);
    setChoreForm({
      title: "",
      description: "",
      reward: 0,
      timeframe: "daily",
      assignedTo: "",
      startDate: "",
      room: "",
      scheduledDays: null,
      assignees: [],
      rotationEnabled: false,
      rotationType: "completion",
      rotationSchedule: null
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (selectedChore) {
        await updateChore(selectedChore.id, choreForm);
      } else {
        await createChore(choreForm);
      }
      
      // Refresh chores to trigger the update effect
      const updatedChores = await getChores(user.uid);
      setChores(updatedChores);
      
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (choreId) => {
    try {
      await deleteChore(choreId);
      // Refresh chores to trigger the update effect
      const updatedChores = await getChores(user.uid);
      setChores(updatedChores);
    } catch (error) {
      setError(error.message);
    }
  };

  const incrementMonthlyDate = (date) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + 1);
    return newDate.toISOString().split("T")[0];
  };

  const handleMarkComplete = async (choreId) => {
    try {
      setLoading(true);
      const userId = user?.uid || user?.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      await markChoreComplete(choreId, userId, completionComment);
      
      // Get the chore data to check rotation settings
      const chore = chores.find(c => c.id === choreId);
      if (chore?.rotationEnabled && chore?.rotationType === 'completion') {
        await rotateChoreAssignee(choreId);
      }
      
      await loadChores();
      setCompletionComment('');
    } catch (error) {
      console.error("Error marking chore complete:", error);
      setError(error.message || "Failed to mark chore complete");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (choreId, isApproved) => {
    try {
      setLoading(true);
      setError("");
      await verifyChore(choreId, isApproved, user.uid, verifyComment);
      loadChores();
      setVerifyingChore(null);
      setVerifyComment("");
    } catch (error) {
      console.error("Error verifying chore:", error);
      setError(error.message || "Failed to verify chore");
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day) => {
    setChoreForm((prev) => {
      // Initialize scheduledDays if it doesn't exist
      const currentScheduledDays = prev.scheduledDays || 
        DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: false }), {});

      return {
        ...prev,
        scheduledDays: {
          ...currentScheduledDays,
          [day]: !currentScheduledDays[day],
        },
      };
    });
  };

  const handleManualChoreReset = async (choreId) => {
    try {
      setLoading(true);
      setError("");

      // Get the current chore data
      const chore = chores.find((chore) => chore.id === choreId);
      if (!chore) {
        throw new Error("Chore not found");
      }

      // Perform reset directly to pending status
      await updateChore(choreId, {
        ...chore,
        status: "pending",
        completedAt: null,
        verifiedAt: null,
        verifiedBy: null,
        completionComment: null,
        verificationComment: null,
        updatedAt: new Date(),
        resetRewards: resetRewardsToggle,
      });

      // Reload chores to reflect changes
      await loadChores();
    } catch (error) {
      console.error("Error manually resetting chore:", error);
      setError(error.message || "Failed to reset chore");
    } finally {
      setLoading(false);
    }
  };

  const getNextScheduledDay = (scheduledDays) => {
    if (!scheduledDays) return null;

    const today = new Date().toLocaleString("en-US", { weekday: "long" });
    const daysOrder = [...DAYS_OF_WEEK]; // Use our existing DAYS_OF_WEEK array

    // Find today's index
    const todayIndex = daysOrder.indexOf(today);

    // Check each day starting from tomorrow
    for (let i = 1; i <= 7; i++) {
      const nextIndex = (todayIndex + i) % 7;
      const nextDay = daysOrder[nextIndex];
      if (scheduledDays[nextDay]) {
        return nextDay;
      }
    }
    return null;
  };

  const handleOpenParentAccessDialog = (chore) => {
    setSelectedChore(chore);
    // Refresh available parents list
    loadAvailableParents();
    setParentAccessDialog(true);
  };

  const renderChoreComment = (chore) => {
    if (chore.completionComment) {
      return (
        <Box mt={2}>
          <Typography variant="subtitle2" color="textSecondary">
            Child's Comment:
          </Typography>
          <Typography variant="body2" style={{ fontStyle: 'italic' }}>
            "{chore.completionComment}"
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const handleRefresh = () => {
    loadChores();
  };

  const renderChildSelect = () => (
    <Box sx={{ mb: 2 }}>
      <FormControl fullWidth>
        <InputLabel>Assign To</InputLabel>
        <Select
          multiple
          value={choreForm.assignees}
          onChange={handleAssignedToChange}
          label="Assign To"
          disabled={loading}
          renderValue={(selected) => {
            const selectedChildren = familyMembers
              .filter(member => selected.includes(member.uid))
              .map(child => child.displayName || child.email || "Unnamed Child");
            return selectedChildren.join(", ");
          }}
        >
          {familyMembers
            .filter((member) => member.role === "child" && member.uid)
            .map((child) => (
              <MenuItem key={`child-select-${child.uid}`} value={child.uid}>
                <Checkbox checked={choreForm.assignees.indexOf(child.uid) > -1} />
                {child.displayName || child.email || "Unnamed Child"}
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      {choreForm.assignees.length > 1 && (
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={choreForm.rotationEnabled}
                onChange={(e) => setChoreForm({
                  ...choreForm,
                  rotationEnabled: e.target.checked
                })}
              />
            }
            label="Enable Rotation"
          />

          {choreForm.rotationEnabled && (
            <>
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel>Rotation Type</InputLabel>
                <Select
                  value={choreForm.rotationType}
                  onChange={handleRotationTypeChange}
                  label="Rotation Type"
                >
                  <MenuItem value="completion">Rotate After Completion</MenuItem>
                  <MenuItem value="schedule">Schedule-based Rotation</MenuItem>
                </Select>
              </FormControl>

              {choreForm.rotationType === "schedule" && (
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <InputLabel>Rotation Schedule</InputLabel>
                  <Select
                    value={choreForm.rotationSchedule}
                    onChange={handleRotationScheduleChange}
                    label="Rotation Schedule"
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  );

  const handleDuplicateChore = async () => {
    try {
      setLoading(true);
      const duplicatedChoreData = {
        ...selectedChore,
        assignedTo: "", // Clear the assigned user
        status: "pending",
        completedAt: null,
        verifiedAt: null,
        verifiedBy: null,
        completionComment: null,
        verificationComment: null
      };
      
      // Remove properties that shouldn't be duplicated
      delete duplicatedChoreData.id;
      delete duplicatedChoreData.uid;
      delete duplicatedChoreData.createdAt;
      delete duplicatedChoreData.updatedAt;

      await createChore(duplicatedChoreData);
      setOpenDialog(false);
      loadChores();
    } catch (error) {
      console.error("Error duplicating chore:", error);
      setError("Failed to duplicate chore");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ position: "relative", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 2 } }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Typography variant="h4">
                {role === "parent" ? "Manage Chores" : "My Chores"}
              </Typography>
              {role === "parent" && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleOpenDialog()}
                >
                  Add New Chore
                </Button>
              )}
            </Box>
          </Grid>

          {/* Filters */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      label="Status"
                      onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value })
                      }
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Child</InputLabel>
                    <Select
                      value={filters.child}
                      label="Child"
                      onChange={(e) =>
                        setFilters({ ...filters, child: e.target.value })
                      }
                    >
                      <MenuItem value="all">All Children</MenuItem>
                      {familyMembers
                        .filter((member) => member.role === "child")
                        .map((child) => (
                          <MenuItem key={child.uid} value={child.uid}>
                            {child.displayName}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Room</InputLabel>
                    <Select
                      value={filters.room}
                      label="Room"
                      onChange={(e) =>
                        setFilters({ ...filters, room: e.target.value })
                      }
                    >
                      <MenuItem value="all">All Rooms</MenuItem>
                      <MenuItem value="Kitchen">Kitchen</MenuItem>
                      <MenuItem value="Living Room">Living Room</MenuItem>
                      <MenuItem value="Bedroom">Bedroom</MenuItem>
                      <MenuItem value="Bathroom">Bathroom</MenuItem>
                      <MenuItem value="Garage">Garage</MenuItem>
                      <MenuItem value="Yard">Yard</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {role === "parent" ? (
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth>
                      <InputLabel>Timeframe</InputLabel>
                      <Select
                        value={filters.timeframe}
                        label="Timeframe"
                        onChange={(e) =>
                          setFilters({ ...filters, timeframe: e.target.value })
                        }
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                ) : null}

                <Grid item xs={12} sm={6} md={2}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.dueToday}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            dueToday: e.target.checked,
                          })
                        }
                      />
                    }
                    label="Due Today"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Chores List */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {chores.map((chore) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={chore.id}>
                    <Box
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        height: '100%',
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                        backgroundColor:
                          chore.status === "completed" ? "#f5f5f5" : "inherit",
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            mb: 1,
                            wordBreak: 'break-word',
                            fontSize: { xs: '1.1rem', sm: '1.25rem' }
                          }}
                        >
                          {chore.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="textSecondary" 
                          sx={{ 
                            mb: 2,
                            wordBreak: 'break-word'
                          }}
                        >
                          {chore.description}
                        </Typography>
                        {role === "parent" && (
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            {chore.rotationEnabled ? (
                              <>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  <Typography variant="body2" color="textSecondary">
                                    Rotating Chore - Current: {" "}
                                    {familyMembers.find((m) => m.uid === chore.assignedTo)?.displayName || "Unknown"}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    All Assignees:
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {chore.assignees?.map(childId => (
                                      <Chip
                                        key={childId}
                                        label={familyMembers.find(m => m.uid === childId)?.displayName || "Unknown"}
                                        size="small"
                                        variant={childId === chore.assignedTo ? "filled" : "outlined"}
                                        color={childId === chore.assignedTo ? "primary" : "default"}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              </>
                            ) : (
                              <>
                                Assigned to:{" "}
                                {familyMembers.find((m) => m.uid === chore.assignedTo)?.displayName || "Unknown"}
                              </>
                            )}
                          </Typography>
                        )}
                        {renderChoreComment(chore)}
                        {chore.verificationComment && chore.status === "verified" && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                              Parent's Feedback:
                            </Typography>
                            <Typography variant="body2" sx={{ pl: 2, fontStyle: 'italic', color: 'success.main' }}>
                              "{chore.verificationComment}"
                            </Typography>
                          </Box>
                        )}
                        {chore.verificationComment && chore.status === "pending" && chore.verifiedAt && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                              Rejection Reason:
                            </Typography>
                            <Typography variant="body2" sx={{ pl: 2, fontStyle: 'italic', color: 'error.main' }}>
                              "{chore.verificationComment}"
                            </Typography>
                          </Box>
                        )}
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Reward: ${chore.reward?.toFixed(2)}
                        </Typography>
                        <Typography variant="body2">
                          Status: {chore.status}
                        </Typography>
                        {chore.timeframe === "daily" && (
                          <Typography variant="body2">
                            Schedule: Daily
                          </Typography>
                        )}
                        {chore.timeframe === "weekly" && chore.scheduledDays && (
                          <Typography variant="body2">
                            Schedule: Weekly on{" "}
                            {Object.entries(chore.scheduledDays)
                              .filter(([, checked]) => checked)
                              .map(([day]) => day)
                              .join(", ") || "no days selected"}
                          </Typography>
                        )}
                        {chore.timeframe === "monthly" && (
                          <Typography variant="body2">
                            Schedule: Monthly starting {chore.startDate}
                          </Typography>
                        )}
                        {/* Show next due date based on timeframe */}
                        {chore.status === "pending" && (
                          <Typography variant="body2" color="error">
                            Due: {chore.timeframe === "monthly"
                              ? chore.startDate
                              : chore.timeframe === "daily"
                                ? "Today"
                                : Object.entries(chore.scheduledDays || {})
                                    .filter(([, checked]) => checked)
                                    .map(([day]) => day)
                                    .includes(new Date().toLocaleString("en-US", { weekday: "long" }))
                                ? "Today"
                                : getNextScheduledDay(chore.scheduledDays)
                                  ? `${getNextScheduledDay(chore.scheduledDays)}`
                                  : "No days scheduled"}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box
                        sx={{
                          display: "flex",
                          gap: { xs: 0.5, sm: 1 },
                          flexWrap: "wrap",
                          justifyContent: "flex-start",
                          mt: 2,
                          "& .MuiButton-root": {
                            minWidth: { xs: '70px', sm: 'auto' },
                            mb: 1,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            px: { xs: 1, sm: 2 }
                          },
                        }}
                      >
                        {role === "parent" && (
                          <>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenDialog(chore)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleDelete(chore.id)}
                            >
                              Delete
                            </Button>
                            {(chore.status === "verified" ||
                              chore.status === "completed") && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                onClick={() => handleManualChoreReset(chore.id)}
                                startIcon={<RefreshIcon />}
                              >
                                Reset
                              </Button>
                            )}
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenParentAccessDialog(chore)}
                            >
                              Manage Access
                            </Button>
                          </>
                        )}
                        {chore.status === "pending" && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => setCompletingChoreId(chore.id)}
                          >
                            Mark Complete
                          </Button>
                        )}
                        {chore.status === "completed" && !chore.verified && role === "parent" && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => setVerifyingChore(chore)}
                          >
                            Verify
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              {chores.length === 0 && (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <Typography variant="body1" color="textSecondary">
                    {role === "parent"
                      ? 'No chores created yet. Click "Add New Chore" to get started.'
                      : "No chores assigned to you yet."}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Add/Edit Chore Dialog - Only for parents */}
        {role === "parent" && (
          <Dialog
            open={openDialog}
            onClose={handleCloseDialog}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              {selectedChore ? "Edit Chore" : "Add New Chore"}
            </DialogTitle>
            <DialogContent>
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Title"
                      value={choreForm.title}
                      onChange={(e) =>
                        setChoreForm({ ...choreForm, title: e.target.value })
                      }
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={choreForm.description}
                      onChange={(e) =>
                        setChoreForm({
                          ...choreForm,
                          description: e.target.value,
                        })
                      }
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      margin="dense"
                      label="Reward Amount"
                      type="number"
                      fullWidth
                      value={choreForm.reward}
                      disabled
                      InputProps={{
                        startAdornment: <span>$</span>,
                      }}
                      helperText={
                        choreForm.assignedTo ? 
                        `Automatically calculated: $${getSelectedChildPayPeriod()} (pay per period) ÷ ${
                          chores.filter(c => 
                            c.assignedTo === choreForm.assignedTo && 
                            (c.status === 'pending' || c.status === 'completed')
                          ).length + (selectedChore ? 0 : 1)
                        } (total chores) = $${choreForm.reward}` :
                        'Select a child to calculate reward'
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Timeframe</InputLabel>
                      <Select
                        value={choreForm.timeframe}
                        label="Timeframe"
                        onChange={(e) => {
                          const newTimeframe = e.target.value;
                          setChoreForm(prev => ({
                            ...prev,
                            timeframe: newTimeframe,
                            // Initialize scheduledDays when switching to weekly, clear it otherwise
                            scheduledDays: newTimeframe === 'weekly' 
                              ? DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: false }), {})
                              : null,
                            // Clear startDate when switching from monthly
                            startDate: newTimeframe === 'monthly' ? prev.startDate : ''
                          }));
                        }}
                      >
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    {renderChildSelect()}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Room</InputLabel>
                      <Select
                        value={choreForm.room}
                        label="Room"
                        onChange={(e) =>
                          setChoreForm({
                            ...choreForm,
                            room: e.target.value,
                          })
                        }
                      >
                        <MenuItem value="">Select Room</MenuItem>
                        <MenuItem value="Kitchen">Kitchen</MenuItem>
                        <MenuItem value="Living Room">Living Room</MenuItem>
                        <MenuItem value="Bedroom">Bedroom</MenuItem>
                        <MenuItem value="Bathroom">Bathroom</MenuItem>
                        <MenuItem value="Garage">Garage</MenuItem>
                        <MenuItem value="Yard">Yard</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {choreForm.timeframe === "weekly" && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Schedule Days
                      </Typography>
                      <FormGroup row>
                        {DAYS_OF_WEEK.map((day) => (
                          <FormControlLabel
                            key={day}
                            control={
                              <Checkbox
                                checked={choreForm.scheduledDays?.[day] || false}
                                onChange={() => handleDayToggle(day)}
                              />
                            }
                            label={day}
                          />
                        ))}
                      </FormGroup>
                    </Grid>
                  )}
                  {choreForm.timeframe === "monthly" && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Start Date"
                        type="date"
                        value={choreForm.startDate}
                        onChange={(e) =>
                          setChoreForm({
                            ...choreForm,
                            startDate: e.target.value,
                          })
                        }
                        InputLabelProps={{
                          shrink: true,
                        }}
                        required={choreForm.timeframe === "monthly"}
                        fullWidth
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              {selectedChore && (
                <Button
                  onClick={handleDuplicateChore}
                  color="primary"
                  disabled={loading}
                >
                  Duplicate
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                color="primary"
                disabled={loading || !choreForm.title}
              >
                {selectedChore ? "Update" : "Create"}
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Parent Access Management Dialog */}
        <Dialog
          open={parentAccessDialog}
          onClose={() => setParentAccessDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Manage Parent Access</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Current Access:</Typography>
              <Box sx={{ mt: 1 }}>
                {/* Show current parent (creator) */}
                <Typography variant="body2" color="textSecondary">
                  {familyMembers.find(m => m.uid === selectedChore?.createdBy)?.displayName || "Unknown"} (Creator)
                </Typography>
                {/* Show other parents with access */}
                {selectedChore?.parentAccess?.map(parentId => {
                  const parent = familyMembers.find(m => m.uid === parentId);
                  return (
                    <Box key={parentId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        {parent?.displayName || parent?.email || "Unknown Parent"}
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemoveParentAccess(selectedChore.id, parentId)}
                      >
                        Remove
                      </Button>
                    </Box>
                  );
                })}
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1">Add Parent Access:</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Select Parent</InputLabel>
                    <Select
                      value={selectedParent}
                      label="Select Parent"
                      onChange={(e) => setSelectedParent(e.target.value)}
                    >
                      {availableParents
                        .filter(parent => !selectedChore?.parentAccess?.includes(parent.uid))
                        .map((parent) => (
                          <MenuItem key={parent.uid} value={parent.uid}>
                            {parent.displayName || parent.email}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    onClick={handleAddParentAccess}
                    disabled={!selectedParent}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setParentAccessDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Completion Comment Dialog */}
        <Dialog
          open={!!completingChoreId}
          onClose={() => setCompletingChoreId(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Complete Chore</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Add a comment about this chore example:(Checked, already cleaned)"
                multiline
                rows={3}
                value={completionComment}
                onChange={(e) => setCompletionComment(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCompletingChoreId(null)}>Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                handleMarkComplete(completingChoreId);
                setCompletingChoreId(null);
              }}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>

        {/* Verification Dialog */}
        <Dialog
          open={!!verifyingChore}
          onClose={() => setVerifyingChore(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Verify Chore Completion</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Add feedback or reason for approval/rejection"
                multiline
                rows={3}
                value={verifyComment}
                onChange={(e) => setVerifyComment(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVerifyingChore(null)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                handleVerify(verifyingChore.id, false);
              }}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                handleVerify(verifyingChore.id, true);
              }}
            >
              Approve
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      <Fab
        color="primary"
        aria-label="refresh"
        onClick={handleRefresh}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1000,
          boxShadow: 3,
        }}
      >
        <RefreshIcon />
      </Fab>
    </Box>
  );
};

export default ChoreManagement;
