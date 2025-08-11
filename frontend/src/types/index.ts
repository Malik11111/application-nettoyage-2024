export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  subscriptionPlan?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'AGENT' | 'SUPER_ADMIN';
  organizationId?: string;
  createdAt: string;
  updatedAt?: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
    isActive?: boolean;
  };
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  floor: string;
  type: string;
  surface?: number; // Surface en m²
  cleaningCoefficient: number; // Coefficient de temps par m² (minutes)
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  estimatedDuration?: number;
  actualDuration?: number;
  scheduledDate?: string;
  scheduledTime?: string; // Heure programmée ("07:00")
  startTime?: string; // Heure de début réelle
  endTime?: string; // Heure de fin réelle
  isRecurring: boolean;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  location: Location;
  assignedAgent?: {
    id: string;
    name: string;
    email: string;
  };
  locationId: string;
  assignedAgentId?: string;
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
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

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'AGENT';
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
  priority: Priority;
  estimatedDuration?: number;
  scheduledDate?: string;
  scheduledTime?: string;
  isRecurring?: boolean;
  templateId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
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

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  organizationSlug?: string;
}

export interface CleaningTemplate {
  id: string;
  name: string;
  description?: string;
  agentId: string;
  timeSlots: string; // JSON string contenant les détails du planning
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  agent: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateCleaningTemplateRequest {
  name: string;
  description?: string;
  agentId: string;
  timeSlots: string;
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
  tasks: Task[];
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

export interface PlanningTemplate {
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

export interface GeneratePlanningResponse {
  message: string;
  tasksCreated: number;
  totalDuration: number;
  warnings: string[];
  tasks: Task[];
}

export interface DuplicatePlanningRequest {
  sourceAgentId: string;
  targetAgentId: string;
  date?: string;
}