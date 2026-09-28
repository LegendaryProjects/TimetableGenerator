import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

// 3-Hour Session Timeout in milliseconds (SRS NF-005)
const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

export function AuthProvider({ children }) {
  const [departmentHods, setDepartmentHods] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('nitk_user');
    const token = localStorage.getItem('nitk_token');
    const loginTime = localStorage.getItem('nitk_login_time');

    if (saved && token && loginTime) {
      const elapsed = Date.now() - Number(loginTime);
      if (elapsed < THREE_HOURS_MS) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved user:', e);
        }
      } else {
        // Session expired (3 hours exceeded)
        localStorage.removeItem('nitk_user');
        localStorage.removeItem('nitk_token');
        localStorage.removeItem('nitk_login_time');
      }
    }
    return null; // Require login with verified database credentials
  });

  const [authModalOpen, setAuthModalOpen] = useState(!currentUser);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'signup'
  const [loginType, setLoginType] = useState('HOD'); // 'HOD' | 'GENERAL'

  // Fetch verified HoDs from backend database
  useEffect(() => {
    async function loadHods() {
      try {
        const res = await api.getHods();
        if (res && res.hods && res.hods.length > 0) {
          setDepartmentHods(res.hods);
        }
      } catch (err) {
        console.error('Failed to load HoD accounts from database:', err);
      }
    }
    loadHods();
  }, []);

  // Periodic 3-hour session expiry check
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const loginTime = localStorage.getItem('nitk_login_time');
      if (loginTime) {
        const elapsed = Date.now() - Number(loginTime);
        if (elapsed >= THREE_HOURS_MS) {
          logout();
          alert('Your session has expired after 3 hours. Please sign in again.');
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('nitk_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('nitk_user');
      localStorage.removeItem('nitk_token');
      localStorage.removeItem('nitk_login_time');
    }
  }, [currentUser]);

  /**
   * Role-based Login handler connecting strictly to Flask backend & SQL Database
   */
  const login = async ({ email, password, hodId, type = 'GENERAL' }) => {
    let loginEmail = email;
    let targetHodId = hodId;
    if (type === 'HOD') {
      const selectedHod = departmentHods.find(h => h.id === hodId || h.hodId === hodId || h.department === hodId) || departmentHods[0];
      if (selectedHod) {
        loginEmail = selectedHod.email;
        targetHodId = selectedHod.id;
      }
    }

    if (!loginEmail || !loginEmail.trim()) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || !password.trim()) {
      throw new Error('Please enter your password.');
    }

    // Direct database authentication via API
    const res = await api.login({ email: loginEmail.trim().toLowerCase(), password, hodId: targetHodId, type });
    if (!res || !res.user) {
      throw new Error('Authentication failed. User record not found.');
    }

    // Record login timestamp for 3-hour session timeout
    localStorage.setItem('nitk_login_time', String(Date.now()));

    setCurrentUser(res.user);
    setAuthModalOpen(false);
    return { success: true, user: res.user };
  };

  /**
   * User Signup handler connecting strictly to Flask backend & SQL Database
   */
  const signup = async ({ name, department, year, semester, section, email, password, role = 'VIEWER', userType = 'Student', hodId }) => {
    let signupEmail = email;
    let signupName = name;
    let signupDept = department || 'IT';

    if (role === 'HOD') {
      const selectedHod = departmentHods.find(h => h.id === hodId || h.hodId === hodId || h.department === hodId) || departmentHods[0];
      if (selectedHod) {
        signupEmail = selectedHod.email;
        signupName = selectedHod.name;
        signupDept = selectedHod.department;
      }
    }

    if (!signupEmail || !signupEmail.trim()) {
      throw new Error('Please enter your email address.');
    }
    if (!signupName || !signupName.trim()) {
      throw new Error('Please enter your full name.');
    }
    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    const semVal = semester ? Number(semester) : (year ? (Number(year) * 2 - 1) : 5);
    const yrVal = Math.ceil(semVal / 2);

    const res = await api.register({
      name: signupName.trim(),
      department: signupDept,
      year: yrVal,
      semester: semVal,
      section: section || 'A',
      email: signupEmail.trim().toLowerCase(),
      password,
      role: role === 'HOD' ? 'HoD' : 'VIEWER',
      userType: userType || 'Student'
    });

    if (!res || !res.user) {
      throw new Error('Registration failed.');
    }

    localStorage.setItem('nitk_login_time', String(Date.now()));

    setCurrentUser(res.user);
    setAuthModalOpen(false);
    return { success: true, user: res.user };
  };

  const logout = () => {
    api.logout();
    localStorage.removeItem('nitk_login_time');
    setCurrentUser(null);
    setAuthModalOpen(true);
  };

  const isHod = currentUser?.role === 'HoD' || currentUser?.role === 'HOD';

  return (
    <AuthContext.Provider value={{
      currentUser,
      isHod,
      authModalOpen,
      setAuthModalOpen,
      authModalTab,
      setAuthModalTab,
      loginType,
      setLoginType,
      login,
      signup,
      logout,
      departmentHods
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
