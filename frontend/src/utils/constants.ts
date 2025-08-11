import { TaskStatus, Priority } from '../types';

export const TASK_STATUS_LABELS = {
  [TaskStatus.PENDING]: 'En attente',
  [TaskStatus.IN_PROGRESS]: 'En cours',
  [TaskStatus.COMPLETED]: 'Terminé',
  [TaskStatus.CANCELLED]: 'Annulé',
};

export const TASK_STATUS_COLORS = {
  [TaskStatus.PENDING]: '#ff9800',
  [TaskStatus.IN_PROGRESS]: '#2196f3',
  [TaskStatus.COMPLETED]: '#4caf50',
  [TaskStatus.CANCELLED]: '#f44336',
};

export const PRIORITY_LABELS = {
  [Priority.LOW]: 'Faible',
  [Priority.MEDIUM]: 'Moyenne',
  [Priority.HIGH]: 'Haute',
  [Priority.URGENT]: 'Urgente',
};

export const PRIORITY_COLORS = {
  [Priority.LOW]: '#4caf50',
  [Priority.MEDIUM]: '#ff9800',
  [Priority.HIGH]: '#ff5722',
  [Priority.URGENT]: '#f44336',
};

export const ROLE_LABELS = {
  ADMIN: 'Administrateur',
  AGENT: 'Agent',
};