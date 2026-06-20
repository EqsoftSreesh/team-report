import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import { ToastProvider } from '@/context/ToastContext';
import DBInitializer from '@/components/layout/DBInitializer';

export const metadata = {
  title: 'Team Standup Tracker',
  description: 'Daily team standup tracker — manage reports, track issues, search entries, and export data.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <DBInitializer />
          <div className="app-shell">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
