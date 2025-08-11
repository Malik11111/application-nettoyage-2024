import React, { useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  useTheme,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  PlayArrow,
  Schedule,
  Person,
  Refresh,
  Build,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { fetchDashboardStats } from '../../store/slices/dashboardSlice';
import CircularProgressChart from '../../components/Charts/CircularProgress';
import LinearProgress from '../../components/Charts/LinearProgress';
import { TASK_STATUS_COLORS } from '../../utils/constants';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { stats, isLoading, error } = useAppSelector((state) => state.dashboard);
  const { user } = useAppSelector((state) => state.auth);

  // Redirection automatique pour SUPER_ADMIN
  if (user?.role === 'SUPER_ADMIN') {
    window.location.href = '/super-admin';
    return null;
  }

  // Maintenance states
  const [isMaintenanceLoading, setIsMaintenanceLoading] = React.useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = React.useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchDashboardStats());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Maintenance functions
  const handleResetTimers = async () => {
    setIsMaintenanceLoading(true);
    setMaintenanceMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8001/api/maintenance/reset-daily-timers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: new Date().toISOString() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMaintenanceMessage({
          text: data.message,
          type: 'success'
        });
        // Refresh dashboard stats
        dispatch(fetchDashboardStats());
      } else {
        setMaintenanceMessage({
          text: data.message || 'Erreur lors du reset des compteurs',
          type: 'error'
        });
      }
    } catch (error) {
      setMaintenanceMessage({
        text: 'Erreur de connexion lors du reset des compteurs',
        type: 'error'
      });
    } finally {
      setIsMaintenanceLoading(false);
    }
  };

  const handleSmartStartup = async () => {
    setIsMaintenanceLoading(true);
    setMaintenanceMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8001/api/maintenance/smart-startup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: new Date().toISOString() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMaintenanceMessage({
          text: data.message,
          type: 'success'
        });
        // Refresh dashboard stats
        dispatch(fetchDashboardStats());
      } else {
        setMaintenanceMessage({
          text: data.message || 'Erreur lors du démarrage quotidien',
          type: 'error'
        });
      }
    } catch (error) {
      setMaintenanceMessage({
        text: 'Erreur de connexion lors du démarrage quotidien',
        type: 'error'
      });
    } finally {
      setIsMaintenanceLoading(false);
    }
  };

  const handleDailyMaintenance = async () => {
    // Confirm with user since this will recreate all tasks
    if (!window.confirm('⚠️ Ceci va supprimer et recréer toutes les tâches du jour. Les modifications manuelles seront perdues. Continuer ?')) {
      return;
    }

    setIsMaintenanceLoading(true);
    setMaintenanceMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8001/api/maintenance/generate-daily-tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          date: new Date().toISOString(),
          forceRegenerate: true 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMaintenanceMessage({
          text: data.message,
          type: 'success'
        });
        // Refresh dashboard stats
        dispatch(fetchDashboardStats());
      } else {
        setMaintenanceMessage({
          text: data.message || 'Erreur lors de la recréation du planning',
          type: 'error'
        });
      }
    } catch (error) {
      setMaintenanceMessage({
        text: 'Erreur de connexion lors de la recréation du planning',
        type: 'error'
      });
    } finally {
      setIsMaintenanceLoading(false);
    }
  };

  if (isLoading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Erreur lors du chargement des données: {error}
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;
  const inProgressRate = stats.totalTasks > 0 ? (stats.inProgressTasks / stats.totalTasks) * 100 : 0;
  const pendingRate = stats.totalTasks > 0 ? (stats.pendingTasks / stats.totalTasks) * 100 : 0;

  // Get current date and time info
  const getCurrentDateInfo = () => {
    const now = new Date();
    const today = now.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentTime = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return { today, currentTime };
  };

  const { today, currentTime } = getCurrentDateInfo();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" gutterBottom>
          Tableau de bord
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          📅 {today} • 🕐 {currentTime}
        </Typography>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assignment sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Tâches
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalTasks}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle sx={{ fontSize: 40, color: TASK_STATUS_COLORS.COMPLETED, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Terminées
                  </Typography>
                  <Typography variant="h4">
                    {stats.completedTasks}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PlayArrow sx={{ fontSize: 40, color: TASK_STATUS_COLORS.IN_PROGRESS, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    En cours
                  </Typography>
                  <Typography variant="h4">
                    {stats.inProgressTasks}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Person sx={{ fontSize: 40, color: theme.palette.secondary.main, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Agents
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalAgents}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Taux de Complétion Global
            </Typography>
            <CircularProgressChart
              value={completionRate}
              color={TASK_STATUS_COLORS.COMPLETED}
              subtitle={`${stats.completedTasks} / ${stats.totalTasks} tâches`}
              size={150}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Répartition des Tâches
            </Typography>
            <Box sx={{ mt: 3 }}>
              <LinearProgress
                value={stats.completedTasks}
                maxValue={stats.totalTasks}
                label="Terminées"
                color={TASK_STATUS_COLORS.COMPLETED}
              />
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  value={stats.inProgressTasks}
                  maxValue={stats.totalTasks}
                  label="En cours"
                  color={TASK_STATUS_COLORS.IN_PROGRESS}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  value={stats.pendingTasks}
                  maxValue={stats.totalTasks}
                  label="En attente"
                  color={TASK_STATUS_COLORS.PENDING}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Agent Performance */}
      {user?.role === 'ADMIN' && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Performance des Agents
          </Typography>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {stats.agentStats.map((agent) => (
              <Grid item xs={12} sm={6} md={4} key={agent.id}>
                <Card elevation={1}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" noWrap>
                        {agent.name}
                      </Typography>
                      <Chip
                        label={`${agent.completionRate}%`}
                        color={agent.completionRate >= 80 ? 'success' : agent.completionRate >= 60 ? 'warning' : 'error'}
                        size="small"
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <CircularProgressChart
                        value={agent.completionRate}
                        color={agent.completionRate >= 80 ? TASK_STATUS_COLORS.COMPLETED : theme.palette.warning.main}
                        subtitle={`${agent.completedTasks} / ${agent.totalTasks}`}
                        size={100}
                      />
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Heures totales
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {agent.totalHours}h
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Daily Maintenance Section */}
      {user?.role === 'ADMIN' && (
        <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Maintenance Quotidienne
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleResetTimers}
                disabled={isMaintenanceLoading}
                size="small"
              >
                Reset Compteurs
              </Button>
              <Button
                variant="outlined"
                startIcon={<Schedule />}
                onClick={handleSmartStartup}
                disabled={isMaintenanceLoading}
                color="primary"
                size="small"
              >
                Démarrage Quotidien
              </Button>
              <Button
                variant="contained"
                startIcon={<Build />}
                onClick={handleDailyMaintenance}
                disabled={isMaintenanceLoading}
                color="secondary"
                size="small"
              >
                Recréer Planning
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              • <strong>Reset Compteurs</strong>: Remet juste les timers à zéro (préserve les affectations)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              • <strong>Démarrage Quotidien</strong>: Reset compteurs + génère les tâches si aucune n'existe
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Recréer Planning</strong>: Supprime et recrée complètement les tâches du jour
            </Typography>
          </Box>

          {maintenanceMessage && (
            <Alert severity={maintenanceMessage.type} sx={{ mt: 2 }}>
              {maintenanceMessage.text}
            </Alert>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default Dashboard;