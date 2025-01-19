import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
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
  const [error, setError] = useState('');
  const [familyMembers, setFamilyMembers] = useState([]);
  const [childStats, setChildStats] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    dateOfBirth: '',
    allowance: ''
  });

  useEffect(() => {
    if (user?.uid) {
      loadFamilyMembers();
    }
  }, [user]);

  const loadFamilyMembers = async () => {
    try {
      setLoading(true);
      setError('');
      const members = await getFamilyMembers(user.uid);
      setFamilyMembers(members);
      
      // Load stats for each child
      const stats = {};
      for (const member of members) {
        if (member.role === 'child') {
          stats[member.id] = await getChildStats(member.id);
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

  const handleOpenDialog = (child = null) => {
    if (child) {
      setFormData({
        displayName: child.displayName || '',
        email: child.email || '',
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
    setError('');

    try {
      if (selectedChild) {
        await updateChildAccount(selectedChild.id, formData);
      } else {
        await addChildAccount(user.uid, formData);
      }
      handleCloseDialog();
      loadFamilyMembers();
    } catch (error) {
      console.error('Error saving child account:', error);
      setError(error.message || 'Failed to save child account');
    }
  };

  const handleRemoveChild = async (childId) => {
    if (!window.confirm('Are you sure you want to remove this child account?')) {
      return;
    }

    try {
      await removeChildAccount(childId);
      loadFamilyMembers();
    } catch (error) {
      console.error('Error removing child account:', error);
      setError(error.message || 'Failed to remove child account');
    }
  };

  if (!user?.uid) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          You must be logged in to view this page
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Family Management</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => handleOpenDialog()}
        >
          Add Child Account
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {familyMembers.map((member) => (
            <Grid item xs={12} sm={6} md={4} key={member.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {member.displayName}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {member.email}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Role: {member.role}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Earned: ${member.earnings?.toFixed(2) || '0.00'}
                  </Typography>
                  {childStats[member.id] && (
                    <Box mt={2}>
                      <Typography variant="body2">
                        Chores Completed: {childStats[member.id].totalChoresCompleted}
                      </Typography>
                      <Typography variant="body2">
                        Rewards Earned: ${childStats[member.id].totalRewardsEarned?.toFixed(2) || '0.00'}
                      </Typography>
                      <Typography variant="body2">
                        This Week: {childStats[member.id].weeklyChoresCompleted} chores
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(member)}
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveChild(member.id)}
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
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedChild ? 'Edit Child Account' : 'Add Child Account'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Display Name"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              margin="normal"
              required
            />
            {!selectedChild && (
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                margin="normal"
                required
              />
            )}
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              fullWidth
              label="Weekly Allowance"
              type="number"
              value={formData.allowance}
              onChange={(e) => setFormData({ ...formData, allowance: e.target.value })}
              margin="normal"
              InputProps={{
                startAdornment: <span>$</span>,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedChild ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FamilyManagement;
