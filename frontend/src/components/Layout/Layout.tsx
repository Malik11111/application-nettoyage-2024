import React, { ReactNode } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  LocationOn,
  Assignment,
  ExitToApp,
  AccountCircle,
  Schedule,
} from '@mui/icons-material';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import OrganizationSelector from '../OrganizationSelector/OrganizationSelector';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { logout } from '../../store/slices/authSlice';

interface LayoutProps {
  children: ReactNode;
}

const DRAWER_WIDTH = 240;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  const { user } = useAppSelector((state) => state.auth);
  
  const [drawerOpen, setDrawerOpen] = React.useState(!isMobile);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    handleMenuClose();
  };

  const menuItems = [
    { text: '🔱 Administration Générale', icon: <Dashboard />, path: '/super-admin', roles: ['SUPER_ADMIN'] },
    { text: 'Tableau de bord', icon: <Dashboard />, path: '/dashboard', roles: ['ADMIN'] },
    { text: 'Agents', icon: <People />, path: '/users', roles: ['ADMIN'] },
    { text: 'Lieux', icon: <LocationOn />, path: '/locations', roles: ['ADMIN'] },
    { text: 'Générateur Planning', icon: <Schedule />, path: '/planning-generator', roles: ['ADMIN'] },
    { text: 'Tâches', icon: <Assignment />, path: '/tasks', roles: ['ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Gestion Entretien
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem
            key={item.text}
            onClick={() => {
              navigate(item.path);
              if (isMobile) setDrawerOpen(false);
            }}
            sx={{
              cursor: 'pointer',
              backgroundColor: location.pathname === item.path ? 'action.selected' : 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  // Interface simplifiée pour les agents (pas de menu de navigation)
  if (user?.role === 'AGENT') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <AppBar position="fixed">
          <Toolbar>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Mes tâches du jour
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 2 }}>
                {user?.name}
              </Typography>
              <ThemeToggle />
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  <AccountCircle />
                </Avatar>
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
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <ExitToApp fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Déconnexion</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 2,
            mt: '64px',
          }}
        >
          {children}
        </Box>
      </Box>
    );
  }

  // Interface complète pour ADMIN et SUPER_ADMIN
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {location.pathname === '/dashboard' && 'Tableau de bord'}
            {location.pathname === '/users' && 'Gestion des agents'}
            {location.pathname === '/locations' && 'Gestion des lieux'}
            {location.pathname === '/planning-generator' && 'Générateur de Planning'}
            {location.pathname === '/tasks' && 'Mes tâches'}
            {location.pathname === '/agent' && 'Mes tâches'}
            {location.pathname === '/super-admin' && '🔱 Administration Générale'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <OrganizationSelector />
            <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
              {user?.name}
            </Typography>
            <ThemeToggle />
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                <AccountCircle />
              </Avatar>
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
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <ExitToApp fontSize="small" />
                </ListItemIcon>
                <ListItemText>Déconnexion</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;