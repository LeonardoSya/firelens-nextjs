import { createSlice } from '@reduxjs/toolkit'

const initialState: { isOpen: boolean } = {
  isOpen: false,
}

export const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    toggle: state => {
      state.isOpen = !state.isOpen
    },
    open: state => {
      state.isOpen = true
    },
    close: state => {
      state.isOpen = false
    },
  },
})

export const { toggle, open, close } = menuSlice.actions
export default menuSlice.reducer
