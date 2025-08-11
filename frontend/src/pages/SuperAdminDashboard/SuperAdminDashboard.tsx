import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Business,
  Person,
  AdminPanelSettings,
  Refresh
} from '@mui/icons-material';
import { organizationsAPI, usersAPI } from '../../services/api';
import { Organization, User } from '../../types';

const SuperAdminDashboard: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  
  // Form states
  const [newOrg, setNewOrg] = useState({
    name: '',
    slug: '',
    contactEmail: '',
    contactPhone: '',
    address: ''
  });
  
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '123456' // Mot de passe par défaut
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const orgs = await organizationsAPI.getOrganizations();
      setOrganizations(Array.isArray(orgs) ? orgs : []);
      setError(null);
    } catch (err: any) {
      setError('Erreur lors du chargement des organisations');
      console.error('Error loading organizations:', err);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!newOrg.name.trim() || !newOrg.slug.trim()) {
      setError('Le nom et le slug sont obligatoires');
      return;
    }

    try {
      setLoading(true);
      if (editingOrg) {
        await organizationsAPI.updateOrganization(editingOrg.id, newOrg);
      } else {
        await organizationsAPI.createOrganization(newOrg);
      }
      await loadOrganizations();
      setOrgDialogOpen(false);
      setEditingOrg(null);
      setNewOrg({ name: '', slug: '', contactEmail: '', contactPhone: '', address: '' });
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet établissement ?')) {
      return;
    }

    try {
      setLoading(true);
      await organizationsAPI.deleteOrganization(orgId);
      await loadOrganizations();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.name.trim() || !newAdmin.email.trim() || !selectedOrgId) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    try {
      setLoading(true);
      await usersAPI.createUser({
        ...newAdmin,
        role: 'ADMIN',
        organizationId: selectedOrgId
      });
      await loadOrganizations();
      setAdminDialogOpen(false);
      setNewAdmin({ name: '', email: '', password: '123456' });
      setSelectedOrgId(null);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'admin');
    } finally {
      setLoading(false);
    }
  };

  const openEditOrg = (org: Organization) => {
    setEditingOrg(org);
    setNewOrg({
      name: org.name,
      slug: org.slug,
      contactEmail: org.contactEmail || '',
      contactPhone: org.contactPhone || '',
      address: org.address || ''
    });
    setOrgDialogOpen(true);
  };

  const openAddAdmin = (orgId: string) => {
    setSelectedOrgId(orgId);
    setAdminDialogOpen(true);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          🔱 Administration Générale - {organizations.length} établissements
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadOrganizations}
            size="small"
          >
            Actualiser
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOrgDialogOpen(true)}
            size="medium"
          >
            + Établissement
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistiques condensées */}
      <Box display="flex" gap={2} sx={{ mb: 2 }}>
        <Chip 
          icon={<Business />} 
          label={`${organizations.length} Établissements`} 
          color="primary" 
          variant="filled"
        />
        <Chip 
          icon={<AdminPanelSettings />} 
          label={`${organizations.reduce((total, org) => total + (org._count?.users || 0), 0)} Admins`} 
          color="success" 
          variant="filled"
        />
        <Chip 
          icon={<Person />} 
          label={`${organizations.filter(org => org.isActive).length} Actifs`} 
          color="info" 
          variant="filled"
        />
      </Box>

      {/* Tableau condensé */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: '70vh' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 200 }}><strong>Établissement</strong></TableCell>
                <TableCell sx={{ minWidth: 120 }}><strong>Slug</strong></TableCell>
                <TableCell sx={{ minWidth: 180 }}><strong>Contact</strong></TableCell>
                <TableCell sx={{ width: 80 }}><strong>État</strong></TableCell>
                <TableCell sx={{ minWidth: 250 }}><strong>Administrateurs</strong></TableCell>
                <TableCell sx={{ width: 120 }} align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={40} />
                  </TableCell>
                </TableRow>
              ) : organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">
                      Aucun établissement trouvé
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => (
                  <TableRow key={org.id} hover sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                    <TableCell sx={{ py: 1 }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                        {org.name}
                      </Typography>
                      {org.address && (
                        <Typography variant="caption" color="text.secondary">
                          📍 {org.address.substring(0, 40)}...
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Chip 
                        label={org.slug} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      {org.contactEmail && (
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          📧 {org.contactEmail}
                        </Typography>
                      )}
                      {org.contactPhone && (
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          📞 {org.contactPhone}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Chip 
                        label={org.isActive ? '✅' : '❌'}
                        color={org.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Box sx={{ maxHeight: 80, overflowY: 'auto' }}>
                        {org.users && org.users.length > 0 ? (
                          org.users.map((user) => (
                            <Typography key={user.id} variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                              👨‍💼 <strong>{user.name}</strong> - {user.email}
                            </Typography>
                          ))
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Aucun admin
                          </Typography>
                        )}
                      </Box>
                      <Button
                        size="small"
                        startIcon={<Add />}
                        onClick={() => openAddAdmin(org.id)}
                        variant="text"
                        sx={{ mt: 0.5, fontSize: '0.7rem', minHeight: 24 }}
                      >
                        Ajouter
                      </Button>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1 }}>
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <IconButton 
                          color="primary"
                          onClick={() => openEditOrg(org)}
                          size="small"
                          sx={{ p: 0.5 }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton 
                          color="error"
                          onClick={() => handleDeleteOrganization(org.id)}
                          size="small"
                          sx={{ p: 0.5 }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog Création/Édition Organisation */}
      <Dialog 
        open={orgDialogOpen} 
        onClose={() => {
          setOrgDialogOpen(false);
          setEditingOrg(null);
          setNewOrg({ name: '', slug: '', contactEmail: '', contactPhone: '', address: '' });
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingOrg ? 'Modifier l\'établissement' : 'Créer un nouvel établissement'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nom de l'établissement"
                fullWidth
                value={newOrg.name}
                onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Slug (identifiant unique)"
                fullWidth
                value={newOrg.slug}
                onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                helperText="Utilisé dans les URLs (ex: mon-etablissement)"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Email de contact"
                fullWidth
                type="email"
                value={newOrg.contactEmail}
                onChange={(e) => setNewOrg({ ...newOrg, contactEmail: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Téléphone"
                fullWidth
                value={newOrg.contactPhone}
                onChange={(e) => setNewOrg({ ...newOrg, contactPhone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Adresse"
                fullWidth
                multiline
                rows={3}
                value={newOrg.address}
                onChange={(e) => setNewOrg({ ...newOrg, address: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOrgDialogOpen(false);
              setEditingOrg(null);
              setNewOrg({ name: '', slug: '', contactEmail: '', contactPhone: '', address: '' });
            }}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleCreateOrganization}
            variant="contained"
            disabled={loading || !newOrg.name.trim() || !newOrg.slug.trim()}
          >
            {editingOrg ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Création Admin */}
      <Dialog 
        open={adminDialogOpen} 
        onClose={() => {
          setAdminDialogOpen(false);
          setNewAdmin({ name: '', email: '', password: '123456' });
          setSelectedOrgId(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Créer un administrateur</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Nom complet"
                fullWidth
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                fullWidth
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Mot de passe"
                fullWidth
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                helperText="Mot de passe par défaut : 123456"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setAdminDialogOpen(false);
              setNewAdmin({ name: '', email: '', password: '123456' });
              setSelectedOrgId(null);
            }}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleCreateAdmin}
            variant="contained"
            disabled={loading || !newAdmin.name.trim() || !newAdmin.email.trim()}
          >
            Créer Admin
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SuperAdminDashboard;