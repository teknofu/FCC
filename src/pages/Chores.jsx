import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import ChoreList from '../components/Chores/ChoreList';
import ChoreForm from '../components/Chores/ChoreForm';
import {
  setChores,
  addChore,
  updateChore,
  deleteChore,
  setChoreFilters,
  setLoading,
  setError
} from '../store/slices/choresSlice';
import {
  createChore,
  updateChore as updateChoreAPI,
  deleteChore as deleteChoreAPI,
  getChores,
  markChoreComplete,
  verifyChore,
  getAssignedChores
} from '../services/chores';

const Chores = () => {
  const dispatch = useDispatch();
  const { user, role } = useSelector((state) => state.auth);
  const { chores, loading, filters } = useSelector((state) => state.chores);
  const [openChoreForm, setOpenChoreForm] = useState(false);
  const [editingChore, setEditingChore] = useState(null);
  const [children] = useState([]); // TODO: Fetch children from Firebase

  useEffect(() => {
    loadChores();
  }, [filters]);

  const loadChores = async () => {
    try {
      dispatch(setLoading(true));
      let fetchedChores;
      
      console.log('Current user details:', { 
        uid: user.uid, 
        role: role, 
        email: user.email 
      });
      
      if (role === 'child') {
        // For child users, get chores assigned to them
        console.log('Fetching chores for child user');
        fetchedChores = await getAssignedChores(user.uid);
      } else {
        // For parent users, use the existing getChores method
        console.log('Fetching chores for parent user');
        fetchedChores = await getChores(user.uid);
      }
      
      console.log('Fetched chores:', fetchedChores);
      dispatch(setChores(fetchedChores));
    } catch (error) {
      console.error('Error loading chores:', error);
      dispatch(setError(error.message));
    }
  };

  const handleCreateChore = async (choreData) => {
    try {
      const newChore = await createChore(choreData);
      dispatch(addChore(newChore));
      setOpenChoreForm(false);
    } catch (error) {
      dispatch(setError(error.message));
    }
  };

  const handleUpdateChore = async (choreData) => {
    try {
      const updatedChore = await updateChoreAPI(editingChore.id, choreData);
      dispatch(updateChore(updatedChore));
      setOpenChoreForm(false);
      setEditingChore(null);
    } catch (error) {
      dispatch(setError(error.message));
    }
  };

  const handleDeleteChore = async (choreId) => {
    try {
      await deleteChoreAPI(choreId);
      dispatch(deleteChore(choreId));
    } catch (error) {
      dispatch(setError(error.message));
    }
  };

  const handleCompleteChore = async (choreId) => {
    try {
      await markChoreComplete(choreId, user.uid);
      loadChores(); // Reload to get updated status
    } catch (error) {
      dispatch(setError(error.message));
    }
  };

  const handleVerifyChore = async (choreId, approved) => {
    try {
      await verifyChore(choreId, user.uid, approved);
      loadChores(); // Reload to get updated status
    } catch (error) {
      dispatch(setError(error.message));
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    dispatch(setChoreFilters({ [name]: value }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Chores</Typography>
          {role === 'parent' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenChoreForm(true)}
            >
              Add Chore
            </Button>
          )}
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filters.status}
                label="Status"
                onChange={handleFilterChange}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Timeframe</InputLabel>
              <Select
                name="timeframe"
                value={filters.timeframe}
                label="Timeframe"
                onChange={handleFilterChange}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="one-time">One-time</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <ChoreList
            chores={chores}
            onComplete={handleCompleteChore}
            onVerify={(choreId) => handleVerifyChore(choreId, true)}
            onReject={(choreId) => handleVerifyChore(choreId, false)}
            onEdit={(chore) => {
              setEditingChore(chore);
              setOpenChoreForm(true);
            }}
            onDelete={handleDeleteChore}
          />
        )}
      </Paper>

      <ChoreForm
        open={openChoreForm}
        onClose={() => {
          setOpenChoreForm(false);
          setEditingChore(null);
        }}
        onSubmit={editingChore ? handleUpdateChore : handleCreateChore}
        editChore={editingChore}
        children={children}
      />
    </Container>
  );
};

export default Chores;
