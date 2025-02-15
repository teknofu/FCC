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
    <Container 
      maxWidth="md" 
      sx={{ 
        py: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 2 }
      }}
    >
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Profile Information Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: { xs: 2, sm: 4 } }}>
            <Box 
              sx={{
                display: "flex", 
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'center', sm: 'flex-start' },
                mb: { xs: 2, sm: 4 },
                textAlign: { xs: 'center', sm: 'left' }
              }}
            >
              <Avatar
                src={user?.photoURL}
                alt={user?.displayName}
                sx={{ 
                  width: { xs: 64, sm: 80 }, 
                  height: { xs: 64, sm: 80 }, 
                  mb: { xs: 2, sm: 0 },
                  mr: { xs: 0, sm: 3 }
                }}
              />
              <Box>
                <Typography 
                  variant="h4" 
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1.5rem', sm: '2.125rem' },
                    wordBreak: 'break-word'
                  }}
                >
                  Profile Settings
                </Typography>
                <Typography 
                  variant="body1" 
                  color="textSecondary"
                  sx={{
                    wordBreak: 'break-word',
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
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

            <Box 
              component="form" 
              onSubmit={handleProfileUpdate}
              sx={{
                '& .MuiTextField-root': {
                  mb: { xs: 1.5, sm: 2 }
                }
              }}
            >
              <TextField
                fullWidth
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ 
                  mt: { xs: 1, sm: 2 },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Update Profile
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Password Change Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: { xs: 2, sm: 4 } }}>
            <Typography 
              variant="h5" 
              gutterBottom
              sx={{
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                mb: 2
              }}
            >
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

            <Box 
              component="form" 
              onSubmit={handlePasswordChange}
              sx={{
                '& .MuiTextField-root': {
                  mb: { xs: 1.5, sm: 2 }
                }
              }}
            >
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />

              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />

              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ 
                  mt: { xs: 1, sm: 2 },
                  width: { xs: '100%', sm: 'auto' }
                }}
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
