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

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  const { isLoading, error, isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

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
            Gestion des Agents d'Entretien
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
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Se connecter'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.100', borderRadius: 1, maxHeight: '300px', overflowY: 'auto' }}>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
              <strong>📧 Comptes Multi-Tenant - Mot de passe: 123456</strong>
            </Typography>
            
            {/* SUPER ADMIN */}
            <Typography 
              variant="caption" 
              sx={{ 
                mt: 1, 
                display: 'block', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                backgroundColor: 'primary.main',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                mb: 1,
                '&:hover': { backgroundColor: 'primary.dark' }
              }}
              onClick={() => handleEmailClick('admin@cleaning.com')}
            >
              🔱 SUPER ADMIN: admin@cleaning.com
            </Typography>
            
            {/* 10 ÉTABLISSEMENTS */}
            {[1,2,3,4,5,6,7,8,9,10].map(num => (
              <Box key={num} sx={{ mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', mb: 0.5 }}>
                  🏢 Établissement {num}:
                </Typography>
                
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    cursor: 'pointer', 
                    ml: 1,
                    '&:hover': { backgroundColor: 'secondary.light', color: 'white', padding: '2px 4px', borderRadius: '4px' }
                  }}
                  onClick={() => handleEmailClick(`admin${num}@etablissement.com`)}
                >
                  👨‍💼 admin{num}@etablissement.com
                </Typography>
                
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    cursor: 'pointer', 
                    ml: 1,
                    '&:hover': { backgroundColor: 'info.light', color: 'white', padding: '2px 4px', borderRadius: '4px' }
                  }}
                  onClick={() => handleEmailClick(`agent${num}a@etablissement.com`)}
                >
                  👷 agent{num}a@etablissement.com
                </Typography>
                
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    cursor: 'pointer', 
                    ml: 1,
                    '&:hover': { backgroundColor: 'info.light', color: 'white', padding: '2px 4px', borderRadius: '4px' }
                  }}
                  onClick={() => handleEmailClick(`agent${num}b@etablissement.com`)}
                >
                  👷 agent{num}b@etablissement.com
                </Typography>
              </Box>
            ))}
            
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'primary.main', textAlign: 'center' }}>
              💡 Clique sur un email pour le copier • 🔱=Voit tout • 👨‍💼=Admin établissement • 👷=Agent
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;