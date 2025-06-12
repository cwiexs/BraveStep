import '../styles/global.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Sporto Planai',
  description: 'Automatiškai sugeneruoti treniruočių planai'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lt">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}