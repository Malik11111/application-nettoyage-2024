import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import { Add, Business } from '@mui/icons-material';
import { useAppSelector } from '../../utils/hooks';
import { organizationsAPI } from '../../services/api';
import { Organization } from '../../types';

interface OrganizationSelectorProps {
  onOrganizationChange?: (orgId: string) => void;
}

const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({ 
  onOrganizationChange 
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog pour créer une nouvelle organisation
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: '',
    slug: '',
    contactEmail: '',
    contactPhone: '',
    address: ''
  });

  // Charger les organisations (SUPER_ADMIN seulement)
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      loadOrganizations();
    }
  }, [user]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const orgs = await organizationsAPI.getOrganizations();
      setOrganizations(Array.isArray(orgs) ? orgs : []);
      
      // Définir l'organisation sélectionnée après chargement
      if (user?.organizationId && Array.isArray(orgs) && orgs.length > 0) {
        const userOrg = orgs.find(org => org.id === user.organizationId);
        if (userOrg) {
          setSelectedOrgId(user.organizationId);
        } else if (orgs.length > 0) {
          setSelectedOrgId(orgs[0].id);
        }
      }
      
      setError(null);
    } catch (err: any) {
      setError('Erreur lors du chargement des organisations');
      setOrganizations([]);
      console.error('Error loading organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    if (onOrganizationChange) {
      onOrganizationChange(orgId);
    }
  };

  const handleCreateOrganization = async () => {
    if (!newOrg.name.trim() || !newOrg.slug.trim()) {
      setError('Le nom et le slug sont obligatoires');
      return;
    }

    try {
      setLoading(true);
      await organizationsAPI.createOrganization(newOrg);
      await loadOrganizations(); // Recharger la liste
      setCreateDialogOpen(false);
      setNewOrg({ name: '', slug: '', contactEmail: '', contactPhone: '', address: '' });
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  // Pour les ADMIN/AGENT, afficher seulement leur organisation
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <Box display="flex" alignItems="center" sx={{ mr: 2 }}>
        <Business sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="body2" sx={{ 
          fontWeight: 'bold',
          color: 'primary.main'
        }}>
          {user?.organization?.name || 'Mon Établissement'}
        </Typography>
      </Box>
    );
  }

  // Interface SUPER_ADMIN avec sélecteur
  return (
    <>
      <Box display="flex" alignItems="center" sx={{ mr: 2, minWidth: 200 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Organisation</InputLabel>
          <Select
            value={selectedOrgId}
            label="Organisation"
            onChange={(e) => handleOrganizationChange(e.target.value)}
            disabled={loading}
            startAdornment={<Business sx={{ mr: 1, color: 'action.active' }} />}
          >
            {Array.isArray(organizations) && organizations.map((org) => (
              <MenuItem key={org.id} value={org.id}>
                <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                  <Typography>{org.name}</Typography>
                  <Chip 
                    size="small" 
                    label={org.isActive ? 'Actif' : 'Inactif'}
                    color={org.isActive ? 'success' : 'default'}
                    sx={{ ml: 1 }}
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button
          size="small"
          onClick={() => setCreateDialogOpen(true)}
          sx={{ ml: 1 }}
          variant="outlined"
          startIcon={<Add />}
        >
          Nouveau
        </Button>
      </Box>

      {/* Dialog de création d'organisation */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Créer une nouvelle organisation</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            label="Nom de l'organisation"
            fullWidth
            margin="normal"
            value={newOrg.name}
            onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
            required
          />
          
          <TextField
            label="Slug (identifiant unique)"
            fullWidth
            margin="normal"
            value={newOrg.slug}
            onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            helperText="Utilisé dans les URLs (ex: mon-etablissement)"
            required
          />
          
          <TextField
            label="Email de contact"
            fullWidth
            margin="normal"
            type="email"
            value={newOrg.contactEmail}
            onChange={(e) => setNewOrg({ ...newOrg, contactEmail: e.target.value })}
          />
          
          <TextField
            label="Téléphone"
            fullWidth
            margin="normal"
            value={newOrg.contactPhone}
            onChange={(e) => setNewOrg({ ...newOrg, contactPhone: e.target.value })}
          />
          
          <TextField
            label="Adresse"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={newOrg.address}
            onChange={(e) => setNewOrg({ ...newOrg, address: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCreateDialogOpen(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleCreateOrganization}
            variant="contained"
            disabled={loading || !newOrg.name.trim() || !newOrg.slug.trim()}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OrganizationSelector;