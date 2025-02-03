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
    reward: 0,
    timeframe: "daily",
    assignedTo: "",
    startDate: "",
    room: "",
  });

  useEffect(() => {
    // Only load chores if user exists and has a role
    if (user && role) {
      loadChores();

      // Only load family members and parents for parents
      if (role === "parent" && user.uid) {
        loadFamilyMembers(user.uid);
        loadAvailableParents();
      }
    }
  }, [role, user, filters.status, filters.timeframe, filters.dueToday, filters.child, filters.room]);

  useEffect(() => {
    const resetRecurringChores = async () => {
      // Only run for parents who can manage chores
      if (role !== "parent" || !chores.length) return;

      // Get current day
      const currentDay = new Date().toLocaleString("en-US", {
        weekday: "long",
      });

      // Filter chores that need reset
      const choresToReset = chores.filter(
        (chore) =>
          // Must be a daily recurring chore
          chore.timeframe === "daily" &&
          // Must have been verified yesterday or earlier
          chore.status === "verified" &&
          // Check if the last verification was not today
          new Date(chore.verifiedAt?.toDate?.() || 0).toDateString() !==
            new Date().toDateString()
      );

      // Reset each chore that meets the criteria
      for (const choreToReset of choresToReset) {
        try {
          await updateChore(choreToReset.id, {
            ...choreToReset,
            status: "pending",
            completedAt: null,
            verifiedAt: null,
            verifiedBy: null,
            completionComment: null,
            updatedAt: new Date(),
          });
          console.log(`Reset recurring chore: ${choreToReset.title}`);
        } catch (error) {
          console.error(`Failed to reset chore ${choreToReset.id}:`, error);
        }
      }

      // Reload chores after reset
      if (choresToReset.length > 0) {
        loadChores();
      }
    };

    // Run reset logic once per day
    const lastResetDate = localStorage.getItem("lastChoreResetDate");
    const today = new Date().toDateString();

    if (lastResetDate !== today) {
      resetRecurringChores();
      localStorage.setItem("lastChoreResetDate", today);
    }
  }, [chores, role, user]);

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

        // Due today filter
        if (filters.dueToday) {
          const today = new Date().toLocaleString("en-US", { weekday: "long" });

          // Daily chores are always due
          if (chore.timeframe === "daily") return true;

          // Weekly chores - check if today is in scheduledDays
          if (chore.timeframe === "weekly") {
            return chore.scheduledDays && chore.scheduledDays[today];
          }

          // Monthly chores - check if today matches startDate
          if (chore.timeframe === "monthly") {
            const currentDate = new Date().toISOString().split("T")[0];
            return chore.startDate === currentDate;
          }

          return false;
        }

        // Child filter
        if (filters.child !== "all" && chore.assignedTo !== filters.child)
          return false;

        // Room filter
        if (filters.room !== "all" && chore.room !== filters.room)
          return false;

        return true;
      });

      setChores(filteredChores);
      setLoading(false);
    } catch (error) {
      console.error("Error loading chores:", error);
      setError(error.message || "Failed to load chores");
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
      };

      // Only include scheduledDays for weekly chores
      if (chore.timeframe === "weekly") {
        formData.scheduledDays = chore.scheduledDays ||
          DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: false }), {});
      }

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
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // Validate startDate for monthly chores
    if (choreForm.timeframe === "monthly" && !choreForm.startDate) {
      setError("Please select a start date for monthly chores.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const choreData = {
        ...choreForm,
        reward: parseFloat(choreForm.reward) || 0,
        createdBy: user.uid,
      };

      // Remove scheduledDays for daily chores
      if (choreData.timeframe === "daily") {
        delete choreData.scheduledDays;
      }

      if (selectedChore) {
        await updateChore(selectedChore.id, choreData);
      } else {
        await createChore(choreData);
      }

      handleCloseDialog();
      loadChores();
    } catch (error) {
      console.error("Error saving chore:", error);
      setError(error.message || "Failed to save chore");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (choreId) => {
    if (!window.confirm("Are you sure you want to delete this chore?")) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      await deleteChore(choreId);
      loadChores();
    } catch (error) {
      console.error("Error deleting chore:", error);
      setError(error.message || "Failed to delete chore");
    } finally {
      setLoading(false);
    }
  };

  const incrementMonthlyDate = (date) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + 1);
    return newDate.toISOString().split("T")[0];
  };

  const handleMarkComplete = async (choreId) => {
    setCompletingChoreId(choreId);
  };

  const handleSubmitCompletion = async () => {
    if (!completingChoreId) return;
    
    try {
      setLoading(true);
      const userId = user?.uid || user?.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      await markChoreComplete(completingChoreId, userId, completionComment);
      await loadChores();
      setCompletionComment('');
      setCompletingChoreId(null);
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
    setChoreForm((prev) => ({
      ...prev,
      scheduledDays: {
        ...prev.scheduledDays,
        [day]: !prev.scheduledDays[day],
      },
    }));
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

  return (
    <Box sx={{ position: "relative", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
              {chores.map((chore) => (
                <Box
                  key={chore.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: "1px solid #e0e0e0",
                    borderRadius: 1,
                    backgroundColor:
                      chore.status === "completed" ? "#f5f5f5" : "inherit",
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box>
                          <Typography variant="h6">{chore.title}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {chore.description}
                          </Typography>
                          {role === "parent" && (
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                              Assigned to:{" "}
                              {familyMembers.find((m) => m.uid === chore.assignedTo)
                                ?.displayName || "Unknown"}
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
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2">
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
                                ? `Next ${getNextScheduledDay(chore.scheduledDays)}`
                                : "No days scheduled"}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box
                        display="flex"
                        gap={1}
                        flexWrap="wrap"
                        justifyContent="flex-start"
                        sx={{
                          "& .MuiButton-root": {
                            minWidth: "auto",
                            mb: 1,
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
                              >
                                Reset
                              </Button>
                            )}
                          </>
                        )}
                        {chore.status === "pending" && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleMarkComplete(chore.id)}
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
                        {role === "parent" && (
                          <Button
                            size="small"
                            onClick={() => handleOpenParentAccessDialog(chore)}
                          >
                            Manage Access
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              ))}
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
                      fullWidth
                      label="Reward"
                      type="number"
                      value={choreForm.reward}
                      onChange={(e) =>
                        setChoreForm({ ...choreForm, reward: e.target.value })
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Timeframe</InputLabel>
                      <Select
                        value={choreForm.timeframe}
                        label="Timeframe"
                        onChange={(e) =>
                          setChoreForm({
                            ...choreForm,
                            timeframe: e.target.value,
                          })
                        }
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
              <Button
                onClick={handleSubmit}
                variant="contained"
                color="primary"
              >
                {selectedChore ? "Update" : "Create"}
              </Button>
            </DialogActions>
          </Dialog>
        )}
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
