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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { fetchUsers, createUser, updateUser, deleteUser } from '../../store/slices/usersSlice';
import { ROLE_LABELS } from '../../utils/constants';
import { CreateUserRequest } from '../../types';

interface UserFormData extends CreateUserRequest {
  id?: string;
}

const Users: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, isLoading, error } = useAppSelector((state) => state.users);

  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserFormData | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    name: '',
    role: 'AGENT',
  });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleOpenDialog = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        password: '', // Don't prefill password for editing
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'AGENT',
      });
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'AGENT',
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        const { password, ...updateData } = formData;
        const dataToUpdate = password ? formData : updateData;
        await dispatch(updateUser({ id: editingUser.id!, data: dataToUpdate })).unwrap();
      } else {
        await dispatch(createUser(formData)).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await dispatch(deleteUser(id)).unwrap();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  if (isLoading && users.length === 0) {
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
        <Typography variant="h4">Gestion des Agents</Typography>
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
          Ajouter un Agent
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
              <TableCell>Email</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Date de création</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={ROLE_LABELS[user.role]}
                    color={user.role === 'ADMIN' ? 'secondary' : 'primary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(user)}
                    size="small"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(user.id)}
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

      {/* User Form Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nom complet"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label={editingUser ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe"}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required={!editingUser}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Rôle</InputLabel>
              <Select
                value={formData.role}
                label="Rôle"
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'ADMIN' | 'AGENT' }))}
              >
                <MenuItem value="AGENT">Agent</MenuItem>
                <MenuItem value="ADMIN">Administrateur</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.email || (!editingUser && !formData.password)}
          >
            {editingUser ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;