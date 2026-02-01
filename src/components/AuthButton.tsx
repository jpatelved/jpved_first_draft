import { useState } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

function AuthButtonContent() {
  const { user, profile, signOut, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  if (loading) {
    return (
      <div className="px-4 py-2 text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  if (user) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm font-medium flex items-center gap-2"
        >
          <span>{user.email}</span>
          {profile?.role === 'admin' && (
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">Admin</span>
          )}
        </button>

        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded shadow-lg py-1 z-50">
            <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-800">
              {user.email}
            </div>
            <button
              onClick={() => {
                signOut();
                setShowUserMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-800 text-red-400"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded text-sm font-medium"
      >
        Sign In
      </button>

      <AuthModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

export default function AuthButton() {
  return (
    <AuthProvider>
      <AuthButtonContent />
    </AuthProvider>
  );
}
