import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // The admin dashboard is bilingual (ES/EN); the public site is Spanish only.
  // Locale is cookie-based, so there is no global locale routing.
  typedRoutes: true,
};

export default withNextIntl(nextConfig);
