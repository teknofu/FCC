import React from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Paper
} from '@mui/material';
import PropTypes from 'prop-types';

const PaymentProcessor = ({ onSubmit, unpaidEarnings = [], loading, disabled }) => {
  const totalAmount = (unpaidEarnings || []).reduce((sum, earning) => sum + (earning.amount || 0), 0);

  if (!unpaidEarnings?.length) {
    return (
      <Typography variant="body1" color="text.secondary">
        No unpaid earnings to process.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="body1" gutterBottom>
        The following earnings are ready to be processed:
      </Typography>
      <Paper variant="outlined" sx={{ mb: 2, maxHeight: 200, overflow: 'auto' }}>
        <List>
          {unpaidEarnings.map((earning) => (
            <ListItem key={earning.id || earning.uid}>
              <ListItemText
                primary={`$${(earning.amount || 0).toFixed(2)}`}
                secondary={earning.source?.type || 'Unknown source'}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Total Amount: ${totalAmount.toFixed(2)}
        </Typography>
        <Button
          onClick={onSubmit}
          variant="contained"
          color="primary"
          disabled={disabled || loading || !unpaidEarnings?.length}
        >
          {loading ? <CircularProgress size={24} /> : 'Process Payment'}
        </Button>
      </Box>
    </Box>
  );
};

PaymentProcessor.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  unpaidEarnings: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    uid: PropTypes.string,
    amount: PropTypes.number,
    source: PropTypes.shape({
      type: PropTypes.string
    })
  })),
  loading: PropTypes.bool,
  disabled: PropTypes.bool
};

PaymentProcessor.defaultProps = {
  unpaidEarnings: [],
  loading: false,
  disabled: false
};

export default PaymentProcessor;
