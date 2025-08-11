import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import { PlayArrow, Stop, CheckCircle } from '@mui/icons-material';
import { TaskStatus } from '../../types';

interface TimerProps {
  taskId: string;
  status: TaskStatus;
  startTime?: string | null;
  estimatedDuration?: number;
  actualDuration?: number;
  onStart: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  isMyTask?: boolean;
  userRole?: string;
}

const Timer: React.FC<TimerProps> = ({
  taskId,
  status,
  startTime,
  estimatedDuration,
  actualDuration,
  onStart,
  onComplete,
  isMyTask = false,
  userRole,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(status === TaskStatus.IN_PROGRESS);
  const [localStartTime, setLocalStartTime] = useState<Date | null>(null);

  // Sync with server state
  useEffect(() => {
    setIsRunning(status === TaskStatus.IN_PROGRESS);
    if (startTime && status === TaskStatus.IN_PROGRESS) {
      setLocalStartTime(new Date(startTime));
    }
  }, [status, startTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && (localStartTime || startTime)) {
      interval = setInterval(() => {
        const startTimeToUse = localStartTime || (startTime ? new Date(startTime) : null);
        if (startTimeToUse) {
          const now = new Date().getTime();
          const elapsed = Math.floor((now - startTimeToUse.getTime()) / 1000); // en secondes
          setElapsedTime(Math.max(0, elapsed));
        }
      }, 1000);
    } else if (status === TaskStatus.COMPLETED && actualDuration) {
      setElapsedTime(actualDuration * 60); // convertir minutes en secondes
      setIsRunning(false);
      setLocalStartTime(null);
    } else if (status === TaskStatus.PENDING) {
      setElapsedTime(0);
      setIsRunning(false);
      setLocalStartTime(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, localStartTime, startTime, status, actualDuration]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    const now = new Date();
    console.log('Timer: Starting task', taskId, 'at', now);
    setLocalStartTime(now);
    setIsRunning(true);
    setElapsedTime(0);
    onStart(taskId);
  };

  const handleComplete = () => {
    setIsRunning(false);
    setLocalStartTime(null);
    const durationInMinutes = Math.ceil(elapsedTime / 60);
    onComplete(taskId);
  };

  const getTimeColor = () => {
    if (status === TaskStatus.COMPLETED) return 'success.main';
    if (!estimatedDuration) return 'text.primary';
    
    const estimatedSeconds = estimatedDuration * 60;
    if (elapsedTime > estimatedSeconds * 1.2) return 'error.main'; // 20% de dépassement
    if (elapsedTime > estimatedSeconds) return 'warning.main'; // Dépassement
    return 'primary.main';
  };

  // Compact view for admin
  if (userRole === 'ADMIN') {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
        <Typography
          variant="body2"
          fontWeight="bold"
          sx={{ 
            color: getTimeColor(),
            fontFamily: 'monospace',
            fontSize: '0.75rem'
          }}
        >
          {formatTime(elapsedTime)}
        </Typography>
        {estimatedDuration && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
            Prévu: {estimatedDuration}min
          </Typography>
        )}
      </Box>
    );
  }

  // Full view for agents
  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
      {/* Affichage du temps */}
      <Box display="flex" flexDirection="column" alignItems="center">
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{ 
            color: getTimeColor(),
            fontFamily: 'monospace',
            fontSize: '1.1rem'
          }}
        >
          {formatTime(elapsedTime)}
        </Typography>
        
        {/* Temps estimé */}
        {estimatedDuration && (
          <Typography variant="caption" color="text.secondary">
            Prévu: {Math.floor(estimatedDuration / 60) > 0 ? `${Math.floor(estimatedDuration / 60)}h` : ''}{estimatedDuration % 60}min
          </Typography>
        )}
      </Box>

      {/* Boutons d'action pour les agents */}
      {isMyTask && (
        <Box display="flex" gap={1}>
          {status === TaskStatus.PENDING && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              onClick={handleStart}
              sx={{ minWidth: '100px' }}
            >
              Démarrer
            </Button>
          )}
          
          {status === TaskStatus.IN_PROGRESS && (
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={handleComplete}
              sx={{ minWidth: '100px' }}
            >
              Terminer
            </Button>
          )}
          
          {status === TaskStatus.COMPLETED && (
            <Chip
              label="Terminé"
              color="success"
              icon={<CheckCircle />}
              size="small"
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default Timer;