import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { User, CreateUserRequest } from '../../types';
import { usersAPI } from '../../services/api';

interface UsersState {
  users: User[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  isLoading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await usersAPI.getUsers();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch users';
      return rejectWithValue(message);
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: CreateUserRequest, { rejectWithValue }) => {
    try {
      return await usersAPI.createUser(userData);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create user';
      return rejectWithValue(message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, data }: { id: string; data: Partial<CreateUserRequest> }, { rejectWithValue }) => {
    try {
      return await usersAPI.updateUser(id, data);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update user';
      return rejectWithValue(message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id: string, { rejectWithValue }) => {
    try {
      await usersAPI.deleteUser(id);
      return id;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete user';
      return rejectWithValue(message);
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create user
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Update user
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Delete user
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(user => user.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = usersSlice.actions;
export default usersSlice.reducer;