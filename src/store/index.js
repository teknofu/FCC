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
        ignoredActions: ['auth/setUser'],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          'payload.createdAt',
          'payload.updatedAt',
          'payload.lastLoginAt',
          'payload.metadata',
          'payload.user',
          'payload.user.providerId',
          'payload.user.stsTokenManager',
          'payload.user.accessToken',
          'payload.user.auth',
          'payload.user.metadata',
          'payload.user.proactiveRefresh',
          'payload.user.reloadListener',
          'payload.user.reloadUserInfo',
          'payload.user.stsTokenManager',
          'payload.user.toJSON'
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'auth.user.createdAt',
          'auth.user.updatedAt',
          'auth.user.lastLoginAt',
          'auth.user.metadata',
          'auth.user.providerId',
          'auth.user.stsTokenManager',
          'auth.user.accessToken',
          'auth.user.auth',
          'auth.user.metadata',
          'auth.user.proactiveRefresh',
          'auth.user.reloadListener',
          'auth.user.reloadUserInfo',
          'auth.user.stsTokenManager',
          'auth.user.toJSON'
        ]
      }
    })
});

export default store;
