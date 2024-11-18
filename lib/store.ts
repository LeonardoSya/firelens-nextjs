import { configureStore } from '@reduxjs/toolkit'
import menuSlice from '@/redux/menu-slice'
import filterSlice from '@/redux/filter-slice'

export const makeStore = () => {
  return configureStore({
    reducer: {
      menu: menuSlice,
      filter: filterSlice,
    },
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
