import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Button,
  Avatar,
} from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice';
import { logoutUser } from '../../services/auth';

// Header component for navigation and user menu
const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = useState(null);

  const pages = [
    { title: 'Dashboard', path: '/' },
    { title: 'Chores', path: '/chores' },
    { title: 'Family', path: '/family', roles: ['parent'] },
    { title: 'Allowances', path: '/allowances', roles: ['parent'] },
    { title: 'Payments', path: '/payments', roles: ['parent'] },
    { title: 'Admin', path: '/admin', roles: ['parent'] }
  ];

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    try {
      await logoutUser(); // Firebase logout
      dispatch(logout()); // Redux state cleanup
      handleClose();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ 
          flexGrow: 1, 
          textDecoration: 'none',
          color: 'inherit'
        }}>
          Family Chore Chart
        </Typography>

        {isAuthenticated ? (
          <>
            <Box sx={{ mr: 2 }}>
              {pages.map((page) => (
                <Button
                  key={page.title}
                  color="inherit"
                  component={Link}
                  to={page.path}
                  hidden={page.roles && !page.roles.includes(user?.role)}
                >
                  {page.title}
                </Button>
              ))}
            </Box>
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
            >
              {user?.photoURL ? (
                <Avatar src={user.photoURL} alt={user.displayName} />
              ) : (
                <AccountCircle />
              )}
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleProfile}>Profile</MenuItem>
              <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
            </Menu>
          </>
        ) : (
          <Button 
            color="inherit" 
            component={Link} 
            to="/login"
          >
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
