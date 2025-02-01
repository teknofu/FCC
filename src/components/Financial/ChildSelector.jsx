import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert
} from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Reusable component for selecting a child from the family members list
 */
const ChildSelector = ({
  familyMembers,
  selectedChild = null,
  onChildSelect,
  loading = false,
  error = '',
  label = "Select Child"
}) => {
  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <FormControl fullWidth>
        <InputLabel>{label}</InputLabel>
        <Select
          value={selectedChild?.uid || ''}
          label={label}
          onChange={(e) => {
            const child = familyMembers.find(m => m.uid === e.target.value);
            onChildSelect(child || null);
          }}
          disabled={loading}
        >
          {familyMembers
            .filter(member => member.role === 'child' && member.uid)
            .map(child => (
              <MenuItem key={child.uid} value={child.uid}>
                {child.displayName || child.email || 'Unnamed Child'}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
      
      {familyMembers.length === 0 && !loading && !error && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          No children found in your family. Add children in the Family Management page.
        </Typography>
      )}
    </Box>
  );
};

ChildSelector.propTypes = {
  familyMembers: PropTypes.arrayOf(
    PropTypes.shape({
      uid: PropTypes.string.isRequired,
      displayName: PropTypes.string,
      email: PropTypes.string,
      role: PropTypes.string.isRequired
    })
  ).isRequired,
  selectedChild: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    email: PropTypes.string
  }),
  onChildSelect: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  label: PropTypes.string
};

export default ChildSelector;
