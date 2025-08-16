import { NextIntlClientProvider, useMessages } from 'next-intl';
import type { ReactNode } from 'react';

interface IntlProviderSetupProps {
  locale: string;
  children: ReactNode;
  // Timezone can also be passed if needed, but messages are primary here
}

export function IntlProviderSetup({ locale, children }: IntlProviderSetupProps) {
  const messages = useMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
} 