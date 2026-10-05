import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { ChatProvider } from '@/providers/chat-provider';
import { GlobalSearch } from '@/components/features/GlobalSearch';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'ProjectVault - Project & Environment Management Platform',
  description: 'Centralized and secure management of software projects, multi-account platforms, credentials, and environment variables.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <ThemeProvider>
          <AuthProvider>
            <ChatProvider>
              {children}
              <GlobalSearch />
              <Toaster position="bottom-right" theme="system" richColors closeButton />
            </ChatProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
