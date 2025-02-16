import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  TextField,
  Card,
  CardContent,
  Button,
  Grid,
  Divider
} from "@mui/material";
import {
  getPaymentSchedule,
  getEarningsHistory,
  getTotalEarnings,
  getPaymentHistory,
  setupPaymentSchedule,
  recordPayment,
} from "../services/chores";
import { getFamilyMembers, updateChild } from "../services/family";
import ChildSelector from "../components/Financial/ChildSelector";
import EarningsOverview from "../components/Financial/EarningsOverview";
import TransactionHistory from "../components/Financial/TransactionHistory";
import PaymentScheduleForm from "../components/Payments/PaymentScheduleForm"; // Import PaymentScheduleForm
import PaymentProcessor from "../components/Payments/PaymentProcessor"; // Import PaymentProcessor
import PropTypes from "prop-types";

/**
 * TabPanel component for tab content
 */
function TabPanel({ children, value, index, ...other }) {
  TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
  };
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`financial-tabpanel-${index}`}
      aria-labelledby={`financial-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Main Financial Management component that consolidates earnings, payments, and history
 */
const FinancialManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);

  // Financial data states
  const [paymentSchedule, setPaymentSchedule] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [payPerPeriod, setPayPerPeriod] = useState(0);
  const [newPayPerPeriod, setNewPayPerPeriod] = useState(0);

  useEffect(() => {
    if (user?.role === "parent" && user?.uid) {
      loadFamilyMembers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChild?.uid) {
      loadFinancialData();
    }
  }, [selectedChild]);

  useEffect(() => {
    setNewPayPerPeriod(payPerPeriod);
  }, [payPerPeriod]);

  const loadFamilyMembers = async () => {
    try {
      setLoading(true);
      const members = await getFamilyMembers(user.uid);
      setFamilyMembers(members);

      // Auto-select if only one child
      if (members.length === 1) {
        const child = members.find((m) => m.role === "child");
        if (child) setSelectedChild(child);
      }
    } catch (error) {
      console.error("Error loading family members:", error);
      setError("Failed to load family members");
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialData = async () => {
    if (!selectedChild?.uid) return;

    setLoading(true);
    setError("");

    try {
      const [schedule, earningsData, total, payments] = await Promise.all([
        getPaymentSchedule(selectedChild.uid),
        getEarningsHistory(selectedChild.uid),
        getTotalEarnings(selectedChild.uid),
        getPaymentHistory(selectedChild.uid),
      ]);

      setPaymentSchedule(schedule);
      setEarnings(earningsData);
      setTotalEarnings(total);
      setPaymentHistory(payments);
      setPayPerPeriod(selectedChild.payPerPeriod || 0);
    } catch (error) {
      console.error("Error loading financial data:", error);
      setError("Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleScheduleSubmit = async (scheduleData) => {
    if (!selectedChild?.uid) return;

    setLoading(true);
    setError("");

    try {
      await setupPaymentSchedule({
        childId: selectedChild.uid,
        ...scheduleData,
      });
      await loadFinancialData();
    } catch (error) {
      console.error("Error updating payment schedule:", error);
      setError("Failed to update payment schedule");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (paymentData) => {
    if (!selectedChild?.uid) return;

    setLoading(true);
    setError("");

    try {
      await recordPayment({
        childId: selectedChild.uid,
        earnings: earnings.filter((e) => !e.paid),
        amount: paymentData.amount,
        note: paymentData.note,
        markAllPaid: paymentData.markAllPaid,
      });
      await loadFinancialData();
    } catch (error) {
      console.error("Error processing payment:", error);
      setError("Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  const handlePayPerPeriodChange = async () => {
    if (newPayPerPeriod === payPerPeriod) return;
    
    try {
      setLoading(true);
      await updateChild(selectedChild.uid, { payPerPeriod: newPayPerPeriod });
      setPayPerPeriod(newPayPerPeriod);
    } catch (error) {
      console.error("Error updating pay per period:", error);
      setError("Failed to update pay per period");
      setNewPayPerPeriod(payPerPeriod); // Reset to original value on error
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

  if (user?.role !== "parent") {
    return (
      <Container>
        <Alert severity="error">
          Only parents can access the financial management page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Financial Management
      </Typography>

      <Paper sx={{ mb: 3, p: 3 }}>
        <ChildSelector
          familyMembers={familyMembers}
          selectedChild={selectedChild}
          onChildSelect={setSelectedChild}
          loading={loading}
          error={error}
        />
      </Paper>

      {selectedChild && (
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            
            <Tab label="Earnings & Payments" />
            <Tab label="History" />
          </Tabs>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              

              <TabPanel value={activeTab} index={0}>
                <Grid container spacing={3}>
                  {/* Top Row */}
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Pay Per Period Settings
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                          <TextField
                            label="Maximum Pay Per Period"
                            type="number"
                            value={newPayPerPeriod}
                            onChange={(e) => setNewPayPerPeriod(parseFloat(e.target.value) || 0)}
                            fullWidth
                            InputProps={{
                              startAdornment: <span>$</span>,
                            }}
                            helperText="Maximum amount child can earn per period through chores"
                          />
                          <Button
                            variant="contained"
                            onClick={handlePayPerPeriodChange}
                            disabled={newPayPerPeriod === payPerPeriod || loading}
                            sx={{ height: 'fit-content', mt: -2 }}
                          >
                            Save
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Payment Schedule
                        </Typography>
                        <PaymentScheduleForm
                          schedule={paymentSchedule}
                          onSubmit={handleScheduleSubmit}
                          loading={loading}
                          disabled={!selectedChild}
                        />
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Bottom Row */}
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Earnings Summary
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body1">
                            Total Earnings: {formatCurrency(totalEarnings)}
                          </Typography>
                          <Typography variant="body1">
                            Unpaid Earnings: {formatCurrency(totalEarnings - paymentHistory.reduce((acc, payment) => acc + payment.amount, 0))}
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" gutterBottom>
                          Recent Earnings
                        </Typography>
                        {earnings.length > 0 ? (
                          earnings.slice(0, 5).map((earning) => (
                            <Box key={earning.id} sx={{ mb: 1 }}>
                              <Typography variant="body2">
                                {formatCurrency(earning.amount)} - {earning.source?.type || 'Unknown'}
                                {earning.paid && (
                                  <Typography component="span" color="success.main" sx={{ ml: 1 }}>
                                    (Paid)
                                  </Typography>
                                )}
                              </Typography>
                            </Box>
                          ))
                        ) : (
                          <Typography color="text.secondary">No recent earnings</Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <PaymentProcessor
                      selectedChild={selectedChild}
                      unpaidEarnings={earnings.filter(e => !e.paid)}
                      onSubmit={handlePaymentSubmit}
                      loading={loading}
                    />
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <TransactionHistory
                  earnings={earnings}
                  payments={paymentHistory}
                  loading={loading}
                />
              </TabPanel>
            </>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default FinancialManagement;
