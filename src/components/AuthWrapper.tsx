import { AuthProvider } from '../context/AuthContext';
import type { ReactNode } from 'react';

export default function AuthWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
