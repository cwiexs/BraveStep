import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clean Test',
  description: 'Minimalus Next 14 API demo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}