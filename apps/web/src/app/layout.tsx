import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import DemoOverlay from '../components/DemoOverlay';
import { ChatProvider } from '../context/ChatContext';
import CommanderAIWidget from '../components/CommanderAIWidget';
import DashboardButton from '../components/DashboardButton';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const viewport: Viewport = {
  themeColor: '#0b0f19',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'FIFA AI Companion',
  description: 'Your intelligent operating system for matchday, booking, travel, and statistics.',
  keywords: 'FIFA, AI, World Cup 2026, Travel, Tickets, Analytics',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="antialiased min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary-foreground">
        <ChatProvider>
          {children}
          <DashboardButton />
          <DemoOverlay />
          <CommanderAIWidget />
        </ChatProvider>
      </body>
    </html>
  );
}
