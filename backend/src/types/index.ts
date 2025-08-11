import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  organizationSlug?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'AGENT';
  organizationId?: string;
}

export interface CreateLocationRequest {
  name: string;
  description?: string;
  floor: string;
  type: string;
  surface?: number;
  cleaningCoefficient?: number;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  locationId: string;
  assignedAgentId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedDuration?: number;
  scheduledDate?: string;
  scheduledTime?: string;
  isRecurring?: boolean;
  templateId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedAgentId?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  scheduledDate?: string;
  scheduledTime?: string;
  startTime?: string;
  endTime?: string;
  isRecurring?: boolean;
  templateId?: string;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  totalAgents: number;
  agentStats: AgentStats[];
}

export interface AgentStats {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  completionRate: number;
  totalHours: number;
}

export interface CreateCleaningTemplateRequest {
  name: string;
  description?: string;
  agentId: string;
  timeSlots: string; // JSON string
}

export interface UpdateCleaningTemplateRequest {
  name?: string;
  description?: string;
  timeSlots?: string;
  isActive?: boolean;
}

export interface TimeSlot {
  startTime: string; // "07:00"
  endTime: string; // "09:00"
  period: 'morning' | 'midday' | 'afternoon';
  locations: {
    locationId: string;
    estimatedDuration: number;
  }[];
}

export interface AgentDayView {
  date: string;
  tasks: any[]; // Task objects
  totalEstimatedTime: number;
  totalActualTime?: number;
}

// Planning Generator Types
export interface PlanningConfig {
  agentId: string;
  workStart: string; // "07:00"
  workEnd: string;   // "15:30"
  breakStart?: string; // "11:00"
  breakEnd?: string;   // "12:00"
  locations: LocationConfig[];
  templateId?: string;
}

export interface LocationConfig {
  locationId: string;
  priority: number; // 1=premier, 2=deuxième, etc.
  timeSlot: 'morning' | 'beforeBreak' | 'afterBreak' | 'afternoon' | 'flexible';
  estimatedDuration?: number; // override auto-calculation
  constraints?: string[]; // e.g., ["before_9h", "after_13h30"]
}

// Weekly schedule for a specific day
export interface DaySchedule {
  workStart: string;
  workEnd: string;
  breakStart?: string;
  breakEnd?: string;
  locations: LocationConfig[];
  isActive?: boolean; // Day can be enabled/disabled
}

// Weekly schedule object (Monday to Sunday)
export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface CreatePlanningTemplateRequest {
  name: string;
  description?: string;
  
  // New weekly schedule (preferred)
  weeklySchedule?: WeeklySchedule;
  
  // Legacy fields for backward compatibility
  workStart?: string;
  workEnd?: string;
  breakStart?: string;
  breakEnd?: string;
  locations?: LocationConfig[];
  
  isDefault?: boolean;
}

export interface UpdatePlanningTemplateRequest {
  name?: string;
  description?: string;
  
  // New weekly schedule (preferred)
  weeklySchedule?: WeeklySchedule;
  
  // Legacy fields for backward compatibility
  workStart?: string;
  workEnd?: string;
  breakStart?: string;
  breakEnd?: string;
  locations?: LocationConfig[];
  
  isDefault?: boolean;
  isActive?: boolean;
}

export interface GeneratePlanningRequest {
  agentId: string;
  templateId?: string;
  config?: PlanningConfig;
  scheduledDate?: string; // ISO date string
  replaceExisting?: boolean;
}

export interface PlanningPreview {
  totalDuration: number;
  tasks: TaskPreview[];
  conflicts: string[];
  warnings: string[];
}

export interface TaskPreview {
  locationName: string;
  startTime: string;
  endTime: string;
  duration: number;
  priority: number;
  timeSlot: string;
}

export interface PlanningTemplateWithConfig {
  id: string;
  name: string;
  description?: string;
  
  // New weekly schedule
  weeklySchedule?: WeeklySchedule;
  
  // Legacy fields for backward compatibility
  workStart?: string;
  workEnd?: string;
  breakStart?: string;
  breakEnd?: string;
  locations?: LocationConfig[];
  
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
  };
}