import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  rewards: {}, // Map of user IDs to their reward balances
  transactions: [], // History of reward transactions
  loading: false,
  error: null
};

const rewardsSlice = createSlice({
  name: 'rewards',
  initialState,
  reducers: {
    setRewardBalance: (state, action) => {
      const { userId, balance } = action.payload;
      state.rewards[userId] = balance;
    },
    addTransaction: (state, action) => {
      state.transactions.push(action.payload);
      // Update balance
      const { userId, amount, type } = action.payload;
      if (!state.rewards[userId]) state.rewards[userId] = 0;
      state.rewards[userId] += type === 'credit' ? amount : -amount;
    },
    setTransactions: (state, action) => {
      state.transactions = action.payload;
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
  setRewardBalance,
  addTransaction,
  setTransactions,
  setLoading,
  setError
} = rewardsSlice.actions;

export default rewardsSlice.reducer;
