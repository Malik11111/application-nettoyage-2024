import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import usersSlice from './slices/usersSlice';
import locationsSlice from './slices/locationsSlice';
import tasksSlice from './slices/tasksSlice';
import dashboardSlice from './slices/dashboardSlice';
import themeSlice from './slices/themeSlice';
import notificationSlice from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    users: usersSlice,
    locations: locationsSlice,
    tasks: tasksSlice,
    dashboard: dashboardSlice,
    theme: themeSlice,
    notification: notificationSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;