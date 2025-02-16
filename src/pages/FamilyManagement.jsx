import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  addChildAccount,
  updateChildAccount,
  removeChildAccount,
  subscribeFamilyMembers,
} from "../services/family";

const FamilyManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    payPerPeriod: "",
    role: "child"
  });

  useEffect(() => {
    let unsubscribeMembers = () => {};

    const setupSubscriptions = async () => {
      if (user?.uid) {
        try {
          // Subscribe to family members updates
          unsubscribeMembers = subscribeFamilyMembers(user.uid, (members) => {
            setFamilyMembers(members);
            setLoading(false);
          });
        } catch (error) {
          console.error("Error setting up subscriptions:", error);
          setError(error.message || "Failed to load family members");
          setLoading(false);
        }
      }
    };

    setupSubscriptions();

    // Cleanup subscriptions
    return () => {
      unsubscribeMembers();
    };
  }, [user]);

  const handleOpenDialog = (child = null) => {
    if (child) {
      setFormData({
        firstName: child.firstName || "",
        lastName: child.lastName || "",
        email: child.email || "",
        dateOfBirth: child.dateOfBirth || "",
        payPerPeriod: child.payPerPeriod || "",
        role: "child"
      });
      setSelectedChild(child);
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        dateOfBirth: "",
        payPerPeriod: "",
        role: "child"
      });
      setSelectedChild(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedChild(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      dateOfBirth: "",
      payPerPeriod: "",
      role: "child"
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (selectedChild) {
        await updateChildAccount(selectedChild.uid, formData);
      } else {
        await addChildAccount(user.uid, formData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving child account:", error);
      setError(error.message || "Failed to save child account");
    }
  };

  const handleRemoveChild = async (childUid) => {
    if (!childUid) {
      setError("Invalid child account selected");
      return;
    }

    if (
      !window.confirm("Are you sure you want to remove this child account?")
    ) {
      return;
    }

    try {
      setError(""); // Clear any previous errors
      const result = await removeChildAccount(childUid);
      if (result.success) {
        // Update the local state to remove the child
        setFamilyMembers((prevMembers) =>
          prevMembers.filter((member) => member.uid !== childUid)
        );
      }
    } catch (error) {
      console.error("Error removing child account:", error);
      setError(error.message || "Failed to remove child account");
    }
  };

  if (!user?.uid) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">You must be logged in to view this page</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Family Management</Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {familyMembers.map((member) => (
            <Grid item xs={12} sm={6} md={4} key={member.uid}>
              <Card>
                <CardContent sx={{ pb: 1 }}>
                  <Typography variant="h6" align="center" sx={{ mb: 0 }}>
                    {member.displayName || "Unnamed Child"}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "center", pt: 0 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(member)}
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveChild(member.uid)}
                    title="Remove"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedChild ? "Edit Child Account" : "Add Child Account"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              margin="normal"
              required
            />
            {!selectedChild && (
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                margin="normal"
                required
              />
            )}
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) =>
                setFormData({ ...formData, dateOfBirth: e.target.value })
              }
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              fullWidth
              label="Pay Per Period"
              type="number"
              value={formData.payPerPeriod}
              onChange={(e) =>
                setFormData({ ...formData, payPerPeriod: e.target.value })
              }
              margin="normal"
              InputProps={{
                startAdornment: <span>$</span>,
              }}
              helperText="Maximum amount child can earn per period through chores"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedChild ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FamilyManagement;
