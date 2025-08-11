import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete, LocationOn } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { fetchLocations, createLocation, updateLocation, deleteLocation } from '../../store/slices/locationsSlice';
import { CreateLocationRequest } from '../../types';

interface LocationFormData extends CreateLocationRequest {
  id?: string;
}

const Locations: React.FC = () => {
  const dispatch = useAppDispatch();
  const { locations, isLoading, error } = useAppSelector((state) => state.locations);

  const [open, setOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationFormData | null>(null);
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    description: '',
    floor: '',
    type: '',
  });

  useEffect(() => {
    dispatch(fetchLocations());
  }, [dispatch]);

  const handleOpenDialog = (location?: any) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        id: location.id,
        name: location.name,
        description: location.description || '',
        floor: location.floor,
        type: location.type,
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        description: '',
        floor: '',
        type: '',
      });
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingLocation(null);
    setFormData({
      name: '',
      description: '',
      floor: '',
      type: '',
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingLocation) {
        await dispatch(updateLocation({ id: editingLocation.id!, data: formData })).unwrap();
      } else {
        await dispatch(createLocation(formData)).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce lieu ?')) {
      try {
        await dispatch(deleteLocation(id)).unwrap();
      } catch (error) {
        console.error('Error deleting location:', error);
      }
    }
  };

  if (isLoading && locations.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h4">Gestion des Lieux</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          📅 {today} • 🕐 {currentTime}
        </Typography>
      </Box>
      <Box display="flex" justifyContent="flex-end" mb={3}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Ajouter un Lieu
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Étage</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Tâches</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <LocationOn color="action" sx={{ mr: 1 }} />
                    {location.name}
                  </Box>
                </TableCell>
                <TableCell>{location.description || '-'}</TableCell>
                <TableCell>
                  <Chip label={location.floor} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={location.type} 
                    size="small" 
                    color={location.type === 'bureau' ? 'primary' : 'secondary'}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={`${location._count?.tasks || 0} tâches`}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(location)}
                    size="small"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(location.id)}
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Location Form Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingLocation ? 'Modifier le lieu' : 'Ajouter un lieu'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nom du lieu"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Étage"
              value={formData.floor}
              onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
              placeholder="RDC, 1er, 2ème..."
              required
              fullWidth
            />
            <TextField
              label="Type"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              placeholder="bureau, atelier, entrepôt..."
              required
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.floor || !formData.type}
          >
            {editingLocation ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Locations;