import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { createAllowance, deleteAllowance } from '../../services/allowances';

/**
 * Component for managing allowance settings for a child
 */
const AllowanceSettings = ({ 
  allowances, 
  selectedChild,
  paymentSchedule,
  onAllowanceChange,
  loading 
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    description: ''
  });

  const handleOpenDialog = (allowance = null) => {
    if (allowance) {
      setFormData({
        amount: allowance.amount.toString(),
        description: allowance.description || ''
      });
    } else {
      setFormData({
        amount: '',
        description: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
    setFormData({
      amount: '',
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChild?.uid) {
      setError('No child selected');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      const allowanceData = {
        childId: selectedChild.uid,
        amount,
        description: formData.description,
        frequency: paymentSchedule?.frequency || 'biweekly'
      };

      await createAllowance(allowanceData);
      handleCloseDialog();
      if (onAllowanceChange) onAllowanceChange();
    } catch (error) {
      console.error('Error creating allowance:', error);
      setError(error.message || 'Failed to create allowance');
    }
  };

  const handleDelete = async (allowanceId) => {
    if (!window.confirm('Are you sure you want to delete this allowance?')) {
      return;
    }

    try {
      await deleteAllowance(allowanceId);
      if (onAllowanceChange) onAllowanceChange();
    } catch (error) {
      console.error('Error deleting allowance:', error);
      setError(error.message || 'Failed to delete allowance');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Current Allowances
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading || !selectedChild}
        >
          Add Allowance
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {allowances.map((allowance) => (
          <Grid item xs={12} sm={6} md={4} key={allowance.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" component="div">
                    {formatCurrency(allowance.amount)}
                  </Typography>
                  <Box>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(allowance)}
                      disabled={loading}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(allowance.id)}
                      disabled={loading}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  {allowance.description || 'No description'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Frequency: {allowance.frequency || 'Not set'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {allowances.length === 0 && !loading && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>
          No allowances set up yet. Click "Add Allowance" to get started.
        </Typography>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {formData.id ? 'Edit Allowance' : 'Add Allowance'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              inputProps={{ min: 0, step: 0.01 }}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

AllowanceSettings.propTypes = {
  allowances: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      description: PropTypes.string,
      frequency: PropTypes.string
    })
  ).isRequired,
  selectedChild: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    displayName: PropTypes.string
  }),
  paymentSchedule: PropTypes.shape({
    frequency: PropTypes.string,
    nextPaymentDue: PropTypes.object
  }),
  onAllowanceChange: PropTypes.func,
  loading: PropTypes.bool
};

AllowanceSettings.defaultProps = {
  allowances: [],
  selectedChild: null,
  paymentSchedule: null,
  loading: false
};

export default AllowanceSettings;
