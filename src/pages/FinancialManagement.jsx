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
} from "@mui/material";
import {
  getPaymentSchedule,
  getEarningsHistory,
  getChildAllowances,
  getTotalEarnings,
  getPaymentHistory,
  setupPaymentSchedule,
  recordPayment,
} from "../services/allowances";
import { getFamilyMembers } from "../services/family";
import ChildSelector from "../components/Financial/ChildSelector";
import AllowanceSettings from "../components/Financial/AllowanceSettings";
import EarningsOverview from "../components/Financial/EarningsOverview";
import TransactionHistory from "../components/Financial/TransactionHistory";
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
 * Main Financial Management component that consolidates allowances, payments, and history
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
  const [allowances, setAllowances] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState([]);

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
      const [
        scheduleData,
        allowanceData,
        earningsData,
        earningsTotal,
        paymentsData,
      ] = await Promise.all([
        getPaymentSchedule(selectedChild.uid),
        getChildAllowances(selectedChild.uid),
        getEarningsHistory(selectedChild.uid),
        getTotalEarnings(selectedChild.uid),
        getPaymentHistory(selectedChild.uid),
      ]);

      setPaymentSchedule(scheduleData);
      setAllowances(allowanceData);
      setEarnings(earningsData);
      setTotalEarnings(earningsTotal);
      setPaymentHistory(paymentsData);
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
            <Tab label="Allowances" />
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
                <AllowanceSettings
                  allowances={allowances}
                  selectedChild={selectedChild}
                  paymentSchedule={paymentSchedule}
                  onAllowanceChange={loadFinancialData}
                  loading={loading}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <EarningsOverview
                  selectedChild={selectedChild}
                  earnings={earnings}
                  totalEarnings={totalEarnings}
                  paymentSchedule={paymentSchedule}
                  onScheduleSubmit={handleScheduleSubmit}
                  onPaymentSubmit={handlePaymentSubmit}
                  loading={loading}
                  error={error}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
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
