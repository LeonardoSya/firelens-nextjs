import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { enMsg } from '@/locales/en'
import { zhMsg } from '@/locales/zh'
import { IntlProvider } from 'react-intl'

export type Locale = 'zh' | 'en'

interface I18nContextProps {
  locale: Locale;
  switchLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined)

const msgs = {
  en: enMsg,
  zh: zhMsg,
}

export const I18nProvider = (props: { children: ReactNode }) => {
  const { children } = props

  const [locale, setLocale] = useState<Locale>('zh')

  const switchLocale = (locale: Locale) => {
    setLocale(locale)
  }

  return (
    <I18nContext.Provider value={{ locale, switchLocale }}>
      <IntlProvider locale={locale} messages={msgs[locale]}>
        {children}
      </IntlProvider>
    </I18nContext.Provider>
  )
}

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within a I18nProvider')
  }
  return context
}
