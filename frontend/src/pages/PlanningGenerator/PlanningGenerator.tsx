import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Switch,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Preview as PreviewIcon,
  PlayArrow as GenerateIcon,
  Save as SaveIcon,
  FileCopy as DuplicateIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  DragIndicator as DragIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import {
  User,
  Location,
  PlanningTemplate,
  LocationConfig,
  PlanningConfig,
  PlanningPreview,
  CreatePlanningTemplateRequest,
  GeneratePlanningRequest,
  DuplicatePlanningRequest,
  WeeklySchedule,
  DaySchedule,
} from '../../types';
import { usersAPI, locationsAPI, planningAPI } from '../../services/api';

interface TimeSlotOption {
  value: string;
  label: string;
  description: string;
}

const timeSlotOptions: TimeSlotOption[] = [
  { value: 'morning', label: 'Matin', description: 'Avant 10h00' },
  { value: 'beforeBreak', label: 'Avant pause', description: 'Doit être terminé avant la pause' },
  { value: 'afterBreak', label: 'Après pause', description: 'Commence après la pause' },
  { value: 'afternoon', label: 'Après-midi', description: 'Après 13h00' },
  { value: 'flexible', label: 'Flexible', description: 'Peut être placé n\'importe quand' },
];

// Days of week configuration
const daysOfWeek = [
  { key: 'monday' as const, label: 'Lundi', shortLabel: 'Lun' },
  { key: 'tuesday' as const, label: 'Mardi', shortLabel: 'Mar' },
  { key: 'wednesday' as const, label: 'Mercredi', shortLabel: 'Mer' },
  { key: 'thursday' as const, label: 'Jeudi', shortLabel: 'Jeu' },
  { key: 'friday' as const, label: 'Vendredi', shortLabel: 'Ven' },
  { key: 'saturday' as const, label: 'Samedi', shortLabel: 'Sam' },
  { key: 'sunday' as const, label: 'Dimanche', shortLabel: 'Dim' },
];

const PlanningGenerator: React.FC = () => {
  const [agents, setAgents] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [templates, setTemplates] = useState<PlanningTemplate[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // Form state
  const [workStart, setWorkStart] = useState('07:00');
  const [workEnd, setWorkEnd] = useState('15:30');
  const [breakStart, setBreakStart] = useState('11:00');
  const [breakEnd, setBreakEnd] = useState('12:00');
  const [hasBreak, setHasBreak] = useState(true);
  const [locationConfigs, setLocationConfigs] = useState<LocationConfig[]>([]);
  
  // Weekly planning state
  const [useWeeklyPlanning, setUseWeeklyPlanning] = useState(false);
  const [selectedDay, setSelectedDay] = useState<keyof WeeklySchedule>('monday');
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    monday: { workStart: '07:00', workEnd: '15:30', breakStart: '11:00', breakEnd: '12:00', locations: [], isActive: true },
    tuesday: { workStart: '07:00', workEnd: '15:30', breakStart: '11:00', breakEnd: '12:00', locations: [], isActive: true },
    wednesday: { workStart: '07:00', workEnd: '15:30', breakStart: '11:00', breakEnd: '12:00', locations: [], isActive: true },
    thursday: { workStart: '07:00', workEnd: '15:30', breakStart: '11:00', breakEnd: '12:00', locations: [], isActive: true },
    friday: { workStart: '07:00', workEnd: '15:30', breakStart: '11:00', breakEnd: '12:00', locations: [], isActive: true },
    saturday: { workStart: '08:00', workEnd: '14:00', breakStart: undefined, breakEnd: undefined, locations: [], isActive: false },
    sunday: { workStart: '08:00', workEnd: '14:00', breakStart: undefined, breakEnd: undefined, locations: [], isActive: false }
  });
  
  // Preview and generation
  const [preview, setPreview] = useState<PlanningPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Dialogs
  const [saveTemplateDialog, setSaveTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [duplicateDialog, setDuplicateDialog] = useState(false);
  const [sourceAgent, setSourceAgent] = useState('');
  const [targetAgent, setTargetAgent] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [agentsData, locationsData, templatesData] = await Promise.all([
        usersAPI.getUsers(),
        locationsAPI.getLocations(),
        planningAPI.getPlanningTemplates(),
      ]);
      
      setAgents(agentsData.filter(user => user.role === 'AGENT'));
      setLocations(locationsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    if (!templateId) {
      setSelectedTemplate('');
      return;
    }

    try {
      const template = await planningAPI.getPlanningTemplate(templateId);
      setSelectedTemplate(templateId);
      
      // Check if template has weekly schedule
      if (template.weeklySchedule) {
        setUseWeeklyPlanning(true);
        setWeeklySchedule(template.weeklySchedule);
      } else {
        // Legacy template - convert to daily mode
        setUseWeeklyPlanning(false);
        setWorkStart(template.workStart || '07:00');
        setWorkEnd(template.workEnd || '15:30');
        setBreakStart(template.breakStart || '11:00');
        setBreakEnd(template.breakEnd || '12:00');
        setHasBreak(!!(template.breakStart && template.breakEnd));
        setLocationConfigs(template.locations || []);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Erreur lors du chargement du template');
    }
  };

  // Weekly planning helper functions
  const updateDaySchedule = (day: keyof WeeklySchedule, updates: Partial<DaySchedule>) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], ...updates }
    }));
  };

  const getCurrentDaySchedule = (): DaySchedule => {
    return weeklySchedule[selectedDay];
  };

  const copyDayToAll = () => {
    const currentDay = getCurrentDaySchedule();
    const newSchedule = { ...weeklySchedule };
    
    daysOfWeek.forEach(({ key }) => {
      if (key !== selectedDay) {
        newSchedule[key] = { ...currentDay };
      }
    });
    
    setWeeklySchedule(newSchedule);
    toast.success(`Configuration de ${daysOfWeek.find(d => d.key === selectedDay)?.label} copiée vers tous les jours`);
  };

  const addLocation = () => {
    if (useWeeklyPlanning) {
      // Add location to current day in weekly planning
      const currentDaySchedule = getCurrentDaySchedule();
      const nextPriority = Math.max(...currentDaySchedule.locations.map(lc => lc.priority), 0) + 1;
      const newConfig: LocationConfig = {
        locationId: '',
        priority: nextPriority,
        timeSlot: 'flexible',
      };
      updateDaySchedule(selectedDay, {
        locations: [...currentDaySchedule.locations, newConfig]
      });
    } else {
      // Legacy single day mode
      const nextPriority = Math.max(...locationConfigs.map(lc => lc.priority), 0) + 1;
      const newConfig: LocationConfig = {
        locationId: '',
        priority: nextPriority,
        timeSlot: 'flexible',
      };
      setLocationConfigs([...locationConfigs, newConfig]);
    }
  };

  const updateLocationConfig = (index: number, updates: Partial<LocationConfig>) => {
    if (useWeeklyPlanning) {
      // Update location in current day in weekly planning
      const currentDaySchedule = getCurrentDaySchedule();
      const updated = [...currentDaySchedule.locations];
      updated[index] = { ...updated[index], ...updates };
      updateDaySchedule(selectedDay, { locations: updated });
    } else {
      // Legacy single day mode
      const updated = [...locationConfigs];
      updated[index] = { ...updated[index], ...updates };
      setLocationConfigs(updated);
    }
  };

  const removeLocationConfig = (index: number) => {
    if (useWeeklyPlanning) {
      // Remove location from current day in weekly planning
      const currentDaySchedule = getCurrentDaySchedule();
      const updated = currentDaySchedule.locations.filter((_, i) => i !== index);
      // Reorder priorities
      const reordered = updated.map((lc, i) => ({ ...lc, priority: i + 1 }));
      updateDaySchedule(selectedDay, { locations: reordered });
    } else {
      // Legacy single day mode
      const updated = locationConfigs.filter((_, i) => i !== index);
      // Reorder priorities
      const reordered = updated.map((lc, i) => ({ ...lc, priority: i + 1 }));
      setLocationConfigs(reordered);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    if (useWeeklyPlanning) {
      // Handle drag & drop for weekly planning
      const currentDaySchedule = getCurrentDaySchedule();
      const items = Array.from(currentDaySchedule.locations);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      // Update priorities
      const reordered = items.map((item, index) => ({
        ...item,
        priority: index + 1,
      }));

      updateDaySchedule(selectedDay, { locations: reordered });
    } else {
      // Legacy single day mode
      const items = Array.from(locationConfigs);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      // Update priorities
      const reordered = items.map((item, index) => ({
        ...item,
        priority: index + 1,
      }));

      setLocationConfigs(reordered);
    }
  };

  const generatePreview = async () => {
    if (!selectedAgent) {
      toast.error('Veuillez sélectionner un agent');
      return;
    }

    // Détecter le jour actuel pour le planning hebdomadaire
    const getCurrentDayKey = (): keyof WeeklySchedule => {
      const today = new Date();
      const dayIndex = today.getDay(); // 0 = dimanche, 1 = lundi, etc.
      const dayKeys: (keyof WeeklySchedule)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      return dayKeys[dayIndex];
    };

    if (useWeeklyPlanning) {
      const todayKey = getCurrentDayKey();
      const todaySchedule = weeklySchedule[todayKey];
      
      // Vérifier si le jour actuel est actif
      if (!todaySchedule.isActive) {
        toast.error(`Aucun planning configuré pour aujourd'hui (${daysOfWeek.find(d => d.key === todayKey)?.label})`);
        return;
      }

      if (todaySchedule.locations.length === 0) {
        toast.error(`Aucun lieu à nettoyer configuré pour aujourd'hui (${daysOfWeek.find(d => d.key === todayKey)?.label})`);
        return;
      }

      const config: PlanningConfig = {
        agentId: selectedAgent,
        workStart: todaySchedule.workStart,
        workEnd: todaySchedule.workEnd,
        breakStart: todaySchedule.breakStart,
        breakEnd: todaySchedule.breakEnd,
        locations: todaySchedule.locations.filter(lc => lc.locationId),
      };

      const request: GeneratePlanningRequest = {
        agentId: selectedAgent,
        config,
      };

      setIsPreviewLoading(true);
      try {
        const previewData = await planningAPI.previewPlanning(request);
        setPreview(previewData);
        toast.success(`Planning généré pour aujourd'hui (${daysOfWeek.find(d => d.key === todayKey)?.label})`);
      } catch (error: any) {
        console.error('Error generating preview:', error);
        toast.error(error.response?.data?.error || 'Erreur lors de la prévisualisation');
      } finally {
        setIsPreviewLoading(false);
      }
    } else {
      // Mode planning journalier classique
      if (locationConfigs.length === 0) {
        toast.error('Veuillez ajouter au moins un lieu à nettoyer');
        return;
      }

      const config: PlanningConfig = {
        agentId: selectedAgent,
        workStart,
        workEnd,
        breakStart: hasBreak ? breakStart : undefined,
        breakEnd: hasBreak ? breakEnd : undefined,
        locations: locationConfigs.filter(lc => lc.locationId),
      };

      const request: GeneratePlanningRequest = {
        agentId: selectedAgent,
        config,
      };

      setIsPreviewLoading(true);
      try {
        const previewData = await planningAPI.previewPlanning(request);
        setPreview(previewData);
      } catch (error: any) {
        console.error('Error generating preview:', error);
        toast.error(error.response?.data?.error || 'Erreur lors de la prévisualisation');
      } finally {
        setIsPreviewLoading(false);
      }
    }
  };

  const generatePlanning = async () => {
    if (!preview || preview.conflicts.length > 0) {
      toast.error('Veuillez résoudre les conflits avant de générer le planning');
      return;
    }

    // Détecter le jour actuel pour le planning hebdomadaire
    const getCurrentDayKey = (): keyof WeeklySchedule => {
      const today = new Date();
      const dayIndex = today.getDay(); // 0 = dimanche, 1 = lundi, etc.
      const dayKeys: (keyof WeeklySchedule)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      return dayKeys[dayIndex];
    };

    setIsGenerating(true);
    try {
      const config: PlanningConfig = useWeeklyPlanning ? (() => {
        const todayKey = getCurrentDayKey();
        const todaySchedule = weeklySchedule[todayKey];
        return {
          agentId: selectedAgent,
          workStart: todaySchedule.workStart,
          workEnd: todaySchedule.workEnd,
          breakStart: todaySchedule.breakStart,
          breakEnd: todaySchedule.breakEnd,
          locations: todaySchedule.locations.filter(lc => lc.locationId),
        };
      })() : {
        agentId: selectedAgent,
        workStart,
        workEnd,
        breakStart: hasBreak ? breakStart : undefined,
        breakEnd: hasBreak ? breakEnd : undefined,
        locations: locationConfigs.filter(lc => lc.locationId),
      };

      const request: GeneratePlanningRequest = {
        agentId: selectedAgent,
        config,
        replaceExisting: true,
      };

      const result = await planningAPI.generatePlanning(request);
      
      if (useWeeklyPlanning) {
        const todayKey = getCurrentDayKey();
        const todayLabel = daysOfWeek.find(d => d.key === todayKey)?.label;
        toast.success(`Planning généré avec succès pour aujourd'hui (${todayLabel}) !`);
      } else {
        toast.success(result.message);
      }
      
      setPreview(null);
    } catch (error: any) {
      console.error('Error generating planning:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la génération du planning');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveTemplate = async () => {
    if (!templateName) {
      toast.error('Veuillez entrer un nom pour le template');
      return;
    }

    try {
      const templateData: CreatePlanningTemplateRequest = useWeeklyPlanning ? {
        name: templateName,
        description: templateDescription,
        weeklySchedule: weeklySchedule,
      } : {
        name: templateName,
        description: templateDescription,
        workStart,
        workEnd,
        breakStart: hasBreak ? breakStart : undefined,
        breakEnd: hasBreak ? breakEnd : undefined,
        locations: locationConfigs.filter(lc => lc.locationId),
      };

      await planningAPI.createPlanningTemplate(templateData);
      toast.success('Template sauvegardé avec succès');
      setSaveTemplateDialog(false);
      setTemplateName('');
      setTemplateDescription('');
      loadInitialData();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const duplicatePlanning = async () => {
    if (!sourceAgent || !targetAgent) {
      toast.error('Veuillez sélectionner les agents source et cible');
      return;
    }

    try {
      const request: DuplicatePlanningRequest = {
        sourceAgentId: sourceAgent,
        targetAgentId: targetAgent,
      };

      const result = await planningAPI.duplicatePlanning(request);
      toast.success(`Planning dupliqué: ${result.tasksCreated} tâches créées`);
      setDuplicateDialog(false);
      setSourceAgent('');
      setTargetAgent('');
    } catch (error: any) {
      console.error('Error duplicating planning:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la duplication');
    }
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    return location?.name || 'Lieu inconnu';
  };

  const calculateEstimatedDuration = (locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    if (!location) return 15;
    
    if (location.surface && location.cleaningCoefficient) {
      return Math.ceil(location.surface * location.cleaningCoefficient);
    }
    
    // Default durations by type
    const defaultDurations: { [key: string]: number } = {
      'infirmerie': 20,
      'classe': 15,
      'sanitaire': 30,
      'bureau': 10,
      'atelier': 25
    };
    
    return defaultDurations[location.type] || 15;
  };

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
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" gutterBottom>
          Générateur de Planning Agent
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          📅 {today} • 🕐 {currentTime}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {/* Agent and Template Selection */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Agent</InputLabel>
                    <Select
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      label="Agent"
                    >
                      {agents.map(agent => (
                        <MenuItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Template</InputLabel>
                    <Select
                      value={selectedTemplate}
                      onChange={(e) => handleTemplateSelect(e.target.value)}
                      label="Template"
                    >
                      <MenuItem value="">Nouveau planning</MenuItem>
                      {templates.map(template => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    variant="outlined"
                    startIcon={<DuplicateIcon />}
                    onClick={() => setDuplicateDialog(true)}
                    fullWidth
                  >
                    Dupliquer
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* Planning Mode Selection */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Horaires de Travail
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useWeeklyPlanning}
                        onChange={(e) => setUseWeeklyPlanning(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Planning hebdomadaire"
                  />
                </Box>

                {useWeeklyPlanning ? (
                  /* Weekly Planning Interface */
                  <Box>
                    {/* Message d'info pour le jour actuel */}
                    <Alert severity="info" sx={{ mb: 2 }}>
                      🗓️ Configuration des horaires par jour de la semaine. 
                      <strong> Aujourd'hui c'est {(() => {
                        const today = new Date();
                        const dayIndex = today.getDay();
                        const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                        const todayKey = dayKeys[dayIndex] as keyof WeeklySchedule;
                        return daysOfWeek.find(d => d.key === todayKey)?.label;
                      })()}</strong>, c'est ce planning qui sera utilisé pour la génération.
                    </Alert>

                    {/* Days Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                      <Tabs
                        value={selectedDay}
                        onChange={(_, newValue) => setSelectedDay(newValue)}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                      >
                        {daysOfWeek.map(({ key, label, shortLabel }) => {
                          const daySchedule = weeklySchedule[key];
                          const isActive = daySchedule.isActive;
                          return (
                            <Tab
                              key={key}
                              value={key}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {shortLabel}
                                  <Chip 
                                    size="small" 
                                    color={isActive ? 'success' : 'default'}
                                    variant="outlined"
                                    label={isActive ? '✓' : '✗'}
                                    sx={{ minWidth: 24, height: 20, fontSize: '10px' }}
                                  />
                                </Box>
                              }
                              sx={{ minWidth: 90 }}
                            />
                          );
                        })}
                      </Tabs>
                    </Box>

                    {/* Current Day Configuration */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: 'primary.main' }}>
                          📅 {daysOfWeek.find(d => d.key === selectedDay)?.label}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={getCurrentDaySchedule().isActive || false}
                                onChange={(e) => updateDaySchedule(selectedDay, { isActive: e.target.checked })}
                                size="small"
                              />
                            }
                            label="Actif"
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={copyDayToAll}
                            sx={{ minWidth: 120 }}
                          >
                            Copier vers tout
                          </Button>
                        </Box>
                      </Box>

                      {getCurrentDaySchedule().isActive && (
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={6} sm={3}>
                            <TextField
                              type="time"
                              label="Début"
                              value={getCurrentDaySchedule().workStart}
                              onChange={(e) => updateDaySchedule(selectedDay, { workStart: e.target.value })}
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              inputProps={{ step: 300 }}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              type="time"
                              label="Fin"
                              value={getCurrentDaySchedule().workEnd}
                              onChange={(e) => updateDaySchedule(selectedDay, { workEnd: e.target.value })}
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              inputProps={{ step: 300 }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={!!(getCurrentDaySchedule().breakStart && getCurrentDaySchedule().breakEnd)}
                                  onChange={(e) => updateDaySchedule(selectedDay, e.target.checked 
                                    ? { breakStart: '11:00', breakEnd: '12:00' } 
                                    : { breakStart: undefined, breakEnd: undefined }
                                  )}
                                />
                              }
                              label="Pause"
                            />
                          </Grid>
                          {getCurrentDaySchedule().breakStart && getCurrentDaySchedule().breakEnd && (
                            <>
                              <Grid item xs={6} sm={2}>
                                <TextField
                                  type="time"
                                  label="Pause début"
                                  value={getCurrentDaySchedule().breakStart}
                                  onChange={(e) => updateDaySchedule(selectedDay, { breakStart: e.target.value })}
                                  fullWidth
                                  InputLabelProps={{ shrink: true }}
                                  inputProps={{ step: 300 }}
                                />
                              </Grid>
                              <Grid item xs={6} sm={2}>
                                <TextField
                                  type="time"
                                  label="Pause fin"
                                  value={getCurrentDaySchedule().breakEnd}
                                  onChange={(e) => updateDaySchedule(selectedDay, { breakEnd: e.target.value })}
                                  fullWidth
                                  InputLabelProps={{ shrink: true }}
                                  inputProps={{ step: 300 }}
                                />
                              </Grid>
                            </>
                          )}
                        </Grid>
                      )}
                    </Box>
                  </Box>
                ) : (
                  /* Single Day Planning Interface (Legacy) */
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={6} sm={3}>
                      <TextField
                        type="time"
                        label="Début"
                        value={workStart}
                        onChange={(e) => setWorkStart(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ step: 300 }}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField
                        type="time"
                        label="Fin"
                        value={workEnd}
                        onChange={(e) => setWorkEnd(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ step: 300 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={hasBreak}
                            onChange={(e) => setHasBreak(e.target.checked)}
                          />
                        }
                        label="Pause"
                      />
                    </Grid>
                    {hasBreak && (
                      <>
                        <Grid item xs={6} sm={2}>
                          <TextField
                            type="time"
                            label="Pause début"
                            value={breakStart}
                            onChange={(e) => setBreakStart(e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 300 }}
                          />
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <TextField
                            type="time"
                            label="Pause fin"
                            value={breakEnd}
                            onChange={(e) => setBreakEnd(e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 300 }}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                )}
              </CardContent>
            </Card>

            {/* Locations Configuration */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Lieux à Nettoyer
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addLocation}
                    variant="contained"
                    size="small"
                  >
                    Ajouter un lieu
                  </Button>
                </Box>

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="locations">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {(useWeeklyPlanning ? getCurrentDaySchedule().locations : locationConfigs).map((config, index) => (
                          <Draggable 
                            key={index} 
                            draggableId={`location-${index}`} 
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Paper
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                sx={{
                                  p: 2,
                                  mb: 2,
                                  backgroundColor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                                }}
                              >
                                <Grid container spacing={2} alignItems="center">
                                  <Grid item>
                                    <IconButton {...provided.dragHandleProps}>
                                      <DragIcon />
                                    </IconButton>
                                  </Grid>
                                  <Grid item>
                                    <Typography variant="body2" color="primary">
                                      #{config.priority}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={12} sm={3}>
                                    <FormControl fullWidth>
                                      <InputLabel>Lieu</InputLabel>
                                      <Select
                                        value={config.locationId}
                                        onChange={(e) => updateLocationConfig(index, { locationId: e.target.value })}
                                        label="Lieu"
                                      >
                                        {locations.map(location => (
                                          <MenuItem key={location.id} value={location.id}>
                                            {location.name} ({location.type})
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </Grid>
                                  <Grid item xs={12} sm={3}>
                                    <FormControl fullWidth>
                                      <InputLabel>Créneau</InputLabel>
                                      <Select
                                        value={config.timeSlot}
                                        onChange={(e) => updateLocationConfig(index, { timeSlot: e.target.value as any })}
                                        label="Créneau"
                                      >
                                        {timeSlotOptions.map(option => (
                                          <MenuItem key={option.value} value={option.value}>
                                            <Tooltip title={option.description}>
                                              <span>{option.label}</span>
                                            </Tooltip>
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </Grid>
                                  <Grid item xs={6} sm={2}>
                                    <TextField
                                      type="number"
                                      label="Durée (min)"
                                      value={config.estimatedDuration || calculateEstimatedDuration(config.locationId)}
                                      onChange={(e) => updateLocationConfig(index, { estimatedDuration: parseInt(e.target.value) || undefined })}
                                      fullWidth
                                    />
                                  </Grid>
                                  <Grid item>
                                    <IconButton
                                      onClick={() => removeLocationConfig(index)}
                                      color="error"
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Grid>
                                </Grid>
                              </Paper>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                startIcon={<PreviewIcon />}
                onClick={generatePreview}
                disabled={isPreviewLoading}
                variant="outlined"
              >
                Prévisualiser
              </Button>
              <Button
                startIcon={<GenerateIcon />}
                onClick={generatePlanning}
                disabled={isGenerating || !preview || preview.conflicts.length > 0}
                variant="contained"
              >
                Générer Planning
              </Button>
              <Button
                startIcon={<SaveIcon />}
                onClick={() => setSaveTemplateDialog(true)}
                variant="outlined"
              >
                Sauvegarder Template
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Preview Panel */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Prévisualisation du Planning
            </Typography>
            
            {preview ? (
              <>
                {/* Summary */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Durée totale: {Math.floor(preview.totalDuration / 60)}h {preview.totalDuration % 60}min
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Nombre de tâches: {preview.tasks.length}
                  </Typography>
                </Box>

                {/* Conflicts */}
                {preview.conflicts.length > 0 && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Conflits détectés:
                    </Typography>
                    {preview.conflicts.map((conflict, index) => (
                      <Typography key={index} variant="body2">
                        • {conflict}
                      </Typography>
                    ))}
                  </Alert>
                )}

                {/* Warnings */}
                {preview.warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Avertissements:
                    </Typography>
                    {preview.warnings.map((warning, index) => (
                      <Typography key={index} variant="body2">
                        • {warning}
                      </Typography>
                    ))}
                  </Alert>
                )}

                {/* Tasks Timeline */}
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Heure</TableCell>
                        <TableCell>Lieu</TableCell>
                        <TableCell>Durée</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {preview.tasks.map((task, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2">
                              {task.startTime} - {task.endTime}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {task.locationName}
                            </Typography>
                            <Chip
                              label={timeSlotOptions.find(ts => ts.value === task.timeSlot)?.label}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {task.duration}min
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Cliquez sur "Prévisualiser" pour voir le planning généré
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Résumé du planning hebdomadaire */}
      {useWeeklyPlanning && (
        <Card sx={{ mb: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              📅 Résumé du Planning Hebdomadaire
            </Typography>
            <Grid container spacing={1}>
              {daysOfWeek.map(({ key, label }) => {
                const daySchedule = weeklySchedule[key];
                const isToday = (() => {
                  const today = new Date();
                  const dayIndex = today.getDay();
                  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                  return dayKeys[dayIndex] === key;
                })();
                
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
                    <Box
                      sx={{
                        p: 1,
                        border: 1,
                        borderColor: isToday ? 'warning.main' : 'divider',
                        borderRadius: 1,
                        bgcolor: isToday ? 'warning.light' : 'background.paper',
                        color: isToday ? 'warning.contrastText' : 'text.primary'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {isToday && '🔥 '}{label}
                        </Typography>
                        <Chip
                          size="small"
                          color={daySchedule.isActive ? 'success' : 'default'}
                          label={daySchedule.isActive ? 'Actif' : 'Inactif'}
                          sx={{ fontSize: '10px', height: 18 }}
                        />
                      </Box>
                      {daySchedule.isActive ? (
                        <Box>
                          <Typography variant="caption" display="block">
                            🕐 {daySchedule.workStart || '07:00'} - {daySchedule.workEnd || '15:30'}
                          </Typography>
                          {daySchedule.breakStart && daySchedule.breakEnd && (
                            <Typography variant="caption" display="block">
                              ☕ Pause: {daySchedule.breakStart} - {daySchedule.breakEnd}
                            </Typography>
                          )}
                          <Typography variant="caption" display="block" sx={{ color: 'success.main' }}>
                            📍 {daySchedule.locations?.length || 0} lieux
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Jour non travaillé
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
            
            {/* Diagnostic pour aujourd'hui */}
            {(() => {
              const today = new Date();
              const dayIndex = today.getDay();
              const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
              const todayKey = dayKeys[dayIndex] as keyof WeeklySchedule;
              const todaySchedule = weeklySchedule[todayKey];
              
              return (
                <Alert 
                  severity={todaySchedule.isActive ? 'success' : 'warning'} 
                  sx={{ mt: 2 }}
                >
                  <strong>🔍 Diagnostic pour aujourd'hui:</strong>
                  {todaySchedule.isActive ? (
                    <span>
                      ✅ Le planning est ACTIF pour aujourd'hui. 
                      Les agents devraient avoir {todaySchedule.locations?.length || 0} tâches.
                      {todaySchedule.locations?.length === 0 && (
                        <strong> ⚠️ ATTENTION: Aucun lieu configuré pour aujourd'hui!</strong>
                      )}
                    </span>
                  ) : (
                    <span>
                      ❌ Le planning est INACTIF pour aujourd'hui. 
                      C'est pourquoi vos agents n'ont pas de tâches.
                      <strong> Activez ce jour et ajoutez des lieux pour corriger le problème.</strong>
                    </span>
                  )}
                </Alert>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Save Template Dialog */}
      <Dialog open={saveTemplateDialog} onClose={() => setSaveTemplateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sauvegarder Template</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom du template"
            fullWidth
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optionnel)"
            fullWidth
            multiline
            rows={3}
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveTemplateDialog(false)}>Annuler</Button>
          <Button onClick={saveTemplate} variant="contained">Sauvegarder</Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Planning Dialog */}
      <Dialog open={duplicateDialog} onClose={() => setDuplicateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Dupliquer Planning</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Agent source</InputLabel>
                <Select
                  value={sourceAgent}
                  onChange={(e) => setSourceAgent(e.target.value)}
                  label="Agent source"
                >
                  {agents.map(agent => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Agent cible</InputLabel>
                <Select
                  value={targetAgent}
                  onChange={(e) => setTargetAgent(e.target.value)}
                  label="Agent cible"
                >
                  {agents.filter(agent => agent.id !== sourceAgent).map(agent => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateDialog(false)}>Annuler</Button>
          <Button onClick={duplicatePlanning} variant="contained">Dupliquer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlanningGenerator;