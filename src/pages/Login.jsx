import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { loginUser, registerUser } from '../services/auth';
import { setUser, setRole, setError, setLoading } from '../store/slices/authSlice';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [userType, setUserType] = useState('parent');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(setError(''));
    dispatch(setLoading(true));

    try {
      let user;
      
      if (isRegistering) {
        console.log('Registering new user with role:', userType);
        user = await registerUser(formData.email, formData.password, formData.email.split('@')[0], userType);
      } else {
        console.log('Logging in user');
        user = await loginUser(formData.email, formData.password);
      }

      console.log('User data received:', user);
      
      if (!user) {
        throw new Error('No user data received');
      }

      if (!user.role) {
        console.error('No role found in user data:', user);
        throw new Error('User role not found. Please contact support.');
      }

      dispatch(setUser(user));
      dispatch(setRole(user.role));
      
      if (user.requiresPasswordChange) {
        navigate('/password-reset');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login/Register error:', err);
      dispatch(setError(err.message));
      dispatch(setLoading(false));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            {isRegistering ? 'Register for' : 'Login to'} Family Chore Chart
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal">
              <InputLabel>I am a...</InputLabel>
              <Select
                value={userType}
                label="I am a..."
                onChange={(e) => setUserType(e.target.value)}
              >
                <MenuItem value="parent">Parent</MenuItem>
                <MenuItem value="child">Child</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isRegistering ? 'Register' : 'Sign In')}
            </Button>
            <Button
              fullWidth
              color="secondary"
              onClick={() => setIsRegistering(!isRegistering)}
              disabled={loading}
            >
              {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
