import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationPayload {
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationState {
  notifications: Array<{
    id: string;
    message: string;
    type: NotificationType;
    timestamp: number;
  }>;
}

const initialState: NotificationState = {
  notifications: [],
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    showNotification: (state, action: PayloadAction<NotificationPayload>) => {
      const { message, type, duration = 4000 } = action.payload;
      const id = Date.now().toString();
      
      // Ajouter la notification à l'état
      state.notifications.unshift({
        id,
        message,
        type,
        timestamp: Date.now(),
      });
      
      // Limiter l'historique à 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
      
      // Afficher le toast
      switch (type) {
        case 'success':
          toast.success(message, { duration });
          break;
        case 'error':
          toast.error(message, { duration });
          break;
        case 'warning':
          toast(message, { 
            icon: '⚠️',
            duration,
          });
          break;
        case 'info':
          toast(message, { 
            icon: 'ℹ️',
            duration,
          });
          break;
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
  },
});

export const { showNotification, clearNotifications, removeNotification } = notificationSlice.actions;
export default notificationSlice.reducer;