'use client'

import { Provider } from 'react-redux'
import { makeStore } from './store'
import { I18nProvider } from '@/locales/i18n'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={makeStore()}>
      <I18nProvider>{children}</I18nProvider>
    </Provider>
  )
}
