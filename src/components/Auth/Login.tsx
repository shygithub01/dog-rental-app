import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useFirebase } from '../../contexts/FirebaseContext';

const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { auth } = useFirebase();

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      console.log('Google login successful!');
    } catch (error: any) {
      setError(error.message);
      console.error('Google login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ 
        fontSize: '1.8rem', 
        color: '#2d3748', 
        marginBottom: '10px',
        fontWeight: 'bold'
      }}>
        Welcome to Dog Rental App
      </h2>
      <p style={{ 
        textAlign: 'center', 
        marginBottom: '30px', 
        color: '#4a5568',
        fontSize: '1.1rem',
        lineHeight: '1.6'
      }}>
        Sign in to start renting dogs or list your dogs for rent
      </p>
      
      {error && (
        <div style={{ 
          color: '#e53e3e', 
          marginBottom: '20px', 
          textAlign: 'center',
          padding: '15px',
          backgroundColor: '#fed7d7',
          borderRadius: '10px',
          border: '1px solid #feb2b2'
        }}>
          {error}
        </div>
      )}
      
      <button 
        onClick={handleGoogleLogin}
        disabled={loading}
        style={{ 
          width: '100%', 
          padding: '15px', 
          backgroundColor: loading ? '#cbd5e0' : '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          transition: 'all 0.2s',
          boxShadow: loading ? 'none' : '0 4px 12px rgba(66, 133, 244, 0.3)'
        }}
        onMouseOver={(e) => {
          if (!loading) e.currentTarget.style.backgroundColor = '#3367d6';
        }}
        onMouseOut={(e) => {
          if (!loading) e.currentTarget.style.backgroundColor = '#4285f4';
        }}
      >
        {loading ? (
          'Signing in...'
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </>
        )}
      </button>
      
      <p style={{ 
        textAlign: 'center', 
        marginTop: '25px', 
        fontSize: '0.9rem', 
        color: '#718096',
        lineHeight: '1.5'
      }}>
        By signing in, you agree to our terms of service and privacy policy
      </p>
    </div>
  );
};

export default Login; 