import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ShieldCheck, User, Lock, Mail, ArrowRight, GraduationCap, Briefcase, Building2, Award, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import campusImage from '../../assets/nitk-campus.jpg';
import PasswordStrengthIndicator, { checkPasswordStrength } from './PasswordStrengthIndicator';

const SEMESTERS = [
  { id: '1', label: 'Sem 1', value: 1 },
  { id: '2', label: 'Sem 2', value: 2 },
  { id: '3', label: 'Sem 3', value: 3 },
  { id: '4', label: 'Sem 4', value: 4 },
  { id: '5', label: 'Sem 5', value: 5 },
  { id: '6', label: 'Sem 6', value: 6 },
  { id: '7', label: 'Sem 7', value: 7 },
  { id: '8', label: 'Sem 8', value: 8 }
];

const SECTIONS = ['A', 'B', 'C', 'D'];

export default function LoginPage() {
  const { login, signup, departmentHods } = useAuth();
  const isDark = true; // Exclusively dark theme for Login Page

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [activePortal, setActivePortal] = useState('HOD'); // 'HOD' | 'FACULTY' | 'STUDENT'

  // Dynamic departments & faculty from backend
  const [departments, setDepartments] = useState([]);
  const [departmentalFaculty, setDepartmentalFaculty] = useState([]);

  // HoD State
  const [selectedHodId, setSelectedHodId] = useState(departmentHods[0]?.id || '');

  // Faculty Login State (Cascading Dropdowns: Department -> Faculty)
  const [facultyDept, setFacultyDept] = useState('');
  const [selectedProfEmail, setSelectedProfEmail] = useState('');

  // Student / Direct Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign-Up State
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('IT');
  const [semester, setSemester] = useState('5');
  const [section, setSection] = useState('A');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [signupRole, setSignupRole] = useState('STUDENT'); // 'FACULTY' | 'STUDENT'

  // Sign-Up Professor Selection
  const [signupFacultyList, setSignupFacultyList] = useState([]);
  const [signupSelectedProfId, setSignupSelectedProfId] = useState('');

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load all departments from backend
  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await api.getOptions();
        if (res?.departments && res.departments.length > 0) {
          setDepartments(res.departments);
          if (!facultyDept) {
            setFacultyDept(res.departments[0].id);
          }
          if (!department) {
            setDepartment(res.departments[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    }
    loadDepts();
  }, []);

  // Sync default HoD selection
  useEffect(() => {
    if (departmentHods && departmentHods.length > 0 && !selectedHodId) {
      setSelectedHodId(departmentHods[0].id);
    }
  }, [departmentHods, selectedHodId]);

  // Load professors dynamically when facultyDept changes for Login
  useEffect(() => {
    async function loadFaculty() {
      if (!facultyDept) return;
      try {
        const res = await api.getOptions(facultyDept);
        if (res?.professors) {
          setDepartmentalFaculty(res.professors);
          if (res.professors.length > 0) {
            setSelectedProfEmail(res.professors[0].email);
          } else {
            setSelectedProfEmail('');
          }
        }
      } catch (err) {
        console.error('Failed to load faculty for department:', err);
      }
    }
    loadFaculty();
  }, [facultyDept]);

  // Load professors dynamically when department changes for Sign-Up
  useEffect(() => {
    async function loadSignupFaculty() {
      if (!department) return;
      try {
        const res = await api.getOptions(department);
        if (res?.professors) {
          setSignupFacultyList(res.professors);
        }
      } catch (err) {
        console.error('Failed to load faculty for signup:', err);
      }
    }
    loadSignupFaculty();
  }, [department]);

  // Handle Faculty Department Change in Login
  const handleFacultyDeptChange = (dept) => {
    setFacultyDept(dept);
    setSelectedProfEmail('');
  };

  // Handle Department Change in Sign-Up
  const handleSignupDeptChange = (dept) => {
    setDepartment(dept);
    setSignupSelectedProfId('');
    setName('');
    setEmail('');
  };

  // Handle Professor Select in Sign-Up
  const handleSignupProfSelect = (e) => {
    const profId = e.target.value;
    setSignupSelectedProfId(profId);
    if (profId === 'NEW_PROF') {
      setName('');
      setEmail('');
    } else if (profId) {
      const prof = signupFacultyList.find(p => (p.id || p.email) === profId);
      if (prof) {
        setName(prof.name);
        setEmail(prof.email || '');
        // Map designation if available
        const d = prof.designation || '';
        if (d.includes('Associate')) setDesignation('Associate Professor');
        else if (d.includes('Assistant')) setDesignation('Assistant Professor');
        else if (d.includes('Temporary')) setDesignation('Temporary Faculty');
        else if (d.includes('Professor')) setDesignation('Professor');
      }
    } else {
      setName('');
      setEmail('');
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
      const pwCheck = checkPasswordStrength(password);
      if (!pwCheck.isValid) {
        throw new Error('Password must be at least 8 characters long and contain letters, numbers, and special characters.');
      }

      if (signupRole === 'FACULTY') {
        if (!name.trim()) throw new Error('Please select or enter professor name.');
        if (!email.trim()) throw new Error('Please provide professor institutional email.');
        await signup({
          name: name.trim(),
          department,
          designation,
          semester: 5,
          year: 3,
          section: 'A',
          email: email.trim(),
          password,
          role: 'VIEWER',
          userType: 'Faculty'
        });

        // Sync login dropdowns so newly registered professor immediately appears in login
        setFacultyDept(department);
        setSelectedProfEmail(email.trim());
      } else {
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (!email.trim()) throw new Error('Please enter your email address.');
        const semNum = Number(semester);
        await signup({
          name: name.trim(),
          department,
          semester: semNum,
          year: Math.ceil(semNum / 2),
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!forgotEmail.trim()) {
      setError('Please enter your institutional email address.');
      return;
    }
    if (!forgotNewPassword) {
      setError('Please enter a new password.');
      return;
    }
    const pwCheck = checkPasswordStrength(forgotNewPassword);
    if (!pwCheck.isValid) {
      setError('Password must be at least 8 characters long and contain letters, numbers, and special characters.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword({
        email: forgotEmail.trim(),
        newPassword: forgotNewPassword
      });
      setSuccessMsg(res.message || 'Password reset successfully! Redirecting to sign in...');
      setTimeout(() => {
        setEmail(forgotEmail.trim());
        setSelectedProfEmail(forgotEmail.trim());
        setActiveTab('login');
        setSuccessMsg('');
        setError('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check the email address.');
    } finally {
      setLoading(false);
    }
  };

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
          <div className={`absolute top-0 bottom-0 right-0 w-36 xl:w-48 pointer-events-none transition-colors duration-200 bg-gradient-to-r from-transparent via-[#080b12]/60 to-[#080b12]`} />
        </div>

        {/* Top Header on Image */}
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
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

          {/* Subtitle Attribution directly below Title */}
          <div className="flex flex-col gap-0.5 px-1 text-xs">
            <p className="text-slate-200/90 font-medium drop-shadow">
              Created as a part of Software Engineering Course Project
            </p>
            <p className="font-bold text-white drop-shadow">
              Created by Sankalp, Abhishek, Ravi
            </p>
            <p className="text-blue-300 font-medium text-[11px] drop-shadow">
              Under the guidance of Prof. Jaidhar C D
            </p>
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

      {/* RIGHT SIDE: Interactive Login & Sign Up Form */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-between px-6 pt-6 pb-2.5 sm:px-10 sm:pt-8 sm:pb-3 lg:px-12 lg:pt-8 lg:pb-3 overflow-y-auto">
        
        {/* Mobile Header Branding */}
        <div className="lg:hidden flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">NITK AutoTTGen</h1>
            <p className="text-xs text-blue-400 font-semibold">National Institute of Technology Karnataka</p>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {activeTab === 'login' ? 'Institutional Sign In' : activeTab === 'forgot' ? 'Reset Password' : 'Create New Account'}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-400">
              {activeTab === 'login'
                ? 'Select your academic role to access your schedule'
                : activeTab === 'forgot'
                ? 'Enter your institutional email and set your new password'
                : 'Register as a Student or Professor in NITK AutoTTGen'}
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
                  onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
                  className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                    activeTab === 'login' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setActiveTab('signup'); setError(''); setSuccessMsg(''); }}
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

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
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
                          ? 'border-blue-600 bg-blue-900/30 text-white ring-1 ring-blue-500/50 shadow-md font-bold' 
                          : isDark ? 'border-[#1e293b] text-slate-400 hover:border-[#2f3d58] bg-[#0b0f17]/70' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}>
                      <Briefcase className="w-4 h-4 text-blue-400" />
                      <span>Professor</span>
                    </button>

                    <button type="button" onClick={() => { setActivePortal('STUDENT'); setError(''); }}
                      className={`p-2.5 rounded-xl border text-center text-xs flex flex-col items-center gap-1 transition-all ${
                        activePortal === 'STUDENT' 
                          ? 'border-blue-600 bg-blue-900/30 text-white ring-1 ring-blue-500/50 shadow-md font-bold' 
                          : isDark ? 'border-[#1e293b] text-slate-400 hover:border-[#2f3d58] bg-[#0b0f17]/70' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}>
                      <User className="w-4 h-4 text-blue-400" />
                      <span>Student</span>
                    </button>
                  </div>

                  {/* Portal 1: HoD Login */}
                  {activePortal === 'HOD' && (
                    <div>
                      <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
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
                        <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                          Step 1: Department
                        </label>
                        <select 
                          value={facultyDept} 
                          onChange={e => handleFacultyDeptChange(e.target.value)}
                          className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 ${
                            isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                          }`}
                        >
                          <option value="">Select Department</option>
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>Dept. of {d.name} ({d.code})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                          Step 2: Faculty Member
                        </label>
                        <select 
                          value={selectedProfEmail} 
                          disabled={!facultyDept}
                          onChange={e => setSelectedProfEmail(e.target.value)}
                          className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                          }`}
                        >
                          {!facultyDept ? (
                            <option value="">Select a department above to unlock faculty list</option>
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

                  {/* Password with Forgot Password link */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={`block text-xs font-black uppercase tracking-wider ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                        Password
                      </label>
                      <button 
                        type="button" 
                        onClick={() => { 
                          setActiveTab('forgot'); 
                          setError(''); 
                          setSuccessMsg('');
                          setForgotEmail(activePortal === 'FACULTY' ? selectedProfEmail : (activePortal === 'STUDENT' ? email : ''));
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm placeholder-slate-500/40 focus:outline-none focus:border-blue-500 ${
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
              ) : activeTab === 'forgot' ? (
                /* Forgot Password View */
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-1">
                    <button 
                      type="button" 
                      onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h3 className="text-sm font-bold text-white">Reset Account Password</h3>
                      <p className="text-xs text-slate-400">Enter your institutional email and set your new password</p>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                      Institutional Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        value={forgotEmail} 
                        onChange={e => setForgotEmail(e.target.value)} 
                        placeholder="e.g. professor.dept@nitk.edu.in"
                        required
                        className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 ${
                          isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                        }`} 
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="password" 
                        value={forgotNewPassword} 
                        onChange={e => setForgotNewPassword(e.target.value)} 
                        placeholder="Min 8 chars, letters, numbers, symbols"
                        required
                        className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 ${
                          isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                        }`} 
                      />
                    </div>
                    <PasswordStrengthIndicator password={forgotNewPassword} isDark={isDark} />
                  </div>

                  <div>
                    <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="password" 
                        value={forgotConfirmPassword} 
                        onChange={e => setForgotConfirmPassword(e.target.value)} 
                        placeholder="Repeat new password"
                        required
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
                    <KeyRound className="w-4 h-4" />
                    <span>{loading ? 'Updating Password...' : 'Reset Password'}</span>
                  </button>

                  <div className="text-center pt-2">
                    <button 
                      type="button" 
                      onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Remember your credentials? <span className="text-blue-400 underline font-semibold">Back to Sign In</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Sign Up View */
                <form onSubmit={handleSignup} className="space-y-3.5">
                  
                  {/* Account Creation: Student & Professor */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button type="button" onClick={() => setSignupRole('STUDENT')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        signupRole === 'STUDENT' ? 'border-blue-600 bg-blue-900/30 text-blue-300 ring-1 ring-blue-500/40 shadow-sm' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}>
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>Student</span>
                    </button>
                    <button type="button" onClick={() => setSignupRole('FACULTY')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        signupRole === 'FACULTY' ? 'border-blue-600 bg-blue-900/30 text-blue-300 ring-1 ring-blue-500/40 shadow-sm' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}>
                      <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                      <span>Professor</span>
                    </button>
                  </div>

                  {signupRole === 'FACULTY' ? (
                    /* Professor Sign Up */
                    <div className="space-y-3">
                      <div>
                        <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                          Full Name
                        </label>
                        <input 
                          type="text" 
                          value={name} 
                          onChange={e => setName(e.target.value)} 
                          placeholder="e.g. Sankalp"
                          required
                          className={`w-full px-3.5 py-2 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 ${
                            isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                          }`} 
                        />
                      </div>

                      <div>
                        <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                          Institutional Email Address
                        </label>
                        <input 
                          type="email" 
                          value={email} 
                          onChange={e => setEmail(e.target.value)} 
                          placeholder="faculty.dept@nitk.edu.in"
                          required
                          className={`w-full px-3.5 py-2 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 ${
                            isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                          }`} 
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                            Department
                          </label>
                          <select 
                            value={department} 
                            onChange={e => setDepartment(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-xl text-sm font-bold focus:outline-none ${
                              isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                            }`}
                          >
                            {departments.map(d => (
                              <option key={d.id} value={d.id}>Dept. of {d.name} ({d.code})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                            Designation
                          </label>
                          <select 
                            value={designation} 
                            onChange={e => setDesignation(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-xl text-sm font-bold focus:outline-none ${
                              isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                            }`}
                          >
                            <option value="Professor">Professor</option>
                            <option value="Associate Professor">Associate Professor</option>
                            <option value="Assistant Professor">Assistant Professor</option>
                            <option value="Temporary Faculty">Temporary Faculty</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Student Sign Up */
                    <>
                      <div>
                        <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name"
                          className={`w-full px-3.5 py-2 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 ${
                            isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                          }`} />
                      </div>

                      <div>
                        <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="student.it@nitk.edu.in"
                          className={`w-full px-3.5 py-2 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 ${
                            isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                          }`} />
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="flex-1">
                          <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>Department</label>
                          <select value={department} onChange={e => setDepartment(e.target.value)}
                            className={`w-full px-2.5 py-2 border rounded-xl text-sm font-bold focus:outline-none ${
                              isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                            }`}
                          >
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>
                        <div className="w-24">
                          <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>Sem</label>
                          <select value={semester} onChange={e => setSemester(e.target.value)}
                            className={`w-full px-2.5 py-2 border rounded-xl text-sm font-bold focus:outline-none ${
                              isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                            }`}
                          >
                            {SEMESTERS.map(s => <option key={s.id} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                        <div className="w-20">
                          <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>Sec</label>
                          <select value={section} onChange={e => setSection(e.target.value)}
                            className={`w-full px-2.5 py-2 border rounded-xl text-sm font-bold focus:outline-none ${
                              isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                            }`}
                          >
                            {SECTIONS.slice(0, 3).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 chars, letters, numbers, symbols"
                      className={`w-full px-3.5 py-2 border rounded-xl text-sm placeholder-slate-500/40 focus:outline-none focus:border-blue-500 ${
                        isDark ? 'bg-[#151c2e] border-[#243048] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`} />
                    <PasswordStrengthIndicator password={password} isDark={isDark} />
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50 mt-2">
                    <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
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

        {/* Bottom Centered Copyright */}
        <div className="w-full mt-auto pt-6 pb-1 text-center">
          <p className="text-xs font-medium text-slate-500">
            © {new Date().getFullYear()} Sankalp, Abhishek, Ravi | All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
