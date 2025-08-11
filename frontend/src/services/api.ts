import axios from 'axios';
import { 
  AuthResponse, 
  LoginRequest, 
  User, 
  Organization,
  Location, 
  Task, 
  DashboardStats,
  CreateUserRequest,
  CreateLocationRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  CleaningTemplate,
  CreateCleaningTemplateRequest,
  UpdateCleaningTemplateRequest,
  AgentDayView,
  PlanningTemplate,
  CreatePlanningTemplateRequest,
  UpdatePlanningTemplateRequest,
  GeneratePlanningRequest,
  PlanningPreview,
  GeneratePlanningResponse,
  DuplicatePlanningRequest
} from '../types';

const BASE_URL = 'http://localhost:3002/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    api.post('/auth/login', data).then(res => res.data),
  
  getCurrentUser: (): Promise<User> =>
    api.get('/auth/me').then(res => res.data),
  
  refreshToken: (): Promise<{ token: string }> =>
    api.post('/auth/refresh').then(res => res.data),
};

// Users API
export const usersAPI = {
  getUsers: (): Promise<User[]> =>
    api.get('/users').then(res => res.data),
  
  getUser: (id: string): Promise<User> =>
    api.get(`/users/${id}`).then(res => res.data),
  
  createUser: (data: CreateUserRequest): Promise<User> =>
    api.post('/users', data).then(res => res.data),
  
  updateUser: (id: string, data: Partial<CreateUserRequest>): Promise<User> =>
    api.put(`/users/${id}`, data).then(res => res.data),
  
  deleteUser: (id: string): Promise<void> =>
    api.delete(`/users/${id}`).then(res => res.data),
};

// Locations API
export const locationsAPI = {
  getLocations: (): Promise<Location[]> =>
    api.get('/locations').then(res => res.data),
  
  getLocation: (id: string): Promise<Location> =>
    api.get(`/locations/${id}`).then(res => res.data),
  
  createLocation: (data: CreateLocationRequest): Promise<Location> =>
    api.post('/locations', data).then(res => res.data),
  
  updateLocation: (id: string, data: Partial<CreateLocationRequest>): Promise<Location> =>
    api.put(`/locations/${id}`, data).then(res => res.data),
  
  deleteLocation: (id: string): Promise<void> =>
    api.delete(`/locations/${id}`).then(res => res.data),
};

// Tasks API
export const tasksAPI = {
  getTasks: (params?: { 
    status?: string; 
    assignedAgentId?: string; 
    locationId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Task[]> =>
    api.get('/tasks', { params }).then(res => res.data),
  
  getTask: (id: string): Promise<Task> =>
    api.get(`/tasks/${id}`).then(res => res.data),
  
  createTask: (data: CreateTaskRequest): Promise<Task> =>
    api.post('/tasks', data).then(res => res.data),
  
  updateTask: (id: string, data: UpdateTaskRequest): Promise<Task> =>
    api.put(`/tasks/${id}`, data).then(res => res.data),
  
  deleteTask: (id: string): Promise<void> =>
    api.delete(`/tasks/${id}`).then(res => res.data),

  startTask: (id: string): Promise<Task> =>
    api.post(`/tasks/${id}/start`).then(res => res.data),

  completeTask: (id: string): Promise<Task> =>
    api.post(`/tasks/${id}/complete`).then(res => res.data),

  getAgentDayView: (agentId: string, date: string): Promise<AgentDayView> =>
    api.get(`/tasks/agent/${agentId}/day/${date}`).then(res => res.data),
};

// Dashboard API
export const dashboardAPI = {
  getStats: (): Promise<DashboardStats> =>
    api.get('/dashboard/stats').then(res => res.data),
  
  getAgentStats: (id: string): Promise<any> =>
    api.get(`/dashboard/agent/${id}`).then(res => res.data),
};

// Cleaning Templates API
export const templatesAPI = {
  getTemplates: (params?: { agentId?: string }): Promise<CleaningTemplate[]> =>
    api.get('/templates', { params }).then(res => res.data),
  
  getTemplate: (id: string): Promise<CleaningTemplate> =>
    api.get(`/templates/${id}`).then(res => res.data),
  
  createTemplate: (data: CreateCleaningTemplateRequest): Promise<CleaningTemplate> =>
    api.post('/templates', data).then(res => res.data),
  
  updateTemplate: (id: string, data: UpdateCleaningTemplateRequest): Promise<CleaningTemplate> =>
    api.put(`/templates/${id}`, data).then(res => res.data),
  
  deleteTemplate: (id: string): Promise<void> =>
    api.delete(`/templates/${id}`).then(res => res.data),

  generateTasksFromTemplate: (templateId: string, date: string): Promise<Task[]> =>
    api.post(`/templates/${templateId}/generate`, { date }).then(res => res.data),
};

// Planning Generator API
export const planningAPI = {
  // Planning Templates
  getPlanningTemplates: (): Promise<PlanningTemplate[]> =>
    api.get('/planning/templates').then(res => res.data),
  
  getPlanningTemplate: (id: string): Promise<PlanningTemplate> =>
    api.get(`/planning/templates/${id}`).then(res => res.data),
  
  createPlanningTemplate: (data: CreatePlanningTemplateRequest): Promise<PlanningTemplate> =>
    api.post('/planning/templates', data).then(res => res.data),
  
  updatePlanningTemplate: (id: string, data: UpdatePlanningTemplateRequest): Promise<PlanningTemplate> =>
    api.put(`/planning/templates/${id}`, data).then(res => res.data),
  
  deletePlanningTemplate: (id: string): Promise<void> =>
    api.delete(`/planning/templates/${id}`).then(res => res.data),

  // Planning Generation
  previewPlanning: (data: GeneratePlanningRequest): Promise<PlanningPreview> =>
    api.post('/planning/preview', data).then(res => res.data),
  
  generatePlanning: (data: GeneratePlanningRequest): Promise<GeneratePlanningResponse> =>
    api.post('/planning/generate', data).then(res => res.data),
  
  duplicatePlanning: (data: DuplicatePlanningRequest): Promise<{ message: string; tasksCreated: number; tasks: Task[] }> =>
    api.post('/planning/duplicate', data).then(res => res.data),
  
  deleteAgentPlanning: (agentId: string, date?: string): Promise<{ message: string; tasksDeleted: number }> =>
    api.delete(`/planning/agent/${agentId}`, { params: { date } }).then(res => res.data),
};

// Organizations API (SUPER_ADMIN only)
export const organizationsAPI = {
  getOrganizations: (): Promise<Organization[]> =>
    api.get('/organizations').then(res => res.data),
  
  getOrganization: (id: string): Promise<Organization> =>
    api.get(`/organizations/${id}`).then(res => res.data),
  
  createOrganization: (data: any): Promise<Organization> =>
    api.post('/organizations', data).then(res => res.data),
  
  updateOrganization: (id: string, data: any): Promise<Organization> =>
    api.put(`/organizations/${id}`, data).then(res => res.data),
  
  deleteOrganization: (id: string): Promise<void> =>
    api.delete(`/organizations/${id}`).then(res => res.data),
};