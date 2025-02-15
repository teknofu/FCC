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
  Grid,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      description: earning.source?.type === 'chore' 
        ? earning.source?.choreName || 'Unnamed Chore'
        : earning.source?.type || 'Unknown earning'
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

  const MobileTransactionCard = ({ transaction }) => (
    <Card sx={{ mb: 1, width: '100%' }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {transaction.description}
            </Typography>
            <Typography variant="subtitle2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {formatCurrency(transaction.amount)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {formatDate(transaction.date)}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label={transaction.type === 'earning' ? 'Earning' : 'Payment'}
                color={transaction.type === 'earning' ? 'primary' : 'success'}
                size="small"
                sx={{ height: 24, '& .MuiChip-label': { px: 1, fontSize: '0.75rem' } }}
              />
              {transaction.type === 'earning' ? (
                <Chip
                  label={transaction.paid ? 'Paid' : 'Pending'}
                  color={transaction.paid ? 'success' : 'warning'}
                  size="small"
                  sx={{ height: 24, '& .MuiChip-label': { px: 1, fontSize: '0.75rem' } }}
                />
              ) : (
                <Chip
                  label="Completed"
                  color="success"
                  size="small"
                  sx={{ height: 24, '& .MuiChip-label': { px: 1, fontSize: '0.75rem' } }}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Grid 
        container 
        spacing={{ xs: 1, sm: 2 }} 
        sx={{ 
          mb: { xs: 2, sm: 3 },
          px: { xs: 1, sm: 0 }
        }}
      >
        <Grid item xs={12} sm={6}>
          <Typography 
            variant="h6"
            sx={{
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              mb: { xs: 1, sm: 0 }
            }}
          >
            Transaction History
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl 
            fullWidth 
            size="small"
            sx={{
              minWidth: { xs: '100%', sm: 200 },
              float: { sm: 'right' }
            }}
          >
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

      {isMobile ? (
        // Mobile card view
        <Box sx={{ px: 1 }}>
          {filteredTransactions
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((transaction) => (
              <MobileTransactionCard key={transaction.id} transaction={transaction} />
            ))}
          {filteredTransactions.length === 0 && (
            <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
              No transactions found
            </Typography>
          )}
        </Box>
      ) : (
        // Desktop table view
        <TableContainer 
          component={Paper}
          sx={{
            mb: 2,
            '& .MuiTableCell-root': {
              px: { xs: 1, sm: 2 },
              py: { xs: 1, sm: 1.5 },
              '&:first-of-type': {
                pl: { xs: 1, sm: 2 }
              },
              '&:last-of-type': {
                pr: { xs: 1, sm: 2 }
              }
            }
          }}
        >
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
      )}

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredTransactions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          '.MuiTablePagination-select': {
            fontSize: { xs: '0.875rem', sm: '1rem' }
          },
          '.MuiTablePagination-displayedRows': {
            fontSize: { xs: '0.875rem', sm: '1rem' }
          },
          px: { xs: 1, sm: 2 }
        }}
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
