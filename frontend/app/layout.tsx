import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { LanguageProvider } from '@/lib/language-context';
import { ThemeProvider } from '@/lib/theme-context';
import { ChatBot } from '@/components/chatbot/ChatBot';

export const metadata: Metadata = {
  title: 'Med-Drishti — Clinical Intake System',
  description: 'AI-Powered Patient Clinical Intake Kiosk',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              {children}
              <ChatBot />
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
