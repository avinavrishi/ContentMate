import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  isSidebarExpanded: boolean;
}

const initialState: UiState = {
  isSidebarExpanded: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state, action: PayloadAction<'open' | 'close' | undefined>) => {
      if (action.payload === 'open') {
        state.isSidebarExpanded = true;
      } else if (action.payload === 'close') {
        state.isSidebarExpanded = false;
      } else {
        state.isSidebarExpanded = !state.isSidebarExpanded;
      }
    },
    setSidebarExpanded: (state, action) => {
      state.isSidebarExpanded = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarExpanded } = uiSlice.actions;
export default uiSlice.reducer; 