import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { DEPARTMENTS, YEARS, SECTIONS, PROFESSORS } from '../../data/mockAcademicData';
import { X, ShieldCheck, User, Lock, Mail, ArrowRight, GraduationCap, Briefcase } from 'lucide-react';

export default function AuthModal() {
  const {
    authModalOpen, setAuthModalOpen, authModalTab, setAuthModalTab,
    loginType, setLoginType, login, signup, departmentHods
  } = useAuth();
  const { isDark } = useTheme();

  // Login Portal Type: 'HOD' | 'FACULTY' | 'STUDENT'
  const [activePortal, setActivePortal] = useState('HOD');

  // HoD Login State
  const [selectedHodId, setSelectedHodId] = useState(departmentHods[0]?.id || 'hod_it');

  // Faculty Login State (Cascading Dropdowns: Department -> Faculty)
  const [facultyDept, setFacultyDept] = useState('IT');
  const [selectedProfEmail, setSelectedProfEmail] = useState(() => {
    const itProfs = PROFESSORS.filter(p => p.department === 'IT');
    return itProfs[0]?.email || 'geethav@nitk.edu.in';
  });

  // Student / Direct Login State
  const [email, setEmail] = useState('student.it@nitk.edu.in');
  const [password, setPassword] = useState('password123');

  // Sign-Up State
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('IT');
  const [year, setYear] = useState('3');
  const [section, setSection] = useState('A');
  const [signupRole, setSignupRole] = useState('STUDENT'); // 'HOD' | 'FACULTY' | 'STUDENT'

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  // Handle Faculty Department Change to update selected professor
  const handleFacultyDeptChange = (dept) => {
    setFacultyDept(dept);
    const profs = PROFESSORS.filter(p => p.department === dept);
    if (profs.length > 0) {
      setSelectedProfEmail(profs[0].email);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (activePortal === 'HOD') {
        await login({ hodId: selectedHodId, password, type: 'HOD' });
      } else if (activePortal === 'FACULTY') {
        if (!selectedProfEmail) throw new Error('Please select a faculty member.');
        await login({ email: selectedProfEmail, password, type: 'FACULTY' });
      } else {
        if (!email.trim()) throw new Error('Please enter your student email address.');
        await login({ email: email.trim(), password, type: 'STUDENT' });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (signupRole === 'HOD') {
        await signup({ hodId: selectedHodId, password, role: 'HOD' });
      } else if (signupRole === 'FACULTY') {
        if (!name.trim()) throw new Error('Please enter faculty name.');
        if (!email.trim()) throw new Error('Please enter faculty email.');
        await signup({
          name: name.trim(),
          department,
          year: 3,
          section: 'A',
          email: email.trim(),
          password,
          role: 'VIEWER',
          userType: 'Faculty'
        });
      } else {
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (!email.trim()) throw new Error('Please enter your email address.');
        await signup({
          name: name.trim(),
          department,
          year: Number(year),
          section: section || 'A',
          email: email.trim(),
          password,
          role: 'VIEWER',
          userType: 'Student'
        });
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className={`relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-colors ${
        isDark ? 'bg-[#0f1422] border-[#1e293b] shadow-black' : 'bg-white border-slate-200'
      }`}>

        {/* Header */}
        <div className={`p-6 pb-4 border-b ${
          isDark ? 'bg-[#0b0f17] border-[#1e293b]' : 'bg-slate-50 border-slate-200'
        }`}>
          <button onClick={() => setAuthModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-500 border border-blue-500/30 shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                NITK AutoTTGen
              </h2>
              <p className="text-xs text-blue-500 dark:text-blue-400 font-semibold">National Institute of Technology Karnataka</p>
            </div>
          </div>

          <div className={`flex rounded-xl p-1 mt-4 border ${
            isDark ? 'bg-[#151c2e] border-[#243048]' : 'bg-white border-slate-200'
          }`}>
            <button onClick={() => { setAuthModalTab('login'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                authModalTab === 'login' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}>
              Sign In
            </button>
            <button onClick={() => { setAuthModalTab('signup'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                authModalTab === 'signup' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}>
              Create Account
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {authModalTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* 3 Explicit Portal Roles: HoD, Professor, Student */}
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => { setActivePortal('HOD'); setError(''); }}
                  className={`p-2.5 rounded-xl border text-center text-xs flex flex-col items-center gap-1 transition-all ${
                    activePortal === 'HOD' 
                      ? 'border-blue-500 bg-blue-500/15 text-white ring-1 ring-blue-500/50 shadow-md font-bold' 
                      : isDark ? 'border-[#1e293b] text-slate-400 hover:border-[#2f3d58] bg-[#0b0f17]/70' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>HoD</span>
                </button>

                <button type="button" onClick={() => { setActivePortal('FACULTY'); setError(''); }}
                  className={`p-2.5 rounded-xl border text-center text-xs flex flex-col items-center gap-1 transition-all ${
                    activePortal === 'FACULTY' 
                      ? 'border-purple-500 bg-purple-500/15 text-white ring-1 ring-purple-500/50 shadow-md font-bold' 
                      : isDark ? 'border-[#1e293b] text-slate-400 hover:border-[#2f3d58] bg-[#0b0f17]/70' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  <Briefcase className="w-4 h-4 text-purple-400" />
                  <span>Professor</span>
                </button>

                <button type="button" onClick={() => { setActivePortal('STUDENT'); setError(''); }}
                  className={`p-2.5 rounded-xl border text-center text-xs flex flex-col items-center gap-1 transition-all ${
                    activePortal === 'STUDENT' 
                      ? 'border-emerald-500 bg-emerald-500/15 text-white ring-1 ring-emerald-500/50 shadow-md font-bold' 
                      : isDark ? 'border-[#1e293b] text-slate-400 hover:border-[#2f3d58] bg-[#0b0f17]/70' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Student</span>
                </button>
              </div>

              {/* Portal 1: HoD Login */}
              {activePortal === 'HOD' && (
                <div>
                  <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-cyan-400' : 'text-blue-800'}`}>
                    Select Department HoD
                  </label>
                  <select 
                    value={selectedHodId} 
                    onChange={e => setSelectedHodId(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    {departmentHods.map(h => (
                      <option key={h.id} value={h.id}>{h.name} — HoD, {h.department}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Portal 2: Professor Login (Cascading Dropdowns: Dept -> Faculty) */}
              {activePortal === 'FACULTY' && (
                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-purple-400' : 'text-purple-800'}`}>
                      Step 1: Department
                    </label>
                    <select 
                      value={facultyDept} 
                      onChange={e => handleFacultyDeptChange(e.target.value)}
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold focus:outline-none focus:border-purple-500 ${
                        isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d.id} value={d.id}>Dept. of {d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-purple-400' : 'text-purple-800'}`}>
                      Step 2: Faculty Member
                    </label>
                    <select 
                      value={selectedProfEmail} 
                      onChange={e => setSelectedProfEmail(e.target.value)}
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold focus:outline-none focus:border-purple-500 ${
                        isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    >
                      {PROFESSORS.filter(p => p.department === facultyDept).map(p => (
                        <option key={p.email} value={p.email}>
                          {p.name} ({p.designation})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Portal 3: Student Login */}
              {activePortal === 'STUDENT' && (
                <div>
                  <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                    Student Institutional Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)}
                      placeholder="student.it@nitk.edu.in"
                      className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 ${
                        isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-cyan-400' : 'text-blue-800'}`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                <span>{loading ? 'Verifying with Database...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setSignupRole('STUDENT')}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                    signupRole === 'STUDENT' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-slate-700 text-slate-400'
                  }`}>
                  Student
                </button>
                <button type="button" onClick={() => setSignupRole('FACULTY')}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                    signupRole === 'FACULTY' ? 'border-purple-500 bg-purple-500/20 text-purple-300' : 'border-slate-700 text-slate-400'
                  }`}>
                  Professor
                </button>
                <button type="button" onClick={() => setSignupRole('HOD')}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                    signupRole === 'HOD' ? 'border-blue-500 bg-blue-500/20 text-blue-300' : 'border-slate-700 text-slate-400'
                  }`}>
                  HoD
                </button>
              </div>

              {signupRole === 'HOD' ? (
                <div>
                  <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-cyan-400' : 'text-blue-800'}`}>
                    Select HoD
                  </label>
                  <select value={selectedHodId} onChange={e => setSelectedHodId(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}>
                    {departmentHods.map(h => <option key={h.id} value={h.id}>{h.name} — HoD, {h.department}</option>)}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-cyan-400' : 'text-blue-800'}`}>Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name"
                      className={`w-full px-3.5 py-2 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 ${
                        isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`} />
                  </div>
                  <div>
                    <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-cyan-400' : 'text-blue-800'}`}>Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@nitk.edu.in"
                      className={`w-full px-3.5 py-2 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 ${
                        isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`} />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1">
                      <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-cyan-400' : 'text-blue-800'}`}>Department</label>
                      <select value={department} onChange={e => setDepartment(e.target.value)}
                        className={`w-full px-2.5 py-2 border rounded-xl text-sm font-bold focus:outline-none ${
                          isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                        }`}>
                        {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    {signupRole === 'STUDENT' && (
                      <>
                        <div className="w-24">
                          <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-cyan-400' : 'text-blue-800'}`}>Year</label>
                          <select value={year} onChange={e => setYear(e.target.value)}
                            className={`w-full px-2.5 py-2 border rounded-xl text-sm font-bold focus:outline-none ${
                              isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                            }`}>
                            {YEARS.map(y => <option key={y.id} value={y.value}>{y.label}</option>)}
                          </select>
                        </div>
                        <div className="w-20">
                          <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-cyan-400' : 'text-blue-800'}`}>Sec</label>
                          <select value={section} onChange={e => setSection(e.target.value)}
                            className={`w-full px-2.5 py-2 border rounded-xl text-sm font-bold focus:outline-none ${
                              isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                            }`}>
                            {SECTIONS.slice(0, 3).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-cyan-400' : 'text-blue-800'}`}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className={`w-full px-3.5 py-2 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 ${
                    isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`} />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50 mt-2">
                <span>{loading ? 'Creating...' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
