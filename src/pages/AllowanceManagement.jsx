import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  createAllowance,
  getChildAllowances,
  getEarningsHistory,
  getTotalEarnings,
  processAllowancePayments
} from '../services/allowances';
import { getFamilyMembers } from '../services/family';

const AllowanceManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [familyMembers, setFamilyMembers] = useState([]);
  const [allowances, setAllowances] = useState({});
  const [earnings, setEarnings] = useState({});
  const [totals, setTotals] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [formData, setFormData] = useState({
    type: 'base',
    amount: '',
    frequency: 'weekly'
  });

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load family members
      const members = await getFamilyMembers(user.uid);
      const children = members.filter(m => m.role === 'child');
      setFamilyMembers(children);

      // Load data for each child
      const allowanceData = {};
      const earningsData = {};
      const totalData = {};

      for (const child of children) {
        if (!child?.uid) {
          console.error('Child missing uid:', child);
          continue;
        }
        allowanceData[child.uid] = await getChildAllowances(child.uid);
        earningsData[child.uid] = await getEarningsHistory(child.uid);
        totalData[child.uid] = await getTotalEarnings(child.uid);
        
        // Process any due allowance payments
        await processAllowancePayments(child.uid);
      }

      setAllowances(allowanceData);
      setEarnings(earningsData);
      setTotals(totalData);
    } catch (error) {
      console.error('Error loading allowance data:', error);
      setError(error.message || 'Failed to load allowance data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (child = null) => {
    setSelectedChild(child);
    setFormData({
      type: 'base',
      amount: '',
      frequency: 'weekly'
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedChild(null);
    setFormData({
      type: 'base',
      amount: '',
      frequency: 'weekly'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedChild?.uid) {
      setError('No child selected');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await createAllowance({
        childId: selectedChild.uid,
        type: formData.type,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency
      });

      handleCloseDialog();
      await loadData();
    } catch (error) {
      console.error('Error creating allowance:', error);
      setError(error.message || 'Failed to create allowance');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!user?.uid) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          You must be logged in to view this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Allowance Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {familyMembers.map((child) => (
            <Card key={child.uid} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {child.displayName || child.email || 'Unnamed Child'}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog(child)}
                  >
                    Add Allowance
                  </Button>
                </Box>

                {allowances[child.uid]?.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Frequency</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allowances[child.uid].map((allowance) => (
                          <TableRow key={allowance.id}>
                            <TableCell>{allowance.type}</TableCell>
                            <TableCell>{formatCurrency(allowance.amount)}</TableCell>
                            <TableCell>{allowance.frequency}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(child, allowance)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No allowances set up yet.
                  </Typography>
                )}

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Earnings: {formatCurrency(totals[child.uid] || 0)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}

          <Dialog open={openDialog} onClose={handleCloseDialog}>
            <DialogTitle>
              {selectedChild ? `Add Allowance for ${selectedChild.displayName || selectedChild.email}` : 'Add Allowance'}
            </DialogTitle>
            <DialogContent>
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    label="Type"
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <MenuItem value="base">Base Allowance</MenuItem>
                    <MenuItem value="bonus">Bonus</MenuItem>
                    <MenuItem value="special">Special</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  sx={{ mb: 2 }}
                  inputProps={{ min: 0, step: 0.01 }}
                />

                <FormControl fullWidth>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={formData.frequency}
                    label="Frequency"
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  >
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="biweekly">Bi-weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Save'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Container>
  );
};

export default AllowanceManagement;
