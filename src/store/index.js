import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import choresReducer from './slices/choresSlice';
import rewardsReducer from './slices/rewardsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chores: choresReducer,
    rewards: rewardsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/setUser'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.createdAt', 'payload.updatedAt'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.user.createdAt', 'auth.user.updatedAt']
      }
    })
});

export default store;
