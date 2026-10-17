import type { ReactNode } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { AdminChatbot } from '@/components/AdminChatbot';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-layout">
      <AdminNav />
      <div className="admin-content">{children}</div>
      <AdminChatbot />
    </div>
  );
}
