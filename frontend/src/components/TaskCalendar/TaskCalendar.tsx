import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Close, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { Calendar, momentLocalizer, Event, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';

// Configurer moment.js en français
moment.locale('fr');
import { Task, TaskStatus } from '../../types';
import { TASK_STATUS_COLORS, PRIORITY_COLORS } from '../../utils/constants';

const localizer = momentLocalizer(moment);

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onSlotSelect?: (slotInfo: { start: Date; end: Date }) => void;
  canCreateTasks?: boolean;
}

interface CalendarEvent extends Event {
  resource: Task;
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({
  tasks,
  onTaskClick,
  onSlotSelect,
  canCreateTasks = false,
}) => {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Filtrer les tâches
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (statusFilter && task.status !== statusFilter) return false;
      return true;
    });
  }, [tasks, statusFilter]);

  // Convertir les tâches en événements de calendrier
  const events: CalendarEvent[] = useMemo(() => {
    return filteredTasks.map(task => {
      const startDate = task.scheduledDate ? new Date(task.scheduledDate) : new Date();
      const endDate = new Date(startDate);
      
      // Ajouter la durée estimée ou 1 heure par défaut
      if (task.estimatedDuration) {
        endDate.setMinutes(endDate.getMinutes() + task.estimatedDuration);
      } else {
        endDate.setHours(endDate.getHours() + 1);
      }

      return {
        id: task.id,
        title: task.title,
        start: startDate,
        end: endDate,
        resource: task,
        allDay: false,
      };
    });
  }, [filteredTasks]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedTask(event.resource);
    setDialogOpen(true);
    onTaskClick?.(event.resource);
  };

  const handleSelectSlot = (slotInfo: any) => {
    if (canCreateTasks && onSlotSelect) {
      onSlotSelect(slotInfo);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTask(null);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const task = event.resource;
    const statusColor = TASK_STATUS_COLORS[task.status];
    const priorityColor = PRIORITY_COLORS[task.priority];

    return {
      style: {
        backgroundColor: statusColor,
        borderColor: priorityColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '4px',
        opacity: task.status === TaskStatus.COMPLETED ? 0.7 : 1,
        color: 'white',
        fontSize: '12px',
        padding: '2px 6px',
      },
    };
  };

  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={() => onNavigate('PREV')} size="small">
          <ChevronLeft />
        </IconButton>
        <Typography variant="h6" sx={{ minWidth: '200px', textAlign: 'center' }}>
          {label}
        </Typography>
        <IconButton onClick={() => onNavigate('NEXT')} size="small">
          <ChevronRight />
        </IconButton>
        <Button 
          onClick={() => onNavigate('TODAY')} 
          variant="outlined" 
          size="small"
          sx={{ ml: 1 }}
        >
          Aujourd'hui
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
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
        
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button 
            variant={view === 'month' ? 'contained' : 'outlined'} 
            onClick={() => onView('month')}
            size="small"
          >
            Mois
          </Button>
          <Button 
            variant={view === 'week' ? 'contained' : 'outlined'} 
            onClick={() => onView('week')}
            size="small"
          >
            Semaine
          </Button>
          <Button 
            variant={view === 'day' ? 'contained' : 'outlined'} 
            onClick={() => onView('day')}
            size="small"
          >
            Jour
          </Button>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Paper sx={{ p: 2, height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={canCreateTasks}
          eventPropGetter={eventStyleGetter}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          components={{
            toolbar: CustomToolbar,
          }}
          messages={{
            next: 'Suivant',
            previous: 'Précédent',
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
            agenda: 'Agenda',
            date: 'Date',
            time: 'Heure',
            event: 'Tâche',
            noEventsInRange: 'Aucune tâche dans cette période.',
            allDay: 'Toute la journée',
          }}
          formats={{
            monthHeaderFormat: 'MMMM YYYY',
            dayHeaderFormat: 'dddd DD MMMM YYYY',
            dayRangeHeaderFormat: ({ start, end }) =>
              `${moment(start).format('DD MMMM')} - ${moment(end).format('DD MMMM YYYY')}`,
          }}
        />
      </Paper>

      {/* Dialog pour afficher les détails de la tâche */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {selectedTask && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{selectedTask.title}</Typography>
              <IconButton onClick={handleCloseDialog} size="small">
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {selectedTask.description && (
                  <Typography variant="body1">{selectedTask.description}</Typography>
                )}
                
                <Divider />
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={selectedTask.status === TaskStatus.PENDING ? 'En attente' :
                           selectedTask.status === TaskStatus.IN_PROGRESS ? 'En cours' : 'Terminée'}
                    sx={{ 
                      backgroundColor: TASK_STATUS_COLORS[selectedTask.status], 
                      color: 'white' 
                    }}
                  />
                  <Chip
                    label={selectedTask.priority === 'LOW' ? 'Faible' :
                           selectedTask.priority === 'MEDIUM' ? 'Moyenne' :
                           selectedTask.priority === 'HIGH' ? 'Haute' : 'Urgente'}
                    sx={{ 
                      backgroundColor: PRIORITY_COLORS[selectedTask.priority], 
                      color: 'white' 
                    }}
                  />
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Lieu:</strong> {selectedTask.location.name}
                  </Typography>
                  {selectedTask.assignedAgent && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Agent assigné:</strong> {selectedTask.assignedAgent.name}
                    </Typography>
                  )}
                  {selectedTask.scheduledDate && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Date prévue:</strong> {moment(selectedTask.scheduledDate).format('DD/MM/YYYY HH:mm')}
                    </Typography>
                  )}
                  {(selectedTask.actualDuration || selectedTask.estimatedDuration) && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Durée:</strong> {selectedTask.actualDuration ? 
                        `${selectedTask.actualDuration}min (réelle)` : 
                        `${selectedTask.estimatedDuration}min (estimée)`}
                    </Typography>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Fermer</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TaskCalendar;