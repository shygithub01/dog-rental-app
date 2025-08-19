import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '../../contexts/FirebaseContext';
import AdminDashboard from './AdminDashboard';

const AdminRoute: React.FC = () => {
  const { auth, db } = useFirebase();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      // Listen for auth state changes
      const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
        setUser(currentUser);
        
        if (!currentUser) {
          // Not logged in, redirect to home
          navigate('/');
          setLoading(false);
          return;
        }

        try {
          // Get user profile from Firestore
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUserProfile(userData);
            
            // Check if user is admin
            if (userData.role === 'admin' && userData.isAdmin === true) {
              setIsAdmin(true);
            } else {
              // Not admin, redirect to home
              navigate('/');
            }
          } else {
            // No user profile, redirect to home
            navigate('/');
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Error checking admin access:', error);
          navigate('/');
          setLoading(false);
        }
      });

      return () => unsubscribe();
    };

    checkAdminAccess();
  }, [auth, db, navigate]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        🔐 Verifying admin access...
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminDashboard onClose={() => navigate('/')} />
    </div>
  );
};

export default AdminRoute;
