import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  createChore, 
  getChores, 
  getAssignedChores,
  updateChore, 
  deleteChore,
  markChoreComplete,
  verifyChore,
  getChildStats
} from '../services/chores';
import { getFamilyMembers } from '../services/family';
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
  InputAdornment
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Fab } from '@mui/material';

// Days of the week for scheduling
const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

const ChoreManagement = () => {
  const { user, role } = useSelector((state) => state.auth);
  const [chores, setChores] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [childStats, setChildStats] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedChore, setSelectedChore] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    timeframe: 'all'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state for new/edit chore
  const [choreForm, setChoreForm] = useState({
    title: '',
    description: '',
    reward: 0,
    timeframe: 'daily',
    assignedTo: '',
    scheduledDays: DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: false }), {})
  });

  useEffect(() => {
    // Only load chores if user exists and has a role
    if (user && role) {
      loadChores();
      
      // Only load family members for parents
      if (role === 'parent' && user.uid) {
        loadFamilyMembers(user.uid);
      }
    }
  }, [role, user]);

  const loadChores = async () => {
    try {
      setLoading(true);
      
      // Extract UID from user object
      const userId = user?.uid || user?.user?.uid;

      if (!userId) {
        throw new Error('Could not extract valid User ID');
      }

      let fetchedChores = [];
      
      if (role === 'child') {
        fetchedChores = await getAssignedChores(userId);
      } else {
        fetchedChores = await getChores(userId);
      }

      // Apply filters
      let filteredChores = fetchedChores;
      
      if (filters.status !== 'all') {
        filteredChores = filteredChores.filter(chore => 
          chore.status === filters.status
        );
      }
      
      if (filters.timeframe !== 'all') {
        filteredChores = filteredChores.filter(chore => 
          chore.timeframe === filters.timeframe
        );
      }
      
      setChores(filteredChores);
      setLoading(false);
    } catch (error) {
      console.error('Error loading chores:', error);
      setError(error.message || 'Failed to load chores');
      setLoading(false);
    }
  };

  const loadFamilyMembers = async (uid) => {
    if (role !== 'parent') {
      console.warn('Not a parent role');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const members = await getFamilyMembers(uid);
      console.log(`Loaded ${members.length} family members`);
      setFamilyMembers(members);
      
      // Load stats for each child
      const stats = {};
      for (const member of members) {
        if (member.role === 'child') {
          const memberStats = await getChildStats(member.id);
          console.log(`Loaded stats for child: ${member.id}`, memberStats);
          stats[member.id] = memberStats;
        }
      }
      setChildStats(stats);
    } catch (error) {
      console.error('Error loading family members:', error);
      setError(error.message || 'Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (chore = null) => {
    if (chore) {
      setChoreForm({
        title: chore.title,
        description: chore.description,
        reward: chore.reward || 0,
        timeframe: chore.timeframe,
        assignedTo: chore.assignedTo,
        scheduledDays: chore.scheduledDays || DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: false }), {})
      });
      setSelectedChore(chore);
    } else {
      setChoreForm({
        title: '',
        description: '',
        reward: 0,
        timeframe: 'daily',
        assignedTo: '',
        scheduledDays: DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: false }), {})
      });
      setSelectedChore(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedChore(null);
    setChoreForm({
      title: '',
      description: '',
      reward: 0,
      timeframe: 'daily',
      assignedTo: '',
      scheduledDays: DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: false }), {})
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      if (selectedChore) {
        await updateChore(selectedChore.id, {
          ...choreForm,
          updatedAt: new Date()
        });
        console.log(`Chore ${selectedChore.id} updated successfully`);
      } else {
        const newChore = await createChore({
          ...choreForm,
          createdBy: user.uid,
          status: 'pending'
        });
        console.log(`New chore created with ID: ${newChore.id}`);
      }
      handleCloseDialog();
      loadChores();
    } catch (error) {
      console.error('Error in chore submission:', error);
      setError(error.message || 'Failed to save chore');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (choreId) => {
    if (!window.confirm('Are you sure you want to delete this chore?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      await deleteChore(choreId);
      loadChores();
    } catch (error) {
      console.error('Error deleting chore:', error);
      setError(error.message || 'Failed to delete chore');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (choreId) => {
    try {
      // Ensure we have a user and user ID
      if (!user || !user.uid) {
        throw new Error('User not authenticated');
      }

      const updatedChore = await markChoreComplete(choreId, user.uid);
      
      // Update the local chores list
      setChores(prevChores => 
        prevChores.map(chore => 
          chore.id === choreId ? { ...chore, ...updatedChore } : chore
        )
      );
    } catch (error) {
      console.error('Error marking chore complete:', error);
      setError(error.message || 'Failed to mark chore complete');
    }
  };

  const handleVerify = async (choreId, isApproved) => {
    try {
      setLoading(true);
      setError('');
      await verifyChore(choreId, isApproved, user.uid);
      loadChores();
    } catch (error) {
      console.error('Error verifying chore:', error);
      setError(error.message || 'Failed to verify chore');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day) => {
    setChoreForm(prev => ({
      ...prev,
      scheduledDays: {
        ...prev.scheduledDays,
        [day]: !prev.scheduledDays[day]
      }
    }));
  };

  const showAddButton = role === 'parent';

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4">
                {role === 'parent' ? 'Manage Chores' : 'My Chores'}
              </Typography>
              {showAddButton && (
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

          {/* Filters - Only show status filter for children */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      label="Status"
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="verified">Verified</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {role === 'parent' && (
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Timeframe</InputLabel>
                      <Select
                        value={filters.timeframe}
                        label="Timeframe"
                        onChange={(e) => setFilters({ ...filters, timeframe: e.target.value })}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}
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
                    border: '1px solid #e0e0e0', 
                    borderRadius: 1,
                    backgroundColor: chore.status === 'completed' ? '#f5f5f5' : 'inherit'
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <Typography variant="h6">{chore.title}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {chore.description}
                      </Typography>
                      {role === 'parent' && (
                        <Typography variant="body2">
                          Assigned to: {familyMembers.find(m => m.id === chore.assignedTo)?.displayName || 'Unknown'}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2">
                        Reward: ${chore.reward?.toFixed(2)}
                      </Typography>
                      <Typography variant="body2">
                        Status: {chore.status}
                      </Typography>
                      {chore.timeframe === 'daily' && (
                        <Typography variant="body2">
                          Days: {Object.entries(chore.scheduledDays || {})
                            .filter(([, checked]) => checked)
                            .map(([day]) => day)
                            .join(', ')}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box display="flex" gap={1}>
                        {role === 'parent' && (
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
                          </>
                        )}
                        {chore.status === 'pending' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleMarkComplete(chore.id)}
                          >
                            Mark Complete
                          </Button>
                        )}
                        {chore.status === 'completed' && role === 'parent' && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleVerify(chore.id, true)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              onClick={() => handleVerify(chore.id, false)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              {chores.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="textSecondary">
                    {role === 'parent' 
                      ? 'No chores created yet. Click "Add New Chore" to get started.'
                      : 'No chores assigned to you yet.'
                    }
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Add/Edit Chore Dialog - Only for parents */}
        {role === 'parent' && (
          <Dialog 
            open={openDialog} 
            onClose={handleCloseDialog}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              {selectedChore ? 'Edit Chore' : 'Add New Chore'}
            </DialogTitle>
            <DialogContent>
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Title"
                      value={choreForm.title}
                      onChange={(e) => setChoreForm({ ...choreForm, title: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={choreForm.description}
                      onChange={(e) => setChoreForm({ ...choreForm, description: e.target.value })}
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
                      onChange={(e) => setChoreForm({ ...choreForm, reward: e.target.value })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
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
                        onChange={(e) => setChoreForm({ ...choreForm, timeframe: e.target.value })}
                      >
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Assign To</InputLabel>
                      <Select
                        value={choreForm.assignedTo}
                        label="Assign To"
                        onChange={(e) => setChoreForm({ ...choreForm, assignedTo: e.target.value })}
                        required
                      >
                        {familyMembers.map((member) => (
                          <MenuItem key={member.id} value={member.id}>
                            {member.displayName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  {choreForm.timeframe === 'daily' && (
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
                                checked={choreForm.scheduledDays[day]}
                                onChange={() => handleDayToggle(day)}
                              />
                            }
                            label={day}
                          />
                        ))}
                      </FormGroup>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained" color="primary">
                {selectedChore ? 'Update' : 'Create'}
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
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          boxShadow: 3
        }}
      >
        <RefreshIcon />
      </Fab>
    </Box>
  );
};

export default ChoreManagement;
