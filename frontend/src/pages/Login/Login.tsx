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


  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 30%, #16213e 60%, #0e3460 100%)',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(2px 2px at 10% 20%, #ffffff, transparent),
            radial-gradient(1px 1px at 20% 80%, #ffffff, transparent),
            radial-gradient(2px 2px at 30% 40%, #ffffff, transparent),
            radial-gradient(1px 1px at 40% 10%, #ffffff, transparent),
            radial-gradient(2px 2px at 50% 60%, #ffffff, transparent),
            radial-gradient(1px 1px at 60% 90%, #ffffff, transparent),
            radial-gradient(2px 2px at 70% 30%, #ffffff, transparent),
            radial-gradient(1px 1px at 80% 70%, #ffffff, transparent),
            radial-gradient(2px 2px at 90% 50%, #ffffff, transparent),
            radial-gradient(1px 1px at 15% 65%, #ffffff, transparent),
            radial-gradient(2px 2px at 25% 15%, #ffffff, transparent),
            radial-gradient(1px 1px at 35% 85%, #ffffff, transparent),
            radial-gradient(2px 2px at 45% 25%, #ffffff, transparent),
            radial-gradient(1px 1px at 55% 75%, #ffffff, transparent),
            radial-gradient(2px 2px at 65% 45%, #ffffff, transparent),
            radial-gradient(1px 1px at 75% 35%, #ffffff, transparent),
            radial-gradient(2px 2px at 85% 15%, #ffffff, transparent),
            radial-gradient(1px 1px at 95% 85%, #ffffff, transparent),
            radial-gradient(3px 3px at 5% 50%, #ffffff, transparent),
            radial-gradient(1px 1px at 95% 10%, #ffffff, transparent),
            radial-gradient(2px 2px at 12% 88%, #ffffff, transparent),
            radial-gradient(1px 1px at 88% 12%, #ffffff, transparent),
            radial-gradient(2px 2px at 77% 88%, #ffffff, transparent),
            radial-gradient(1px 1px at 23% 12%, #ffffff, transparent),
            radial-gradient(3px 3px at 66% 77%, #ffffff, transparent),
            radial-gradient(1px 1px at 34% 23%, #ffffff, transparent),
            radial-gradient(2px 2px at 44% 66%, #ffffff, transparent),
            radial-gradient(1px 1px at 56% 34%, #ffffff, transparent),
            radial-gradient(2px 2px at 22% 44%, #ffffff, transparent),
            radial-gradient(1px 1px at 78% 56%, #ffffff, transparent),
            radial-gradient(3px 3px at 33% 22%, #ffffff, transparent),
            radial-gradient(1px 1px at 67% 78%, #ffffff, transparent)
          `,
          backgroundSize: '100% 100%',
          opacity: 0.9,
          animation: 'twinkle 2s ease-in-out infinite alternate',
          zIndex: 1,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '5%',
          right: '8%',
          width: '350px',
          height: '350px',
          background: `
            radial-gradient(circle at 30% 30%, #4a90e2 0%, #357abd 30%, #1e3a5f 60%, transparent 80%),
            radial-gradient(circle at 60% 40%, rgba(255,255,255,0.2) 0%, transparent 50%),
            radial-gradient(circle at 20% 60%, #6c5ce7 0%, transparent 40%)
          `,
          borderRadius: '50%',
          opacity: 0.6,
          zIndex: 1,
          boxShadow: '0 0 100px rgba(255,255,255,0.1)',
        },
        '@keyframes twinkle': {
          '0%': { opacity: 0.4 },
          '100%': { opacity: 1 }
        },
        '@keyframes shootingStar1': {
          '0%': { 
            transform: 'translateX(-50px) translateY(-50px)',
            opacity: 0
          },
          '10%': { 
            opacity: 1
          },
          '90%': { 
            opacity: 1
          },
          '100%': { 
            transform: 'translateX(calc(100vw + 50px)) translateY(calc(100vh + 50px))',
            opacity: 0
          }
        },
        '@keyframes shootingStar2': {
          '0%': { 
            transform: 'translateX(calc(100vw + 50px)) translateY(-50px)',
            opacity: 0
          },
          '15%': { 
            opacity: 1
          },
          '85%': { 
            opacity: 1
          },
          '100%': { 
            transform: 'translateX(-50px) translateY(calc(100vh + 50px))',
            opacity: 0
          }
        },
        '@keyframes shootingStar3': {
          '0%': { 
            transform: 'translateX(50vw) translateY(-50px)',
            opacity: 0
          },
          '20%': { 
            opacity: 1
          },
          '80%': { 
            opacity: 1
          },
          '100%': { 
            transform: 'translateX(50vw) translateY(calc(100vh + 50px))',
            opacity: 0
          }
        }
      }}
    >
      {/* Étoiles filantes */}
      <Box
        sx={{
          position: 'absolute',
          width: '4px',
          height: '4px',
          background: '#ffffff',
          borderRadius: '50%',
          boxShadow: '0 0 8px #ffffff, 0 0 16px rgba(255,255,255,0.5)',
          animation: 'shootingStar1 8s ease-in-out infinite',
          zIndex: 2,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '3px',
          height: '3px',
          background: '#ffffff',
          borderRadius: '50%',
          boxShadow: '0 0 6px #ffffff, 0 0 12px rgba(255,255,255,0.5)',
          animation: 'shootingStar2 10s ease-in-out infinite 2s',
          zIndex: 2,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '3px',
          height: '3px',
          background: '#ffffff',
          borderRadius: '50%',
          boxShadow: '0 0 6px #ffffff, 0 0 12px rgba(255,255,255,0.5)',
          animation: 'shootingStar3 6s ease-in-out infinite 4s',
          zIndex: 2,
        }}
      />
      
      <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 3, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%'
          }}
        >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            width: '100%',
            maxWidth: 400,
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.9) 50%, rgba(230, 240, 255, 0.85) 100%)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 20px rgba(78, 205, 196, 0.1)',
            zIndex: 2,
            position: 'relative',
          }}
        >
          <Typography 
            component="h1" 
            variant="h2" 
            align="center" 
            gutterBottom
            sx={{
              color: '#8e24aa',
              fontWeight: 'bold',
              fontSize: '3.5rem',
              letterSpacing: '2px',
              marginBottom: '30px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              borderRight: '3px solid #8e24aa',
              textShadow: '0 2px 4px rgba(142, 36, 170, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2)',
              animation: 'typewriter 4s steps(9, end) 1s both, blinkCursor 1s step-end infinite',
              '@keyframes typewriter': {
                '0%': { width: '0' },
                '100%': { width: '100%' }
              },
              '@keyframes blinkCursor': {
                '0%, 50%': { borderColor: '#8e24aa' },
                '51%, 100%': { borderColor: 'transparent' }
              }
            }}
          >
            NET CLEAN
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
                backgroundColor: '#8e24aa',
                '&:hover': {
                  backgroundColor: '#7b1fa2'
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Se connecter'}
            </Button>
          </Box>

        </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;