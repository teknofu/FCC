import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import PropTypes from 'prop-types';

const PaymentProcessor = ({ open, onClose, onConfirm, earnings, processing }) => {
  const totalAmount = earnings.reduce((sum, earning) => sum + earning.amount, 0);

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Payment</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          You are about to process payment for the following earnings:
        </Typography>
        <List>
          {earnings.map((earning) => (
            <ListItem key={earning.id}>
              <ListItemText
                primary={`$${earning.amount.toFixed(2)}`}
                secondary={`From ${earning.source.type}`}
              />
            </ListItem>
          ))}
        </List>
        <Typography variant="h6" sx={{ mt: 2 }}>
          Total Amount: ${totalAmount.toFixed(2)}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={processing}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={processing}
        >
          {processing ? <CircularProgress size={24} /> : 'Confirm Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

PaymentProcessor.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  earnings: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      source: PropTypes.shape({
        type: PropTypes.string.isRequired,
        referenceId: PropTypes.string
      }).isRequired
    })
  ).isRequired,
  processing: PropTypes.bool
};

PaymentProcessor.defaultProps = {
  processing: false
};

export default PaymentProcessor;
