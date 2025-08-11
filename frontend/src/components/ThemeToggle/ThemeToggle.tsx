import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { toggleTheme } from '../../store/slices/themeSlice';

const ThemeToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const { mode } = useAppSelector((state) => state.theme);

  const handleToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <Tooltip title={mode === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}>
      <IconButton 
        color="inherit" 
        onClick={handleToggle}
        sx={{ 
          ml: 1,
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)',
          }
        }}
      >
        {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;