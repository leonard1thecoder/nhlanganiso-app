'use client';

import { useAuth } from '@/context/AuthContext';
import { MobileFooterNav } from '@/components/MobileFooterNav';
import { Footer } from './Footer';

/** The footer is a storefront element: hide it once a user or admin is signed in. */
export function FooterGate() {
  const { status } = useAuth();
  return (
    <>
      <MobileFooterNav />
      {status === 'authenticated' ? null : <Footer />}
    </>
  );
}
