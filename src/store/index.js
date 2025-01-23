import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import choresReducer from './slices/choresSlice';
import rewardsReducer from './slices/rewardsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    chores: choresReducer,
    rewards: rewardsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these specific action types
        ignoredActions: [],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          'payload.createdAt',
          'payload.updatedAt',
          'payload.lastLoginAt',
          'payload.metadata'
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'auth.user.createdAt',
          'auth.user.updatedAt',
          'auth.user.lastLoginAt',
          'auth.user.metadata'
        ]
      }
    })
});

export default store;
