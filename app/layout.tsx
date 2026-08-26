import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QueryPilot | AI Text-to-SQL with Clarification Engine',
  description: 'Production-ready AI-powered SQL generator featuring a 4-Stage Ambiguity Detection, Clarification Loop, and Syntax Safety Gate.',
  keywords: ['Text-to-SQL', 'AI Query Builder', 'Ollama', 'SQLite', 'Clarification Engine', 'Database Assistant'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-[#090d16] text-gray-100 antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
