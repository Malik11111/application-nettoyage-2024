import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { login, clearError } from '../../store/slices/authSlice';
import api from '../../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  const { isLoading, error, isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const from = (location.state as any)?.from?.pathname || 
    (user?.role === 'AGENT' ? '/tasks' : '/dashboard');

  useEffect(() => {
    if (isAuthenticated && user) {
      const targetRoute = (location.state as any)?.from?.pathname || 
        (user.role === 'AGENT' ? '/tasks' : '/dashboard');
      navigate(targetRoute, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    // Afficher seulement les comptes réels connus - Version 2025-08-31-14:30
    setOrganizations([
      { name: 'Organisation Par Défaut', slug: 'default-org', id: 'default-org' }
    ]);
    setUsers([
      { email: 'admin@cleaning.com', name: 'Super Admin', role: 'SUPER_ADMIN', organizationId: 'default-org' },
      { email: 'admin1@etablissement.com', name: 'Admin Établissement', role: 'ADMIN', organizationId: 'default-org' },
      { email: 'agent1a@etablissement.com', name: 'Agent', role: 'AGENT', organizationId: 'default-org' }
    ]);
    setLoadingData(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Enlever les espaces en début et fin des champs
    const cleanedFormData = {
      email: formData.email.trim(),
      password: formData.password.trim()
    };
    dispatch(login(cleanedFormData));
  };

  const handleEmailClick = (email: string) => {
    navigator.clipboard.writeText(email);
    setFormData(prev => ({ ...prev, email }));
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            🚀 VERSION FIXÉE 2025 🚀
          </Typography>
          
          <Typography variant="h6" align="center" color="text.secondary" gutterBottom>
            Connexion
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mot de passe"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2, 
                backgroundColor: 'purple !important',
                '&:hover': {
                  backgroundColor: 'darkviolet !important'
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Se connecter'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.100', borderRadius: 1, maxHeight: '300px', overflowY: 'auto' }}>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
              <strong>🔑 Comptes de Connexion</strong>
            </Typography>
            
            {loadingData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <>
                {/* Grouper les utilisateurs par organisation */}
                {organizations.map((org) => {
                  const orgUsers = users.filter(user => 
                    user.organizationId === org.id || 
                    (org.slug === 'default-org' && !user.organizationId)
                  );
                  
                  if (orgUsers.length === 0) return null;
                  
                  return (
                    <Box key={org.id || org.slug} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                        🏢 {org.name}
                      </Typography>
                      
                      {orgUsers.map((user) => (
                        <Typography 
                          key={user.id || user.email}
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            cursor: 'pointer', 
                            ml: 1,
                            mb: 0.5,
                            padding: '2px 4px',
                            borderRadius: '4px',
                            '&:hover': { 
                              backgroundColor: user.role === 'SUPER_ADMIN' ? 'primary.light' :
                                            user.role === 'ADMIN' ? 'secondary.light' : 'info.light',
                              color: 'white'
                            }
                          }}
                          onClick={() => handleEmailClick(user.email)}
                        >
                          {user.role === 'SUPER_ADMIN' ? '🔱' :
                           user.role === 'ADMIN' ? '👨‍💼' : '👷'} {user.name}
                        </Typography>
                      ))}
                    </Box>
                  );
                })}
                
                <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'primary.main', textAlign: 'center' }}>
                  💡 Clique sur un compte pour remplir l'email • 🔱=Super Admin • 👨‍💼=Admin • 👷=Agent
                </Typography>
              </>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;