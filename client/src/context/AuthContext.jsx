import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, getProfile } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ck_token');
    const savedUser = localStorage.getItem('ck_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await loginApi({ email, password });
    if (data.success) {
      localStorage.setItem('ck_token', data.data.token);
      localStorage.setItem('ck_user', JSON.stringify(data.data));
      setUser(data.data);
      return data.data;
    }
    throw new Error(data.message);
  };

  const logout = () => {
    localStorage.removeItem('ck_token');
    localStorage.removeItem('ck_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      admin: user, // Expose alias for compatibility
      login,
      logout,
      loading,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
