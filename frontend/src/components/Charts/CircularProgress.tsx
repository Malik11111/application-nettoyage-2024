import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

interface CircularProgressProps {
  value: number;
  maxValue?: number;
  size?: number;
  thickness?: number;
  color?: string;
  label?: string;
  subtitle?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  maxValue = 100,
  size = 120,
  thickness = 8,
  color,
  label,
  subtitle,
}) => {
  const theme = useTheme();
  const percentage = Math.min((value / maxValue) * 100, 100);
  const strokeDasharray = 2 * Math.PI * (size / 2 - thickness);
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;
  
  const progressColor = color || theme.palette.primary.main;

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <svg width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - thickness}
            stroke={theme.palette.grey[200]}
            strokeWidth={thickness}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - thickness}
            stroke={progressColor}
            strokeWidth={thickness}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              transition: 'stroke-dashoffset 1s ease-in-out',
            }}
          />
        </svg>
        
        {/* Center content */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h4" component="div" fontWeight="bold" color={progressColor}>
            {Math.round(percentage)}%
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      
      {label && (
        <Typography variant="body1" sx={{ mt: 1, fontWeight: 500, textAlign: 'center' }}>
          {label}
        </Typography>
      )}
    </Box>
  );
};

export default CircularProgress;