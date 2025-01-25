import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Component for displaying transaction history including both earnings and payments
 */
const TransactionHistory = ({ 
  earnings = [], 
  payments = [], 
  loading 
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filter, setFilter] = useState('all');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }
      return new Date(timestamp.toDate()).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Combine and sort all transactions
  const allTransactions = [
    ...earnings.map(earning => ({
      ...earning,
      type: 'earning',
      date: earning.createdAt,
      description: earning.source?.type || 'Unknown earning'
    })),
    ...payments.map(payment => ({
      ...payment,
      type: 'payment',
      date: payment.createdAt,
      description: 'Payment processed'
    }))
  ].sort((a, b) => {
    const dateA = a.date?.toDate?.() || a.date || new Date(0);
    const dateB = b.date?.toDate?.() || b.date || new Date(0);
    return dateB - dateA;
  });

  // Filter transactions based on selected filter
  const filteredTransactions = allTransactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Typography variant="h6">
            Transaction History
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter</InputLabel>
            <Select
              value={filter}
              label="Filter"
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="all">All Transactions</MenuItem>
              <MenuItem value="earning">Earnings Only</MenuItem>
              <MenuItem value="payment">Payments Only</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.type === 'earning' ? 'Earning' : 'Payment'}
                      color={transaction.type === 'earning' ? 'primary' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {transaction.type === 'earning' ? (
                      <Chip
                        label={transaction.paid ? 'Paid' : 'Pending'}
                        color={transaction.paid ? 'success' : 'warning'}
                        size="small"
                      />
                    ) : (
                      <Chip
                        label="Completed"
                        color="success"
                        size="small"
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            {filteredTransactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">
                    No transactions found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredTransactions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

TransactionHistory.propTypes = {
  earnings: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      createdAt: PropTypes.object,
      source: PropTypes.shape({
        type: PropTypes.string
      }),
      paid: PropTypes.bool
    })
  ),
  payments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      createdAt: PropTypes.object
    })
  ),
  loading: PropTypes.bool
};

TransactionHistory.defaultProps = {
  earnings: [],
  payments: [],
  loading: false
};

export default TransactionHistory;
