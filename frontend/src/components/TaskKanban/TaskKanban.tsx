import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Badge,
} from '@mui/material';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Task, TaskStatus } from '../../types';
import TaskCard from '../TaskCard/TaskCard';

interface DroppableColumnProps {
  column: {
    id: TaskStatus;
    title: string;
    color: string;
    tasks: Task[];
  };
  activeId: string | null;
  draggedTask: Task | null;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  canEdit?: boolean;
  canManage?: boolean;
  userId?: string;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  column,
  activeId,
  draggedTask,
  onEdit,
  onDelete,
  onStartTask,
  onCompleteTask,
  canEdit,
  canManage,
  userId,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `droppable-${column.id}`,
  });

  return (
    <Grid item xs={12} md={4}>
      <Paper
        ref={setNodeRef}
        sx={{
          p: 2,
          minHeight: '400px',
          backgroundColor: 'background.paper',
          border: `2px solid ${isOver ? column.color : 'transparent'}`,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: column.color,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              color: column.color,
              fontWeight: 'bold',
              flexGrow: 1,
            }}
          >
            {column.title}
          </Typography>
          <Badge
            badgeContent={column.tasks.length}
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: column.color,
                color: 'white',
              },
            }}
          />
        </Box>

        <SortableContext 
          items={column.tasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <Box
            sx={{
              minHeight: '350px',
              borderRadius: 1,
              border: '2px dashed',
              borderColor: draggedTask && activeId ? column.color : 'transparent',
              backgroundColor: draggedTask && activeId ? `${column.color}10` : 'transparent',
              transition: 'all 0.2s ease-in-out',
              p: 1,
            }}
          >
            {column.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onStartTask={onStartTask}
                onCompleteTask={onCompleteTask}
                canEdit={canEdit && task.assignedAgentId === userId}
                canManage={canManage}
                isDragging={task.id === activeId}
              />
            ))}
            {column.tasks.length === 0 && (
              <Card
                sx={{
                  backgroundColor: 'background.default',
                  border: '2px dashed',
                  borderColor: 'divider',
                  textAlign: 'center',
                  py: 4,
                }}
              >
                <CardContent>
                  <Typography color="text.secondary">
                    Aucune tâche {column.title.toLowerCase()}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        </SortableContext>
      </Paper>
    </Grid>
  );
};

interface TaskKanbanProps {
  tasks: Task[];
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  canEdit?: boolean;
  canManage?: boolean;
  userRole?: string;
  userId?: string;
}

const TaskKanban: React.FC<TaskKanbanProps> = ({
  tasks,
  onTaskStatusChange,
  onEdit,
  onDelete,
  onStartTask,
  onCompleteTask,
  canEdit = false,
  canManage = false,
  userRole,
  userId,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columns = [
    {
      id: TaskStatus.PENDING,
      title: 'En attente',
      color: '#f57c00',
      tasks: tasks.filter(task => task.status === TaskStatus.PENDING),
    },
    {
      id: TaskStatus.IN_PROGRESS,
      title: 'En cours',
      color: '#1976d2',
      tasks: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS),
    },
    {
      id: TaskStatus.COMPLETED,
      title: 'Terminées',
      color: '#388e3c',
      tasks: tasks.filter(task => task.status === TaskStatus.COMPLETED),
    },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const task = tasks.find(t => t.id === active.id);
    setDraggedTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Cette fonction peut être utilisée pour des animations durant le drag
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;

    let newStatus: TaskStatus | null = null;

    // Si on drop directement sur une colonne (droppable zone)
    if (overId.includes('droppable-')) {
      newStatus = overId.replace('droppable-', '') as TaskStatus;
    }
    // Si on drop sur une autre tâche, prendre le statut de cette tâche
    else {
      const targetTask = tasks.find(t => t.id === overId);
      if (targetTask) {
        newStatus = targetTask.status;
      }
    }
    
    if (newStatus && task.status !== newStatus) {
      // Vérifier les permissions
      if (userRole === 'AGENT' && task.assignedAgentId !== userId) {
        return; // L'agent ne peut modifier que ses propres tâches
      }
      
      onTaskStatusChange(taskId, newStatus);
    }
  };

  const renderColumn = (column: typeof columns[0]) => {
    return (
      <DroppableColumn
        key={column.id}
        column={column}
        activeId={activeId}
        draggedTask={draggedTask}
        onEdit={onEdit}
        onDelete={onDelete}
        onStartTask={onStartTask}
        onCompleteTask={onCompleteTask}
        canEdit={canEdit}
        canManage={canManage}
        userId={userId}
      />
    );
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Grid container spacing={3}>
        {columns.map(renderColumn)}
      </Grid>

      <DragOverlay>
        {draggedTask ? (
          <TaskCard
            task={draggedTask}
            canEdit={canEdit}
            canManage={canManage}
            isDragging={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TaskKanban;