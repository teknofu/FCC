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
  Drawer,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { AccountCircle, Menu as MenuIcon } from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice';
import { logoutUser } from '../../services/auth';

// Header component for navigation and user menu
const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const menuItems = [
    { title: 'Dashboard', path: '/' },
    { title: 'Chores', path: '/chores' },
    { title: 'Family', path: '/family', roles: ['parent'] },
    { title: 'Finances', path: '/finances', roles: ['parent'] }
  ];

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await logoutUser(); // Firebase logout
      dispatch(logout()); // Redux state cleanup
      handleClose();
      setMobileMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
    setMobileMenuOpen(false);
  };

  const renderMobileDrawer = () => (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={handleMobileMenuToggle}
      sx={{
        '& .MuiDrawer-paper': {
          width: 240,
          backgroundColor: theme.palette.primary.main,
          color: 'white',
        },
      }}
    >
      <List sx={{ pt: 2 }}>
        {menuItems.map((menuItem) => (
          (!menuItem.roles || menuItem.roles.includes(user?.role)) && (
            <ListItem
              key={menuItem.title}
              onClick={() => handleMenuItemClick(menuItem.path)}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <ListItemText primary={menuItem.title} />
            </ListItem>
          )
        ))}
        <ListItem onClick={handleProfile} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}>
          <ListItemText primary="Profile" />
        </ListItem>
        <ListItem onClick={handleSignOut} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}>
          <ListItemText primary="Sign Out" />
        </ListItem>
      </List>
    </Drawer>
  );

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ 
          flexGrow: 1, 
          textDecoration: 'none',
          color: 'inherit',
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}>
          Family Chore Chart
        </Typography>

        {isAuthenticated ? (
          <>
            {/* Desktop Menu */}
            {!isMobile && (
              <Box sx={{ mr: 2 }}>
                {menuItems.map((menuItem) => (
                  (!menuItem.roles || menuItem.roles.includes(user?.role)) && (
                    <Button
                      key={menuItem.title}
                      color="inherit"
                      component={Link}
                      to={menuItem.path}
                    >
                      {menuItem.title}
                    </Button>
                  )
                ))}
              </Box>
            )}
            
            {/* Mobile Menu Toggle */}
            {isMobile ? (
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                onClick={handleMobileMenuToggle}
              >
                <MenuIcon />
              </IconButton>
            ) : (
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
            )}

            {/* Desktop User Menu */}
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

            {/* Mobile Menu Drawer */}
            {renderMobileDrawer()}
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
