import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Location, CreateLocationRequest } from '../../types';
import { locationsAPI } from '../../services/api';

interface LocationsState {
  locations: Location[];
  isLoading: boolean;
  error: string | null;
}

const initialState: LocationsState = {
  locations: [],
  isLoading: false,
  error: null,
};

export const fetchLocations = createAsyncThunk(
  'locations/fetchLocations',
  async (_, { rejectWithValue }) => {
    try {
      return await locationsAPI.getLocations();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch locations';
      return rejectWithValue(message);
    }
  }
);

export const createLocation = createAsyncThunk(
  'locations/createLocation',
  async (locationData: CreateLocationRequest, { rejectWithValue }) => {
    try {
      return await locationsAPI.createLocation(locationData);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create location';
      return rejectWithValue(message);
    }
  }
);

export const updateLocation = createAsyncThunk(
  'locations/updateLocation',
  async ({ id, data }: { id: string; data: Partial<CreateLocationRequest> }, { rejectWithValue }) => {
    try {
      return await locationsAPI.updateLocation(id, data);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update location';
      return rejectWithValue(message);
    }
  }
);

export const deleteLocation = createAsyncThunk(
  'locations/deleteLocation',
  async (id: string, { rejectWithValue }) => {
    try {
      await locationsAPI.deleteLocation(id);
      return id;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete location';
      return rejectWithValue(message);
    }
  }
);

const locationsSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch locations
      .addCase(fetchLocations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.locations = action.payload;
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create location
      .addCase(createLocation.fulfilled, (state, action) => {
        state.locations.push(action.payload);
      })
      .addCase(createLocation.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Update location
      .addCase(updateLocation.fulfilled, (state, action) => {
        const index = state.locations.findIndex(location => location.id === action.payload.id);
        if (index !== -1) {
          state.locations[index] = action.payload;
        }
      })
      .addCase(updateLocation.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Delete location
      .addCase(deleteLocation.fulfilled, (state, action) => {
        state.locations = state.locations.filter(location => location.id !== action.payload);
      })
      .addCase(deleteLocation.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = locationsSlice.actions;
export default locationsSlice.reducer;