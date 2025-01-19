import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  chores: [],
  loading: false,
  error: null,
  filters: {
    status: 'all', // 'all', 'pending', 'completed'
    assignedTo: null,
    timeframe: 'all' // 'all', 'daily', 'weekly'
  }
};

const choresSlice = createSlice({
  name: 'chores',
  initialState,
  reducers: {
    setChores: (state, action) => {
      state.chores = action.payload;
      state.loading = false;
      state.error = null;
    },
    addChore: (state, action) => {
      state.chores.push(action.payload);
    },
    updateChore: (state, action) => {
      const index = state.chores.findIndex(chore => chore.id === action.payload.id);
      if (index !== -1) {
        state.chores[index] = { ...state.chores[index], ...action.payload };
      }
    },
    deleteChore: (state, action) => {
      state.chores = state.chores.filter(chore => chore.id !== action.payload);
    },
    setChoreFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const {
  setChores,
  addChore,
  updateChore,
  deleteChore,
  setChoreFilters,
  setLoading,
  setError
} = choresSlice.actions;

export default choresSlice.reducer;
