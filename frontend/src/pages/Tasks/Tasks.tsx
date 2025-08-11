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
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material';
import { 
  Add, 
  Edit, 
  Delete, 
  PlayArrow, 
  CheckCircle, 
  Schedule,
} from '@mui/icons-material';
import Timer from '../../components/Timer/Timer';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { fetchTasks, createTask, updateTask, deleteTask } from '../../store/slices/tasksSlice';
import { fetchUsers } from '../../store/slices/usersSlice';
import { fetchLocations } from '../../store/slices/locationsSlice';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../../utils/constants';
import { CreateTaskRequest, UpdateTaskRequest, TaskStatus, Priority } from '../../types';
import { tasksAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface TaskFormData extends CreateTaskRequest {
  id?: string;
  scheduledDate?: string;
}

const Tasks: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, isLoading, error } = useAppSelector((state) => state.tasks);
  const { users } = useAppSelector((state) => state.users);
  const { locations } = useAppSelector((state) => state.locations);
  const { user } = useAppSelector((state) => state.auth);

  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    locationId: '',
    assignedAgentId: '',
    priority: Priority.MEDIUM,
    estimatedDuration: undefined,
    scheduledDate: undefined,
  });

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('');

  useEffect(() => {
    // Filter tasks by current date
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (user?.role === 'AGENT') {
      // Agents only see their tasks for today
      dispatch(fetchTasks({
        assignedAgentId: user.id,
        startDate: today,
        endDate: today,
      }));
    } else {
      // Admin sees all tasks for today
      dispatch(fetchTasks({
        startDate: today,
        endDate: today,
      }));
    }
    
    dispatch(fetchUsers());
    dispatch(fetchLocations());
  }, [dispatch, user]);

  const agents = users.filter(u => u.role === 'AGENT');
  
  const filteredTasks = tasks.filter(task => {
    if (statusFilter && task.status !== statusFilter) return false;
    if (agentFilter && task.assignedAgentId !== agentFilter) return false;
    return true;
  });

  const handleOpenDialog = (task?: any) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        id: task.id,
        title: task.title,
        description: task.description || '',
        locationId: task.locationId,
        assignedAgentId: task.assignedAgentId || '',
        priority: task.priority,
        estimatedDuration: task.estimatedDuration,
        scheduledDate: task.scheduledDate ? new Date(task.scheduledDate).toISOString().slice(0, 16) : undefined,
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        locationId: '',
        assignedAgentId: '',
        priority: Priority.MEDIUM,
        estimatedDuration: undefined,
        scheduledDate: undefined,
      });
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = async () => {
    try {
      const dataToSubmit = {
        ...formData,
        estimatedDuration: formData.estimatedDuration || undefined,
        assignedAgentId: formData.assignedAgentId || undefined,
        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : undefined,
      };

      if (editingTask) {
        await dispatch(updateTask({ id: editingTask.id, data: dataToSubmit })).unwrap();
      } else {
        await dispatch(createTask(dataToSubmit)).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        await dispatch(deleteTask(id)).unwrap();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus, actualDuration?: number) => {
    try {
      const updateData: UpdateTaskRequest = { status };
      if (actualDuration) {
        updateData.actualDuration = actualDuration;
      }
      await dispatch(updateTask({ id: taskId, data: updateData })).unwrap();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      await tasksAPI.startTask(taskId);
      dispatch(fetchTasks()); // Refresh tasks
      toast.success('Tâche démarrée !');
    } catch (error) {
      console.error('Error starting task:', error);
      toast.error('Erreur lors du démarrage de la tâche');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await tasksAPI.completeTask(taskId);
      dispatch(fetchTasks()); // Refresh tasks
      toast.success('Tâche terminée !');
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Erreur lors de la finalisation de la tâche');
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const updateData: UpdateTaskRequest = { status: newStatus };
      await dispatch(updateTask({ id: taskId, data: updateData })).unwrap();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleSlotSelect = (slotInfo: { start: Date; end: Date }) => {
    setFormData({
      ...formData,
      scheduledDate: slotInfo.start.toISOString(),
    });
    handleOpenDialog();
  };

  if (isLoading && tasks.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Quick stats for agents
  const myTasks = tasks.filter(task => task.assignedAgentId === user?.id);
  const myCompletedTasks = myTasks.filter(task => task.status === TaskStatus.COMPLETED);
  const myInProgressTasks = myTasks.filter(task => task.status === TaskStatus.IN_PROGRESS);

  // Helper function to sort tasks according to agent priority
  const sortTasksForAgent = (tasks: any[]) => {
    if (user?.role !== 'AGENT') return tasks;
    
    return [...tasks].sort((a, b) => {
      // Priority order: infirmerie, classes, toilettes, ateliers
      const getPriority = (task: any) => {
        const locationName = task.location.name.toLowerCase();
        if (locationName.includes('infirmerie')) return 1;
        if (locationName.includes('classe')) return 2;
        if (locationName.includes('sanitaire') || locationName.includes('toilette')) return 3;
        if (locationName.includes('atelier')) return 4;
        return 5;
      };
      
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
      
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      // If same priority, sort by scheduled time
      if (a.scheduledTime && b.scheduledTime) {
        return a.scheduledTime.localeCompare(b.scheduledTime);
      }
      
      return a.createdAt.localeCompare(b.createdAt);
    });
  };

  const sortedFilteredTasks = sortTasksForAgent(filteredTasks);

  // Group tasks by agent for admin view
  const groupTasksByAgent = (tasks: any[]) => {
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') return { ungrouped: tasks };
    
    const grouped = tasks.reduce((acc: any, task) => {
      const agentName = task.assignedAgent?.name || 'Non assigné';
      const agentId = task.assignedAgent?.id || 'unassigned';
      
      if (!acc[agentId]) {
        acc[agentId] = {
          agentName,
          tasks: []
        };
      }
      acc[agentId].tasks.push(task);
      return acc;
    }, {});

    // Sort agents by name
    return Object.fromEntries(
      Object.entries(grouped).sort(([, a]: any, [, b]: any) => 
        a.agentName.localeCompare(b.agentName)
      )
    );
  };

  const groupedTasks = groupTasksByAgent(sortedFilteredTasks);

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
      {/* Date and working hours header for agents */}
      {user?.role === 'AGENT' && (
        <Box mb={3} p={2} sx={{ backgroundColor: 'primary.light', borderRadius: 1, color: 'white' }}>
          <Typography variant="h5" fontWeight="bold" align="center">
            📅 {today}
          </Typography>
          <Typography variant="h6" align="center" sx={{ mt: 1 }}>
            🕐 Heure actuelle: {currentTime}
          </Typography>
          <Box display="flex" justifyContent="space-around" sx={{ mt: 2 }}>
            <Typography variant="body1">
              🌅 <strong>Début:</strong> 7h00
            </Typography>
            <Typography variant="body1">
              ☕ <strong>Pause:</strong> 11h00-12h00
            </Typography>
            <Typography variant="body1">
              🌇 <strong>Fin:</strong> 15h30
            </Typography>
          </Box>
        </Box>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {user?.role === 'AGENT' ? 'Mon Planning du Jour' : 'Gestion des Tâches'}
        </Typography>
        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Nouvelle Tâche
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Quick Stats for Agents */}
      {user?.role === 'AGENT' && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Schedule color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{myTasks.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mes Tâches
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <PlayArrow color="info" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{myInProgressTasks.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      En Cours
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{myCompletedTasks.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Terminées
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtres */}
      <Box display="flex" gap={2} mb={3}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={statusFilter}
            label="Statut"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value={TaskStatus.PENDING}>En attente</MenuItem>
            <MenuItem value={TaskStatus.IN_PROGRESS}>En cours</MenuItem>
            <MenuItem value={TaskStatus.COMPLETED}>Terminé</MenuItem>
          </Select>
        </FormControl>

        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Agent</InputLabel>
            <Select
              value={agentFilter}
              label="Agent"
              onChange={(e) => setAgentFilter(e.target.value)}
            >
              <MenuItem value="">Tous les agents</MenuItem>
              {agents.map(agent => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Date and time for admin */}
      {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
        <Box mb={1} display="flex" justifyContent="flex-end">
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            📅 {today} • 🕐 {currentTime}
          </Typography>
        </Box>
      )}

      {/* Vue tableau */}
      <TableContainer component={Paper} elevation={2}>
          <Table 
            size={(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? 'small' : 'medium'}
            sx={(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? { 
              '& .MuiTableCell-root': { 
                padding: '4px 8px',
                fontSize: '0.75rem'
              }
            } : {}}
          >
            <TableHead>
              <TableRow>
                <TableCell>Lieu</TableCell>
                {user?.role === 'AGENT' && <TableCell>Heure Prévue</TableCell>}
                <TableCell>Agent</TableCell>
                <TableCell>Statut</TableCell>
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && <TableCell>Heure Début Réelle</TableCell>}
                <TableCell>Durée</TableCell>
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? (
                // Grouped view for admin
                Object.entries(groupedTasks).map(([agentId, group]: [string, any]) => (
                  <React.Fragment key={agentId}>
                    {/* Agent header row */}
                    <TableRow>
                      <TableCell 
                        colSpan={6} 
                        sx={{ 
                          backgroundColor: 'primary.light', 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}
                      >
                        👤 {group.agentName} ({group.tasks.length} tâches)
                      </TableCell>
                    </TableRow>
                    {/* Agent tasks */}
                    {group.tasks.map((task: any) => (
                      <TableRow key={task.id} hover>
                        <TableCell>
                          <Typography variant="body2">
                            <strong>{task.location.name}</strong>
                            <br />
                            <span style={{ color: 'text.secondary', fontSize: '0.8em' }}>
                              {task.location.floor}
                            </span>
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {task.assignedAgent ? task.assignedAgent.name : 'Non assigné'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={TASK_STATUS_LABELS[task.status]}
                            sx={{ 
                              backgroundColor: TASK_STATUS_COLORS[task.status], 
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem'
                            }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {task.startTime ? (
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              🕐 <strong>{new Date(task.startTime).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}</strong>
                              <br />
                              <span style={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                {task.scheduledTime ? `Prévu: ${task.scheduledTime}` : 'Pas d\'heure prévue'}
                              </span>
                            </Typography>
                          ) : (
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                              {task.scheduledTime ? (
                                <>Prévu: {task.scheduledTime}<br /><span style={{ fontSize: '0.65rem' }}>Pas encore démarré</span></>
                              ) : (
                                'Pas d\'heure'
                              )}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Timer
                            taskId={task.id}
                            status={task.status}
                            startTime={task.startTime}
                            estimatedDuration={task.estimatedDuration}
                            actualDuration={task.actualDuration}
                            onStart={handleStartTask}
                            onComplete={handleCompleteTask}
                            isMyTask={false}
                            userRole={user?.role}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenDialog(task)}
                              size="small"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(task.id)}
                              size="small"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                // Regular view for agents
                sortedFilteredTasks.map((task) => (
                  <TableRow key={task.id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {task.location.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {task.location.floor}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" alignItems="center">
                        <Typography variant="body1" fontWeight="bold" color="primary.main">
                          🕐 {task.scheduledTime || '07:00'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          → {(() => {
                            const startTime = task.scheduledTime || '07:00';
                            const duration = task.estimatedDuration || 30;
                            const [hours, minutes] = startTime.split(':').map(Number);
                            const startMinutes = hours * 60 + minutes;
                            const endMinutes = startMinutes + duration;
                            const endHours = Math.floor(endMinutes / 60);
                            const endMins = endMinutes % 60;
                            return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
                          })()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1">
                        {task.assignedAgent ? task.assignedAgent.name : 'Non assigné'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={TASK_STATUS_LABELS[task.status]}
                        sx={{ 
                          backgroundColor: TASK_STATUS_COLORS[task.status], 
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.875rem'
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Timer
                        taskId={task.id}
                        status={task.status}
                        startTime={task.startTime}
                        estimatedDuration={task.estimatedDuration}
                        actualDuration={task.actualDuration}
                        onStart={handleStartTask}
                        onComplete={handleCompleteTask}
                        isMyTask={user?.role === 'AGENT' && task.assignedAgentId === user.id}
                        userRole={user?.role}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>



      {/* Task Form Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTask ? 'Modifier la tâche' : 'Ajouter une tâche'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Titre de la tâche"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
            <FormControl fullWidth required>
              <InputLabel>Lieu</InputLabel>
              <Select
                value={formData.locationId}
                label="Lieu"
                onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
              >
                {locations.map(location => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name} ({location.floor})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Agent assigné</InputLabel>
              <Select
                value={formData.assignedAgentId}
                label="Agent assigné"
                onChange={(e) => setFormData(prev => ({ ...prev, assignedAgentId: e.target.value }))}
              >
                <MenuItem value="">Non assigné</MenuItem>
                {agents.map(agent => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Priorité</InputLabel>
              <Select
                value={formData.priority}
                label="Priorité"
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Priority }))}
              >
                <MenuItem value={Priority.LOW}>Faible</MenuItem>
                <MenuItem value={Priority.MEDIUM}>Moyenne</MenuItem>
                <MenuItem value={Priority.HIGH}>Haute</MenuItem>
                <MenuItem value={Priority.URGENT}>Urgente</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Durée estimée (minutes)"
              type="number"
              value={formData.estimatedDuration || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                estimatedDuration: e.target.value ? Number(e.target.value) : undefined 
              }))}
              fullWidth
            />
            <TextField
              label="Date et heure planifiées"
              type="datetime-local"
              value={formData.scheduledDate || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                scheduledDate: e.target.value 
              }))}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              helperText="Optionnel - Date et heure prévues pour cette tâche"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.title || !formData.locationId}
          >
            {editingTask ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks;