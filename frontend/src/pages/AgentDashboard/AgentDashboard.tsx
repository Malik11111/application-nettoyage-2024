import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  IconButton,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  CheckCircle,
  Schedule,
  LocationOn,
  Timer,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { fetchTasks, updateTask } from '../../store/slices/tasksSlice';
import { Task, TaskStatus, AgentDayView } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const AgentDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, isLoading, error } = useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workSchedule, setWorkSchedule] = useState<{
    workStart: string;
    workEnd: string;
    breakStart?: string;
    breakEnd?: string;
  } | null>(null);

  // Fonction pour récupérer les horaires de travail
  const fetchWorkSchedule = async () => {
    try {
      const response = await fetch('/api/planning/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const templates = await response.json();
        const activeTemplate = templates.find((t: any) => t.isActive);
        
        if (activeTemplate?.weeklySchedule) {
          // Déterminer le jour actuel
          const today = new Date();
          const dayIndex = today.getDay();
          const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const currentDayKey = dayKeys[dayIndex];
          
          const todaySchedule = activeTemplate.weeklySchedule[currentDayKey];
          if (todaySchedule && todaySchedule.isActive) {
            setWorkSchedule({
              workStart: todaySchedule.workStart,
              workEnd: todaySchedule.workEnd,
              breakStart: todaySchedule.breakStart,
              breakEnd: todaySchedule.breakEnd,
            });
          } else {
            // Pas de planning pour aujourd'hui
            setWorkSchedule(null);
          }
        } else if (activeTemplate) {
          // Mode legacy
          setWorkSchedule({
            workStart: activeTemplate.workStart || '07:00',
            workEnd: activeTemplate.workEnd || '15:30',
            breakStart: activeTemplate.breakStart,
            breakEnd: activeTemplate.breakEnd,
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des horaires:', error);
      // Horaires par défaut
      setWorkSchedule({
        workStart: '07:00',
        workEnd: '15:30',
        breakStart: '11:00',
        breakEnd: '12:00',
      });
    }
  };

  useEffect(() => {
    if (user?.role === 'AGENT') {
      dispatch(fetchTasks({
        assignedAgentId: user.id,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
      }));
      
      // Récupérer les horaires de travail
      fetchWorkSchedule();
    }

    // Update current time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Refresh tasks every 30 seconds
    const taskInterval = setInterval(() => {
      if (user?.role === 'AGENT') {
        dispatch(fetchTasks({
          assignedAgentId: user.id,
          startDate: format(new Date(), 'yyyy-MM-dd'),
          endDate: format(new Date(), 'yyyy-MM-dd'),
        }));
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(taskInterval);
    };
  }, [dispatch, user]);

  const handleStartTask = async (task: Task) => {
    const now = new Date().toISOString();
    console.log(`Starting task ${task.id} at ${now}`);
    await dispatch(updateTask({
      id: task.id,
      updates: {
        status: TaskStatus.IN_PROGRESS,
        startTime: now,
      },
    }));
    
    // Recharger les tâches pour s'assurer que startTime est bien sauvegardé
    setTimeout(() => {
      if (user?.role === 'AGENT') {
        dispatch(fetchTasks({
          assignedAgentId: user.id,
          startDate: format(new Date(), 'yyyy-MM-dd'),
          endDate: format(new Date(), 'yyyy-MM-dd'),
        }));
      }
    }, 1000);
  };

  const handleCompleteTask = async (task: Task) => {
    const now = new Date().toISOString();
    const actualDuration = task.startTime 
      ? Math.round((new Date().getTime() - new Date(task.startTime).getTime()) / 60000)
      : task.estimatedDuration;

    await dispatch(updateTask({
      id: task.id,
      updates: {
        status: TaskStatus.COMPLETED,
        endTime: now,
        actualDuration,
        completedAt: now,
      },
    }));
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Non spécifié';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${mins}min`;
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return 'default';
      case TaskStatus.IN_PROGRESS:
        return 'primary';
      case TaskStatus.COMPLETED:
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return <Schedule />;
      case TaskStatus.IN_PROGRESS:
        return <Timer />;
      case TaskStatus.COMPLETED:
        return <CheckCircle />;
      default:
        return <Schedule />;
    }
  };

  const getCurrentTaskTime = (task: Task) => {
    if (task.status === TaskStatus.IN_PROGRESS && task.startTime) {
      const startTime = new Date(task.startTime);
      const elapsed = Math.round((currentTime.getTime() - startTime.getTime()) / 60000);
      console.log(`Task ${task.id}: startTime=${task.startTime}, elapsed=${elapsed}min`);
      return Math.max(0, elapsed); // Éviter les valeurs négatives
    }
    console.log(`Task ${task.id}: status=${task.status}, startTime=${task.startTime}`);
    return 0;
  };

  if (user?.role !== 'AGENT') {
    return (
      <Alert severity="error">
        Cette interface est réservée aux agents de nettoyage.
      </Alert>
    );
  }

  if (isLoading && !tasks.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Erreur lors du chargement des tâches: {error}
      </Alert>
    );
  }

  const todayTasks = tasks.filter(task => {
    const taskDate = new Date(task.scheduledDate || task.createdAt);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString();
  }).sort((a, b) => {
    // Sort by scheduled time, then by status
    if (a.scheduledTime && b.scheduledTime) {
      return a.scheduledTime.localeCompare(b.scheduledTime);
    }
    if (a.scheduledTime) return -1;
    if (b.scheduledTime) return 1;
    
    // Put in progress tasks first
    if (a.status === TaskStatus.IN_PROGRESS && b.status !== TaskStatus.IN_PROGRESS) return -1;
    if (b.status === TaskStatus.IN_PROGRESS && a.status !== TaskStatus.IN_PROGRESS) return 1;
    
    return 0;
  });

  const completedTasks = todayTasks.filter(task => task.status === TaskStatus.COMPLETED);
  const totalEstimatedTime = todayTasks.reduce((sum, task) => sum + (task.estimatedDuration || 0), 0);
  const totalActualTime = completedTasks.reduce((sum, task) => sum + (task.actualDuration || 0), 0);
  const progressPercentage = totalEstimatedTime > 0 ? (completedTasks.length / todayTasks.length) * 100 : 0;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 1 }}>
      {/* Header condensé */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="primary">
          {format(new Date(), 'EEEE dd MMMM', { locale: fr })}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {format(currentTime, 'HH:mm')}
        </Typography>
        
        {/* Horaires de travail */}
        {workSchedule ? (
          <Box sx={{ mt: 1, mb: 2 }}>
            <Typography variant="body2" color="textSecondary">
              🕐 Travail: {workSchedule.workStart} - {workSchedule.workEnd}
              {workSchedule.breakStart && workSchedule.breakEnd && (
                <> • 🍽️ Pause: {workSchedule.breakStart} - {workSchedule.breakEnd}</>
              )}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 1, mb: 2 }}>
            <Typography variant="body2" color="warning.main">
              ⚠️ Aucun planning configuré pour aujourd'hui
            </Typography>
          </Box>
        )}
        
        <LinearProgress 
          variant="determinate" 
          value={progressPercentage} 
          sx={{ height: 8, borderRadius: 4, mt: 1 }}
        />
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {completedTasks.length}/{todayTasks.length} terminées
        </Typography>
      </Paper>

      {/* Liste des tâches condensée */}
      {todayTasks.map((task, index) => {
        const currentElapsed = getCurrentTaskTime(task);
        const isOvertime = task.estimatedDuration && currentElapsed > task.estimatedDuration;

        return (
          <Card 
            key={task.id} 
            elevation={task.status === TaskStatus.IN_PROGRESS ? 3 : 1}
            sx={{ 
              mb: 1,
              border: task.status === TaskStatus.IN_PROGRESS ? 2 : 0,
              borderColor: 'primary.main',
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              {/* En-tête de la tâche */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {task.location.name}
                </Typography>
                
                <Chip
                  size="small"
                  icon={getStatusIcon(task.status)}
                  label={
                    task.status === TaskStatus.PENDING ? 'À faire' :
                    task.status === TaskStatus.IN_PROGRESS ? 'En cours' :
                    'Terminé'
                  }
                  color={getStatusColor(task.status)}
                />
              </Box>

              {/* Informations temps condensées */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption">
                  {task.scheduledTime && `${task.scheduledTime} • `}
                  Prévu: {formatDuration(task.estimatedDuration)}
                </Typography>
                
                {task.status === TaskStatus.IN_PROGRESS && (
                  <Typography 
                    variant="body2" 
                    color={isOvertime ? 'error' : 'primary'}
                    fontWeight="bold"
                    sx={{ 
                      backgroundColor: isOvertime ? 'error.light' : 'primary.light',
                      color: isOvertime ? 'error.contrastText' : 'primary.contrastText',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1
                    }}
                  >
                    ⏱️ {formatDuration(currentElapsed)}
                  </Typography>
                )}
                
                {task.status === TaskStatus.COMPLETED && task.actualDuration && (
                  <Typography variant="caption" color="success.main" fontWeight="bold">
                    ✅ Réalisé: {formatDuration(task.actualDuration)}
                  </Typography>
                )}
              </Box>

              {/* Bouton d'action */}
              {task.status === TaskStatus.PENDING && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrow />}
                  onClick={() => handleStartTask(task)}
                  fullWidth
                  size="medium"
                >
                  COMMENCER
                </Button>
              )}
              
              {task.status === TaskStatus.IN_PROGRESS && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Stop />}
                  onClick={() => handleCompleteTask(task)}
                  fullWidth
                  size="medium"
                >
                  TERMINER
                </Button>
              )}
              
              {task.status === TaskStatus.COMPLETED && (
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<CheckCircle />}
                  disabled
                  fullWidth
                  size="medium"
                >
                  ✓ TERMINÉ
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}

      {todayTasks.length === 0 && (
        <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            Aucune tâche pour aujourd'hui
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default AgentDashboard;