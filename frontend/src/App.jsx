import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Toast alert popup box */}
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1f2937',
              color: '#fff',
              fontSize: '13px',
              borderRadius: '12px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#fff',
              },
            },
          }} 
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
