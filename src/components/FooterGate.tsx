'use client';

import { useAuth } from '@/context/AuthContext';
import { Footer } from './Footer';

/** The footer is a storefront element: hide it once a user or admin is signed in. */
export function FooterGate() {
  const { status } = useAuth();
  if (status === 'authenticated') return null;
  return <Footer />;
}
