import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit, Delete, PlayArrow, CheckCircle, DragIndicator } from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskStatus } from '../../types';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../../utils/constants';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  canEdit?: boolean;
  canManage?: boolean;
  isDragging?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStartTask,
  onCompleteTask,
  canEdit = false,
  canManage = false,
  isDragging = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 2,
        cursor: 'grab',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
        },
        '&:active': {
          cursor: 'grabbing',
        },
        transition: 'all 0.2s ease-in-out',
      }}
      {...attributes}
      {...listeners}
    >
      <CardContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" sx={{ mb: 0.5 }}>
              {task.title}
            </Typography>
            {task.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {task.description}
              </Typography>
            )}
          </Box>
          <Tooltip title="Glisser pour déplacer">
            <DragIndicator 
              sx={{ 
                color: 'text.secondary',
                cursor: 'grab',
                '&:active': {
                  cursor: 'grabbing',
                }
              }} 
            />
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip
            label={TASK_STATUS_LABELS[task.status]}
            sx={{ 
              backgroundColor: TASK_STATUS_COLORS[task.status], 
              color: 'white',
              fontWeight: 'bold'
            }}
            size="small"
          />
          <Chip
            label={PRIORITY_LABELS[task.priority]}
            sx={{ 
              backgroundColor: PRIORITY_COLORS[task.priority], 
              color: 'white',
              fontWeight: 'bold'
            }}
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Lieu:</strong> {task.location.name}
          </Typography>
          {task.assignedAgent && (
            <Typography variant="body2" color="text.secondary">
              • <strong>Agent:</strong> {task.assignedAgent.name}
            </Typography>
          )}
          {(task.actualDuration || task.estimatedDuration) && (
            <Typography variant="body2" color="text.secondary">
              • <strong>Durée:</strong> {task.actualDuration ? `${task.actualDuration}min` : `~${task.estimatedDuration}min`}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {/* Agent actions */}
            {canEdit && task.status === TaskStatus.PENDING && (
              <Button
                size="small"
                variant="contained"
                color="info"
                startIcon={<PlayArrow />}
                onClick={(e) => {
                  e.stopPropagation();
                  onStartTask?.(task.id);
                }}
              >
                Démarrer
              </Button>
            )}
            {canEdit && task.status === TaskStatus.IN_PROGRESS && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={(e) => {
                  e.stopPropagation();
                  onCompleteTask?.(task.id);
                }}
              >
                Terminer
              </Button>
            )}
          </Box>

          {/* Admin actions */}
          {canManage && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Modifier">
                <IconButton
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(task);
                  }}
                  size="small"
                >
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title="Supprimer">
                <IconButton
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(task.id);
                  }}
                  size="small"
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TaskCard;