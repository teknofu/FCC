import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assessment as StatsIcon
} from '@mui/icons-material';
import {
  getFamilyMembers,
  addChildAccount,
  updateChildAccount,
  removeChildAccount,
  getChildStats
} from '../services/family';

const FamilyManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childStats, setChildStats] = useState({});
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    dateOfBirth: '',
    allowance: ''
  });

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    try {
      setLoading(true);
      const members = await getFamilyMembers(user.uid);
      setFamilyMembers(members);
      
      // Load stats for each child
      const stats = {};
      for (const member of members) {
        stats[member.id] = await getChildStats(member.id);
      }
      setChildStats(stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (child = null) => {
    if (child) {
      setFormData({
        displayName: child.displayName,
        email: child.email,
        dateOfBirth: child.dateOfBirth || '',
        allowance: child.allowance || ''
      });
      setSelectedChild(child);
    } else {
      setFormData({
        displayName: '',
        email: '',
        dateOfBirth: '',
        allowance: ''
      });
      setSelectedChild(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedChild(null);
    setFormData({
      displayName: '',
      email: '',
      dateOfBirth: '',
      allowance: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (selectedChild) {
        await updateChildAccount(selectedChild.id, formData);
      } else {
        const result = await addChildAccount(user.uid, formData);
        // Show temporary password to parent
        alert(`Temporary password for ${formData.displayName}: ${result.temporaryPassword}`);
      }
      handleCloseDialog();
      loadFamilyMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveChild = async (childId) => {
    if (window.confirm('Are you sure you want to remove this child from your family?')) {
      try {
        setLoading(true);
        await removeChildAccount(childId);
        loadFamilyMembers();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading && !familyMembers.length) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Family Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Child
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {familyMembers.map((child) => (
            <Grid item xs={12} sm={6} md={4} key={child.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {child.displayName}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {child.email}
                  </Typography>
                  {childStats[child.id] && (
                    <Box mt={2}>
                      <Typography variant="body2">
                        Chores Completed: {childStats[child.id].totalChoresCompleted}
                      </Typography>
                      <Typography variant="body2">
                        Rewards Earned: ${childStats[child.id].totalRewardsEarned}
                      </Typography>
                      <Typography variant="body2">
                        This Week: {childStats[child.id].weeklyChoresCompleted} chores
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(child)}
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveChild(child.id)}
                    title="Remove"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {selectedChild ? 'Edit Child Account' : 'Add Child Account'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    name="displayName"
                    label="Name"
                    value={formData.displayName}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="email"
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={!!selectedChild}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="dateOfBirth"
                    label="Date of Birth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="allowance"
                    label="Weekly Allowance ($)"
                    type="number"
                    value={formData.allowance}
                    onChange={handleChange}
                    fullWidth
                    inputProps={{ min: 0, step: 0.5 }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Saving...' : (selectedChild ? 'Update' : 'Create')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default FamilyManagement;
