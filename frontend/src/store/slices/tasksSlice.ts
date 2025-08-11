import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../../types';
import { tasksAPI } from '../../services/api';
import { showNotification } from './notificationSlice';

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  tasks: [],
  isLoading: false,
  error: null,
};

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (params?: { 
    status?: string; 
    assignedAgentId?: string; 
    locationId?: string;
    startDate?: string;
    endDate?: string;
  }, { rejectWithValue }) => {
    try {
      return await tasksAPI.getTasks(params);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch tasks';
      return rejectWithValue(message);
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: CreateTaskRequest, { rejectWithValue, dispatch }) => {
    try {
      const result = await tasksAPI.createTask(taskData);
      dispatch(showNotification({
        message: 'Tâche créée avec succès !',
        type: 'success'
      }));
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create task';
      dispatch(showNotification({
        message: 'Erreur lors de la création de la tâche',
        type: 'error'
      }));
      return rejectWithValue(message);
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, updates }: { id: string; updates: UpdateTaskRequest }, { rejectWithValue, dispatch }) => {
    try {
      const result = await tasksAPI.updateTask(id, updates);
      dispatch(showNotification({
        message: 'Tâche mise à jour avec succès !',
        type: 'success'
      }));
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update task';
      dispatch(showNotification({
        message: 'Erreur lors de la mise à jour de la tâche',
        type: 'error'
      }));
      return rejectWithValue(message);
    }
  }
);

export const startTask = createAsyncThunk(
  'tasks/startTask',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      const result = await tasksAPI.startTask(id);
      dispatch(showNotification({
        message: 'Tâche démarrée !',
        type: 'success'
      }));
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to start task';
      dispatch(showNotification({
        message: 'Erreur lors du démarrage de la tâche',
        type: 'error'
      }));
      return rejectWithValue(message);
    }
  }
);

export const completeTask = createAsyncThunk(
  'tasks/completeTask',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      const result = await tasksAPI.completeTask(id);
      dispatch(showNotification({
        message: 'Tâche terminée !',
        type: 'success'
      }));
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to complete task';
      dispatch(showNotification({
        message: 'Erreur lors de la finalisation de la tâche',
        type: 'error'
      }));
      return rejectWithValue(message);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      await tasksAPI.deleteTask(id);
      dispatch(showNotification({
        message: 'Tâche supprimée avec succès !',
        type: 'success'
      }));
      return id;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete task';
      dispatch(showNotification({
        message: 'Erreur lors de la suppression de la tâche',
        type: 'error'
      }));
      return rejectWithValue(message);
    }
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create task
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Start task
      .addCase(startTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(startTask.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Complete task
      .addCase(completeTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(completeTask.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = tasksSlice.actions;
export default tasksSlice.reducer;