import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  createChore, 
  getChores, 
  updateChore, 
  deleteChore,
  markChoreComplete,
  verifyChore 
} from '../services/chores';
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
  DialogActions
} from '@mui/material';

const ChoreManagement = () => {
  const { user, role } = useSelector((state) => state.auth);
  const [chores, setChores] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedChore, setSelectedChore] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    timeframe: 'all'
  });

  // Form state for new/edit chore
  const [choreForm, setChoreForm] = useState({
    title: '',
    description: '',
    points: 0,
    timeframe: 'daily',
    assignedTo: ''
  });

  useEffect(() => {
    loadChores();
  }, [filters]);

  const loadChores = async () => {
    try {
      const loadedChores = await getChores(filters);
      setChores(loadedChores);
    } catch (error) {
      console.error('Error loading chores:', error);
      // TODO: Add error notification
    }
  };

  const handleOpenDialog = (chore = null) => {
    if (chore) {
      setChoreForm({
        title: chore.title,
        description: chore.description,
        points: chore.points,
        timeframe: chore.timeframe,
        assignedTo: chore.assignedTo
      });
      setSelectedChore(chore);
    } else {
      setChoreForm({
        title: '',
        description: '',
        points: 0,
        timeframe: 'daily',
        assignedTo: ''
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
      points: 0,
      timeframe: 'daily',
      assignedTo: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedChore) {
        await updateChore(selectedChore.id, choreForm);
      } else {
        await createChore(choreForm);
      }
      handleCloseDialog();
      loadChores();
    } catch (error) {
      console.error('Error saving chore:', error);
      // TODO: Add error notification
    }
  };

  const handleDelete = async (choreId) => {
    try {
      await deleteChore(choreId);
      loadChores();
    } catch (error) {
      console.error('Error deleting chore:', error);
      // TODO: Add error notification
    }
  };

  const handleMarkComplete = async (choreId) => {
    try {
      await markChoreComplete(choreId, user.uid);
      loadChores();
    } catch (error) {
      console.error('Error marking chore complete:', error);
      // TODO: Add error notification
    }
  };

  const handleVerify = async (choreId, approved) => {
    try {
      await verifyChore(choreId, user.uid, approved);
      loadChores();
    } catch (error) {
      console.error('Error verifying chore:', error);
      // TODO: Add error notification
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4">Chore Management</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => handleOpenDialog()}
            >
              Add New Chore
            </Button>
          </Box>
        </Grid>

        {/* Filters */}
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
                  borderRadius: 1 
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h6">{chore.title}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {chore.description}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="body2">
                      Points: {chore.points}
                    </Typography>
                    <Typography variant="body2">
                      Status: {chore.status}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box display="flex" gap={1}>
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
                      {chore.status === 'pending' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleMarkComplete(chore.id)}
                        >
                          Complete
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
          </Paper>
        </Grid>
      </Grid>

      {/* Add/Edit Chore Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
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
                  label="Points"
                  type="number"
                  value={choreForm.points}
                  onChange={(e) => setChoreForm({ ...choreForm, points: parseInt(e.target.value) })}
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
                <TextField
                  fullWidth
                  label="Assigned To (User ID)"
                  value={choreForm.assignedTo}
                  onChange={(e) => setChoreForm({ ...choreForm, assignedTo: e.target.value })}
                />
              </Grid>
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
    </Container>
  );
};

export default ChoreManagement;
