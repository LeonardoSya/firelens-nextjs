import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'zh',
})

export const { Link, usePathname, redirect, useRouter } = createNavigation(routing)
