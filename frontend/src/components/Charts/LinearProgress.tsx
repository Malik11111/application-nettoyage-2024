import React from 'react';
import { Box, Typography, LinearProgress as MuiLinearProgress, useTheme } from '@mui/material';

interface LinearProgressProps {
  value: number;
  maxValue?: number;
  label?: string;
  color?: string;
  height?: number;
  showPercentage?: boolean;
  animated?: boolean;
}

const LinearProgress: React.FC<LinearProgressProps> = ({
  value,
  maxValue = 100,
  label,
  color,
  height = 8,
  showPercentage = true,
  animated = true,
}) => {
  const theme = useTheme();
  const percentage = Math.min((value / maxValue) * 100, 100);
  const progressColor = color || theme.palette.primary.main;

  return (
    <Box sx={{ width: '100%' }}>
      {(label || showPercentage) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          {label && (
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          )}
          {showPercentage && (
            <Typography variant="body2" fontWeight="bold" color={progressColor}>
              {Math.round(percentage)}%
            </Typography>
          )}
        </Box>
      )}
      
      <Box
        sx={{
          position: 'relative',
          height,
          backgroundColor: theme.palette.grey[200],
          borderRadius: height / 2,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: progressColor,
            borderRadius: height / 2,
            transition: animated ? 'width 1s ease-in-out' : 'none',
          }}
        />
      </Box>
    </Box>
  );
};

export default LinearProgress;