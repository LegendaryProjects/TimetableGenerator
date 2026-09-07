import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DEPARTMENTS, YEARS, SECTIONS, PROFESSORS } from '../../data/mockAcademicData';
import { ShieldCheck, User, Lock, Mail, ArrowRight, GraduationCap, Briefcase, Building2, Award } from 'lucide-react';
import campusImage from '../../assets/nitk-campus.jpg';

export default function LoginPage() {
  const { login, signup, departmentHods } = useAuth();
  const isDark = true; // Exclusively dark theme for Login Page

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [activePortal, setActivePortal] = useState('HOD'); // 'HOD' | 'FACULTY' | 'STUDENT'

  // HoD State
  const [selectedHodId, setSelectedHodId] = useState(departmentHods[0]?.id || 'hod_it');

  // Faculty State (Strict Cascading Dropdowns: Department First -> Then Faculty Names)
  const [facultyDept, setFacultyDept] = useState('');
  const [selectedProfEmail, setSelectedProfEmail] = useState('');

  // Student / Direct State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');

  // Sign-Up State (Only Student and Professor can create accounts)
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('IT');
  const [year, setYear] = useState('3');
  const [section, setSection] = useState('A');
  const [signupRole, setSignupRole] = useState('STUDENT'); // 'FACULTY' | 'STUDENT'

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Faculty Department Change
  const handleFacultyDeptChange = (dept) => {
    setFacultyDept(dept);
    setSelectedProfEmail('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (activePortal === 'HOD') {
        await login({ hodId: selectedHodId, password, type: 'HOD' });
      } else if (activePortal === 'FACULTY') {
        if (!facultyDept) throw new Error('Please select your Department.');
        if (!selectedProfEmail) throw new Error('Please select the Faculty name.');
        await login({ email: selectedProfEmail, password, type: 'FACULTY' });
      } else {
        if (!email.trim()) throw new Error('Please enter your student institutional email.');
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
      if (signupRole === 'FACULTY') {
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

  const departmentalFaculty = facultyDept ? PROFESSORS.filter(p => p.department === facultyDept) : [];

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-200 overflow-hidden ${
      isDark ? 'bg-[#080b12] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* LEFT SIDE: NITK Campus Showcase Visual with Seamless Edge Transition */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between p-10 xl:p-12 overflow-hidden bg-slate-950 select-none">
        
        {/* Background Image with Cinematic Backdrop */}
        <div className="absolute inset-0 z-0">
          <img 
            src={campusImage} 
            alt="NITK Surathkal Campus Garden & Fountain" 
            className="w-full h-full object-cover object-center transform filter brightness-90"
          />
          {/* Top and Bottom Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/40" />
          <div className="absolute inset-0 bg-blue-950/20 mix-blend-multiply" />
          
          {/* Smooth Soft Gradient Transition from Image to Form (Right Edge) */}
          <div className={`absolute top-0 bottom-0 right-0 w-36 xl:w-48 pointer-events-none transition-colors duration-200 bg-gradient-to-r from-transparent via-${isDark ? '[#080b12]/60' : 'slate-50/60'} ${
            isDark ? 'to-[#080b12]' : 'to-slate-50'
          }`} />
        </div>

        {/* Top Header on Image */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5 bg-black/45 backdrop-blur-md px-6 py-3.5 rounded-2xl border border-white/15 shadow-xl">
            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-2xl sm:text-3xl tracking-tight leading-none">NITK AutoTTGen</h1>
              <p className="text-blue-300 text-xs sm:text-sm font-bold tracking-wider uppercase mt-1">Academic Timetable System</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-black/45 backdrop-blur-md px-6 py-2.5 rounded-full border border-amber-400/35 text-amber-300 text-xs sm:text-sm font-bold shadow-lg">
            <Award className="w-4.5 h-4.5 text-amber-400 shrink-0" />
            <span>NIRF Rank 17 (Engineering)</span>
          </div>
        </div>

        {/* Bottom Hero Institutional Text on Image */}
        <div className="relative z-10 space-y-3 max-w-2xl flex flex-col items-center text-center">
          <div className="flex flex-col items-center space-y-1.5">
            <div className="inline-flex items-center justify-center bg-blue-950/20 backdrop-blur-md border border-blue-400/20 text-blue-200 px-7 py-2.5 rounded-full text-lg sm:text-xl xl:text-2xl font-black tracking-wide shadow-lg">
              <span>National Institute of Technology Karnataka, Surathkal</span>
            </div>

            <p className="text-blue-300 text-xs sm:text-sm font-semibold italic tracking-wide text-center drop-shadow">
              (An Institute of National Importance)
            </p>
          </div>

          {/* Single Line Clean Portal Explanation centered */}
          <p className="text-xs sm:text-sm text-slate-200/90 font-normal leading-relaxed drop-shadow pt-0.5 max-w-lg text-center">
            Automated academic timetable formulation and schedule management portal.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form Container */}
      <div className="flex-1 flex flex-col justify-between items-center p-6 sm:p-10 relative min-h-screen">
        <div className="hidden lg:block h-2" />
        {/* Form Card */}
        <div className="w-full max-w-md space-y-5 my-auto">
          
          {/* Mobile-only Branding Header */}
          <div className="lg:hidden text-center space-y-1.5 mb-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg mb-1">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              NITK AutoTTGen
            </h1>
            <p className="text-sm font-bold text-blue-500 uppercase tracking-wide">
              National Institute of Technology Karnataka, Surathkal
            </p>
            <p className="text-xs text-amber-500 font-bold italic">
              (An Institute of National Importance)
            </p>
          </div>

          <div className={`rounded-3xl border shadow-xl overflow-hidden transition-colors ${
            isDark ? 'bg-[#0f1422] border-[#1e293b] shadow-black/40' : 'bg-white border-slate-200 shadow-slate-200/50'
          }`}>

            {/* Tab Bar: Sign In / Create Account */}
            <div className={`p-4 border-b ${
              isDark ? 'bg-[#0b0f17] border-[#1e293b]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex rounded-xl p-1 border ${
                isDark ? 'bg-[#151c2e] border-[#243048]' : 'bg-white border-slate-200'
              }`}>
                <button 
                  onClick={() => { setActiveTab('login'); setError(''); }}
                  className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                    activeTab === 'login' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setActiveTab('signup'); setError(''); }}
                  className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                    activeTab === 'signup' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0"></span>
                  <span>{error}</span>
                </div>
              )}

              {activeTab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  
                  {/* 3 Explicit Portal Roles */}
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

                  {/* Portal 2: Professor Login (Cascading Dropdowns) */}
                  {activePortal === 'FACULTY' && (
                    <div className="space-y-3">
                      <div>
                        <select 
                          value={facultyDept} 
                          onChange={e => handleFacultyDeptChange(e.target.value)}
                          className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold focus:outline-none focus:border-purple-500 ${
                            isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                          }`}
                        >
                          <option value="">Select Department</option>
                          {DEPARTMENTS.map(d => (
                            <option key={d.id} value={d.id}>Dept. of {d.name} ({d.code})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <select 
                          value={selectedProfEmail} 
                          disabled={!facultyDept}
                          onChange={e => setSelectedProfEmail(e.target.value)}
                          className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold focus:outline-none focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                          }`}
                        >
                          {!facultyDept ? (
                            <option value=""> Select a department above to unlock faculty list</option>
                          ) : (
                            <>
                              <option value="">-- Select Your Faculty Profile --</option>
                              {departmentalFaculty.map(p => (
                                <option key={p.email} value={p.email}>
                                  {p.name} ({p.designation})
                                </option>
                              ))}
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Portal 3: Student Login */}
                  {activePortal === 'STUDENT' && (
                    <div>
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
                  
                  {/* Account Creation: Only Student & Professor available */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button type="button" onClick={() => setSignupRole('STUDENT')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        signupRole === 'STUDENT' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}>
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Student</span>
                    </button>
                    <button type="button" onClick={() => setSignupRole('FACULTY')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        signupRole === 'FACULTY' ? 'border-purple-500 bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40 shadow-sm' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}>
                      <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                      <span>Professor</span>
                    </button>
                  </div>

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
                        }`}
                      >
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
                            }`}
                          >
                            {YEARS.map(y => <option key={y.id} value={y.value}>{y.label}</option>)}
                          </select>
                        </div>
                        <div className="w-20">
                          <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-cyan-400' : 'text-blue-800'}`}>Sec</label>
                          <select value={section} onChange={e => setSection(e.target.value)}
                            className={`w-full px-2.5 py-2 border rounded-xl text-sm font-bold focus:outline-none ${
                              isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                            }`}
                          >
                            {SECTIONS.slice(0, 3).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </>
                    )}
                  </div>

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

          <p className="text-center text-xs sm:text-sm font-semibold italic tracking-wide text-slate-400">
            "The Dream Destination of Engineers, NITK Surathkal"
          </p>
        </div>

        {/* Bottom Attribution - Completely at the end of page */}
        <div className="w-full pt-4 pb-1 text-center">
          <p className="text-xs font-medium tracking-wide text-slate-500">
            Made by Sankalp, Abhishek, Ravi
          </p>
        </div>
      </div>
    </div>
  );
}
