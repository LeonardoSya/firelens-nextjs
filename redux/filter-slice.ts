import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface FilterState {
  confidence: string | null
  minBrightTi4: number | null
  maxBrightTi4: number | null
  minBrightTi5: number | null
  maxBrightTi5: number | null
  minFrp: number | null
  maxFrp: number | null
  startDate: string | null
  endDate: string | null
  daynight: string | null
}

const initialState: FilterState = {
  confidence: null,
  minBrightTi4: null,
  maxBrightTi4: null,
  minBrightTi5: null,
  maxBrightTi5: null,
  minFrp: null,
  maxFrp: null,
  startDate: null,
  endDate: null,
  daynight: null,
}

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setFilterParams: (state, action: PayloadAction<Partial<FilterState>>) => {
      return { ...state, ...action.payload }
    },
  },
})

export const { setFilterParams } = filterSlice.actions
export default filterSlice.reducer
