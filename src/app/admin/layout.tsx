import type { ReactNode } from 'react';
import { AdminNav } from '@/components/AdminNav';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container admin-layout">
      <AdminNav />
      <div className="admin-content">{children}</div>
    </div>
  );
}
