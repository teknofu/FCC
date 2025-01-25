import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import PropTypes from 'prop-types';

const PaymentProcessor = ({ onSubmit, unpaidEarnings = [], loading, disabled }) => {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [paymentNote, setPaymentNote] = useState('');
  const [markAllPaid, setMarkAllPaid] = useState(true);
  const totalAmount = (unpaidEarnings || []).reduce((sum, earning) => sum + (earning.amount || 0), 0);

  const handleSubmit = () => {
    onSubmit({
      note: paymentNote,
      markAllPaid,
      amount: totalAmount
    });
    setOpenConfirm(false);
    setPaymentNote('');
  };

  if (!unpaidEarnings?.length) {
    return (
      <Alert severity="info">
        No unpaid earnings to process. When your child completes chores or earns allowance,
        their earnings will appear here for payment processing.
      </Alert>
    );
  }

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Use this section to record when you pay your child their earnings. 
        Click "Process Payment" to mark earnings as paid and record the transaction.
      </Alert>
      
      <Typography variant="body1" gutterBottom>
        Unpaid earnings to process:
      </Typography>
      <Paper variant="outlined" sx={{ mb: 2, maxHeight: 200, overflow: 'auto' }}>
        <List>
          {unpaidEarnings.map((earning) => (
            <ListItem key={earning.id || earning.uid}>
              <ListItemText
                primary={`$${(earning.amount || 0).toFixed(2)}`}
                secondary={
                  <>
                    {earning.source?.type || 'Unknown source'}
                    {earning.createdAt && ` - ${new Date(earning.createdAt).toLocaleDateString()}`}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Total to Pay: ${totalAmount.toFixed(2)}
        </Typography>
        <Button
          onClick={() => setOpenConfirm(true)}
          variant="contained"
          color="primary"
          size="large"
          disabled={disabled || loading || !unpaidEarnings?.length}
        >
          {loading ? <CircularProgress size={24} /> : 'Process Payment'}
        </Button>
      </Box>

      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You are about to record a payment of ${totalAmount.toFixed(2)} to your child.
          </Typography>
          
          <TextField
            fullWidth
            label="Payment Note (optional)"
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            margin="normal"
            placeholder="e.g., Paid in cash, Transferred to savings account"
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={markAllPaid}
                onChange={(e) => setMarkAllPaid(e.target.checked)}
              />
            }
            label="Mark all listed earnings as paid"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>
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
    }),
    createdAt: PropTypes.object
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
