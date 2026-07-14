import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FIFA AI Companion',
  description: 'Your intelligent operating system for matchday, booking, travel, and statistics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
