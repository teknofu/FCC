import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';

const initialFormState = {
  title: '',
  description: '',
  reward: '',
  timeframe: 'daily',
  assignedTo: '',
  room: ''
};

const ChoreForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  editChore = null,
  children = [] 
}) => {
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (editChore) {
      setFormData({
        title: editChore.title || '',
        description: editChore.description || '',
        reward: editChore.reward || '',
        timeframe: editChore.timeframe || 'daily',
        assignedTo: editChore.assignedTo || '',
        room: editChore.room || ''
      });
    } else {
      setFormData(initialFormState);
    }
  }, [editChore]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      reward: Number(formData.reward)
    });
    setFormData(initialFormState);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editChore ? 'Edit Chore' : 'Add New Chore'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Chore Title"
                value={formData.title}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="reward"
                label="Reward Amount ($)"
                type="number"
                value={formData.reward}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.5 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Timeframe</InputLabel>
                <Select
                  name="timeframe"
                  value={formData.timeframe}
                  onChange={handleChange}
                  label="Timeframe"
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="one-time">One-time</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Room</InputLabel>
                <Select
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  label="Room"
                >
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Assign To</InputLabel>
                <Select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  label="Assign To"
                >
                  {children.map((child) => (
                    <MenuItem key={child.id} value={child.id}>
                      {child.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {editChore ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ChoreForm;
