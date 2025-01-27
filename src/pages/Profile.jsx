import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Grid,
  Divider,
  Avatar,
} from "@mui/material";
import { updatePassword, updateUserProfile } from "../services/auth";

const Profile = () => {
  const { user } = useSelector((state) => state.auth);

  // Profile update state
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileUpdateSuccess(false);

    try {
      await updateUserProfile({ displayName, photoURL: user?.photoURL || "" });
      setProfileUpdateSuccess(true);
    } catch (error) {
      setProfileError(error.message);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(error.message);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Profile Information Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" mb={4}>
              <Avatar
                src={user?.photoURL}
                alt={user?.displayName}
                sx={{ width: 80, height: 80, mr: 3 }}
              />
              <Box>
                <Typography variant="h4" gutterBottom>
                  Profile Settings
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {user?.email}
                </Typography>
              </Box>
            </Box>

            {profileError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {profileError}
              </Alert>
            )}

            {profileUpdateSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Profile updated successfully!
              </Alert>
            )}

            <Box component="form" onSubmit={handleProfileUpdate}>
              <TextField
                fullWidth
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                margin="normal"
                required
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
              >
                Update Profile
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Password Change Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Change Password
            </Typography>

            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passwordError}
              </Alert>
            )}

            {passwordSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Password updated successfully!
              </Alert>
            )}

            <Box component="form" onSubmit={handlePasswordChange}>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                margin="normal"
                required
              />

              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                margin="normal"
                required
              />

              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
              >
                Change Password
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
