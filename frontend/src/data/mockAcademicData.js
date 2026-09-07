/**
 * Mock Academic Data Store (D2: academic-data according to SRS)
 * Pre-populated with institutional constraints, subjects, professors, and rooms.
 */

export const DEPARTMENTS = [
  { id: 'IT', name: 'Information Technology', code: 'IT' },
  { id: 'CSE', name: 'Computer Science and Engineering', code: 'CSE' },
  { id: 'ECE', name: 'Electronics and Communication Engineering', code: 'ECE' },
  { id: 'AI', name: 'Artificial Intelligence & Data Science', code: 'AI' }
];

export const DEPARTMENT_HODS = [
  { 
    id: 'hod_it', 
    name: 'Dr. B. R. Mohan', 
    department: 'IT', 
    designation: 'Professor & HoD (Information Technology)',
    email: 'hod.it@nitk.edu.in' 
  },
  { 
    id: 'hod_cse', 
    name: 'Dr. Subhash Babu', 
    department: 'CSE', 
    designation: 'Professor & HoD (Computer Science & Engg)',
    email: 'hod.cse@nitk.edu.in' 
  },
  { 
    id: 'hod_ece', 
    name: 'Dr. Ramesh Kini', 
    department: 'ECE', 
    designation: 'Professor & HoD (Electronics & Comm Engg)',
    email: 'hod.ece@nitk.edu.in' 
  },
  { 
    id: 'hod_ai', 
    name: 'Dr. Annappa', 
    department: 'AI', 
    designation: 'Professor & HoD (AI & Data Science)',
    email: 'hod.ai@nitk.edu.in' 
  }
];

export const DEPARTMENT_CLASSROOMS = {
  IT: [
    { id: 'IT-CR101', name: 'CR 2.2 LHC-D, NITK Surathkal', code: 'CR 2.2', capacity: 70 },
    { id: 'IT-CR102', name: 'CR 2.3 LHC-D, NITK Surathkal', code: 'CR 2.3', capacity: 70 },
    { id: 'IT-CR201', name: 'CR 3.1 LHC-D, NITK Surathkal', code: 'CR 3.1', capacity: 100 },
    { id: 'IT-CR202', name: 'CR 3.2 LHC-D, NITK Surathkal', code: 'CR 3.2', capacity: 70 },
    { id: 'IT-CR301', name: 'CR 4.1 LHC-D, NITK Surathkal', code: 'CR 4.1', capacity: 60 },
    { id: 'IT-CR302', name: 'CR 4.2 LHC-D, NITK Surathkal', code: 'CR 4.2', capacity: 60 }
  ],
  CSE: [
    { id: 'CS-CR101', name: 'CR 1.1 LHC-C, NITK Surathkal', code: 'CR 1.1', capacity: 80 },
    { id: 'CS-CR102', name: 'CR 1.2 LHC-C, NITK Surathkal', code: 'CR 1.2', capacity: 80 },
    { id: 'CS-CR201', name: 'CR 2.1 LHC-C, NITK Surathkal', code: 'CR 2.1', capacity: 90 },
    { id: 'CS-CR202', name: 'CR 2.2 LHC-C, NITK Surathkal', code: 'CR 2.2', capacity: 70 }
  ],
  ECE: [
    { id: 'EC-CR101', name: 'CR 1.1 LHC-B, NITK Surathkal', code: 'CR 1.1', capacity: 75 },
    { id: 'EC-CR102', name: 'CR 1.2 LHC-B, NITK Surathkal', code: 'CR 1.2', capacity: 75 },
    { id: 'EC-CR201', name: 'CR 2.1 LHC-B, NITK Surathkal', code: 'CR 2.1', capacity: 100 }
  ],
  AI: [
    { id: 'AI-CR101', name: 'CR 1.1 LHC-A, NITK Surathkal', code: 'CR 1.1', capacity: 70 },
    { id: 'AI-CR102', name: 'CR 1.2 LHC-A, NITK Surathkal', code: 'CR 1.2', capacity: 70 },
    { id: 'AI-CR201', name: 'CR 2.1 LHC-A, NITK Surathkal', code: 'CR 2.1', capacity: 60 }
  ]
};

export const DEPARTMENT_LABS = {
  IT: [
    { id: 'IT-SL1', name: 'UG-Lab-3, 6th Floor IT Dept, NITK Surathkal', code: 'UG-Lab-3', capacity: 40 },
    { id: 'IT-SL2', name: 'UG-Lab-2, 6th Floor IT Dept, NITK Surathkal', code: 'UG-Lab-2', capacity: 40 },
    { id: 'IT-NWLAB', name: 'Project Lab, 5th Floor IT Dept, NITK Surathkal', code: 'Project-Lab', capacity: 40 },
    { id: 'IT-AILAB', name: 'AI & Cloud Lab, 5th Floor IT Dept, NITK Surathkal', code: 'AI-LAB', capacity: 40 }
  ],
  CSE: [
    { id: 'CS-LAB1', name: 'Computing Lab 1, CSE Dept, NITK Surathkal', code: 'CL-1', capacity: 45 },
    { id: 'CS-LAB2', name: 'Systems Lab 2, CSE Dept, NITK Surathkal', code: 'CL-2', capacity: 45 },
    { id: 'CS-AILAB', name: 'Deep Learning Lab, CSE Dept, NITK Surathkal', code: 'DL-LAB', capacity: 40 }
  ],
  ECE: [
    { id: 'EC-LAB1', name: 'Electronics Workshop, ECE Dept, NITK Surathkal', code: 'EW-LAB', capacity: 40 },
    { id: 'EC-LAB2', name: 'DSP & VLSI Lab, ECE Dept, NITK Surathkal', code: 'VLSI-LAB', capacity: 40 }
  ],
  AI: [
    { id: 'AI-LAB1', name: 'Vision & NLP Lab, AI Dept, NITK Surathkal', code: 'PV-LAB', capacity: 40 },
    { id: 'AI-LAB2', name: 'LLM & Big Data Lab, AI Dept, NITK Surathkal', code: 'BD-LAB', capacity: 40 }
  ]
};

export const YEARS = [
  { id: '1', label: '1st Year', value: 1 },
  { id: '2', label: '2nd Year', value: 2 },
  { id: '3', label: '3rd Year', value: 3 },
  { id: '4', label: '4th Year', value: 4 }
];

export const SECTIONS = ['A', 'B', 'C', 'D'];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/**
 * Institutional Timing Configuration (08:00 - 19:00 with 45-minute classes and Lunch 11:45 - 13:00)
 */
export const TIME_SLOTS = [
  { id: 1, time: '08:00 - 08:45', label: 'Period 1' },
  { id: 2, time: '09:00 - 09:45', label: 'Period 2' },
  { id: 3, time: '10:00 - 10:45', label: 'Period 3' },
  { id: 4, time: '11:00 - 11:45', label: 'Period 4' },
  { id: 'lunch', time: '11:45 - 13:00', label: 'Lunch Break', isBreak: true },
  { id: 5, time: '13:00 - 13:45', label: 'Period 5' },
  { id: 6, time: '14:00 - 14:45', label: 'Period 6' },
  { id: 7, time: '15:00 - 15:45', label: 'Period 7' },
  { id: 8, time: '16:00 - 16:45', label: 'Period 8' },
  { id: 9, time: '17:00 - 17:45', label: 'Period 9' },
  { id: 10, time: '18:00 - 18:45', label: 'Period 10' }
];

export const PROFESSORS = [
  // IT Faculty
  { id: 'prof_it_1', name: 'Dr. B. R. Mohan', department: 'IT', designation: 'Professor & HoD', email: 'brmohan@nitk.edu.in' },
  { id: 'prof_it_2', name: 'Dr. Geetha V.', department: 'IT', designation: 'Associate Professor', email: 'geethav@nitk.edu.in' },
  { id: 'prof_it_3', name: 'Dr. Jaidhar C. D.', department: 'IT', designation: 'Associate Professor', email: 'jaidharcd@nitk.edu.in' },
  { id: 'prof_it_4', name: 'Dr. Sowmya Kamath S.', department: 'IT', designation: 'Associate Professor', email: 'sowmyakamath@nitk.edu.in' },
  { id: 'prof_it_5', name: 'Dr. Dinesh Naik', department: 'IT', designation: 'Assistant Professor', email: 'dineshnaik@nitk.edu.in' },
  { id: 'prof_it_6', name: 'Dr. Anand Kumar M.', department: 'IT', designation: 'Assistant Professor', email: 'm_anandkumar@nitk.edu.in' },
  { id: 'prof_it_7', name: 'Dr. Bhawana Rudra', department: 'IT', designation: 'Assistant Professor', email: 'bhawanarudra@nitk.edu.in' },
  { id: 'prof_it_8', name: 'Dr. Suprabha K.', department: 'IT', designation: 'Assistant Professor', email: 'suprabhak@nitk.edu.in' },

  // CSE Faculty
  { id: 'prof_cse_1', name: 'Dr. Subhash Babu', department: 'CSE', designation: 'Professor & HoD', email: 'subhash@nitk.edu.in' },
  { id: 'prof_cse_2', name: 'Dr. Shashidhar G. Koolagudi', department: 'CSE', designation: 'Professor', email: 'koolagudi@nitk.edu.in' },
  { id: 'prof_cse_3', name: 'Dr. Alwyn R. Pais', department: 'CSE', designation: 'Professor', email: 'alwyn@nitk.edu.in' },
  { id: 'prof_cse_4', name: 'Dr. Basavaraj Talawar', department: 'CSE', designation: 'Associate Professor', email: 'basavaraj@nitk.edu.in' },

  // ECE Faculty
  { id: 'prof_ece_1', name: 'Dr. Ramesh Kini', department: 'ECE', designation: 'Professor & HoD', email: 'kini@nitk.edu.in' },
  { id: 'prof_ece_2', name: 'Dr. Sumam David S.', department: 'ECE', designation: 'Professor', email: 'sumam@nitk.edu.in' },
  { id: 'prof_ece_3', name: 'Dr. M. S. Bhat', department: 'ECE', designation: 'Professor', email: 'msbhat@nitk.edu.in' },

  // AI Faculty
  { id: 'prof_ai_1', name: 'Dr. Annappa', department: 'AI', designation: 'Professor & HoD', email: 'annappa@nitk.edu.in' },
  { id: 'prof_ai_2', name: 'Dr. Jeny Rajan', department: 'AI', designation: 'Associate Professor', email: 'jeny@nitk.edu.in' },
  { id: 'prof_ai_3', name: 'Dr. Mohit P. Tahiliani', department: 'AI', designation: 'Associate Professor', email: 'mohit@nitk.edu.in' }
];

export const SUBJECTS_BY_DEPT_YEAR = {
  IT: {
    1: [
      { id: 'IT101', code: 'IT101', name: 'Problem Solving & Programming in C', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_it_5' },
      { id: 'IT102', code: 'IT102', name: 'Digital Logic & Computer Design', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_it_6' },
      { id: 'MA101', code: 'MA101', name: 'Engineering Mathematics I', type: 'theory', defaultTheoryHrs: 4, defaultLabHrs: 0, defaultFaculty: 'prof_it_7' },
      { id: 'PH101', code: 'PH101', name: 'Engineering Physics', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_it_8' },
      { id: 'IT103', code: 'IT103L', name: 'Programming Lab in C', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_it_5' },
      { id: 'PH102', code: 'PH102L', name: 'Physics Laboratory', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_it_8' }
    ],
    2: [
      { id: 'IT201', code: 'IT201', name: 'Data Structures & Algorithms', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_it_1' },
      { id: 'IT202', code: 'IT202', name: 'Object Oriented Programming (Java)', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_it_2' },
      { id: 'IT203', code: 'IT203', name: 'Computer Organization & Architecture', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_it_3' },
      { id: 'IT204', code: 'IT204', name: 'Discrete Mathematical Structures', type: 'theory', defaultTheoryHrs: 4, defaultLabHrs: 0, defaultFaculty: 'prof_it_4' },
      { id: 'IT205', code: 'IT205L', name: 'DSA Lab', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_it_1' },
      { id: 'IT206', code: 'IT206L', name: 'Java Programming Lab', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_it_2' }
    ],
    3: [
      { id: 'IT300', code: 'IT300', name: 'Design and Analysis of Algorithms', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_it_1' },
      { id: 'IT301', code: 'IT301', name: 'Parallel Computing', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_it_4' },
      { id: 'IT302', code: 'IT302', name: 'Probability and Statistics', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_it_3' },
      { id: 'IT303', code: 'IT303', name: 'Software Engineering', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_it_2' },
      { id: 'SM300', code: 'SM300', name: 'Engineering Economics', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_it_5' },
      { id: 'IT300L', code: 'IT300L', name: 'Algorithms Lab', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_it_1' },
      { id: 'IT301L', code: 'IT301L', name: 'Parallel Computing Lab', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_it_4' },
      { id: 'IT302L', code: 'IT302L', name: 'Networks & Systems Lab', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_it_3' }
    ],
    4: [
      { id: 'IT401', code: 'IT401', name: 'Machine Learning & AI', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_it_6' },
      { id: 'IT402', code: 'IT402', name: 'Cloud Computing & DevOps', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_it_5' },
      { id: 'IT403', code: 'IT403', name: 'Information & Network Security', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_it_7' },
      { id: 'IT404', code: 'IT404', name: 'Major Project Phase I', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 4, defaultFaculty: 'prof_it_1' },
      { id: 'IT405', code: 'IT405L', name: 'AI & Security Lab', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_it_6' }
    ]
  },
  CSE: {
    1: [
      { id: 'CS101', code: 'CS101', name: 'Programming Fundamentals', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_cse_1' },
      { id: 'CS102', code: 'CS102', name: 'Digital Systems', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_cse_2' },
      { id: 'CS103L', code: 'CS103L', name: 'Programming Lab', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_cse_1' }
    ],
    2: [
      { id: 'CS201', code: 'CS201', name: 'Data Structures', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_cse_2' },
      { id: 'CS202', code: 'CS202', name: 'OOP with C++', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_cse_3' },
      { id: 'CS203L', code: 'CS203L', name: 'Data Structures Lab', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_cse_2' }
    ],
    3: [
      { id: 'CS301', code: 'CS301', name: 'Design & Analysis of Algorithms', type: 'theory', defaultTheoryHrs: 4, defaultLabHrs: 0, defaultFaculty: 'prof_cse_1' },
      { id: 'CS302', code: 'CS302', name: 'Compiler Design', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_cse_3' },
      { id: 'CS303', code: 'CS303', name: 'Computer Networks', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_cse_4' },
      { id: 'CS304L', code: 'CS304L', name: 'Compiler & Networks Lab', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_cse_3' }
    ],
    4: [
      { id: 'CS401', code: 'CS401', name: 'Distributed Systems', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_cse_4' },
      { id: 'CS402', code: 'CS402', name: 'Deep Learning', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_cse_2' },
      { id: 'CS403L', code: 'CS403L', name: 'Deep Learning Lab', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_cse_2' }
    ]
  },
  ECE: {
    1: [
      { id: 'EC101', code: 'EC101', name: 'Basic Electronic Circuits', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_ece_1' },
      { id: 'EC102L', code: 'EC102L', name: 'Electronics Workshop', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_ece_1' }
    ],
    2: [
      { id: 'EC201', code: 'EC201', name: 'Signals and Systems', type: 'theory', defaultTheoryHrs: 4, defaultLabHrs: 0, defaultFaculty: 'prof_ece_2' },
      { id: 'EC202', code: 'EC202', name: 'Analog Communication', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_ece_3' },
      { id: 'EC203L', code: 'EC203L', name: 'Signals Lab', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_ece_2' }
    ],
    3: [
      { id: 'EC301', code: 'EC301', name: 'Digital Signal Processing', type: 'theory', defaultTheoryHrs: 4, defaultLabHrs: 0, defaultFaculty: 'prof_ece_1' },
      { id: 'EC302', code: 'EC302', name: 'VLSI Design', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_ece_3' },
      { id: 'EC303L', code: 'EC303L', name: 'DSP & VLSI Lab', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_ece_3' }
    ],
    4: [
      { id: 'EC401', code: 'EC401', name: 'Wireless Communications', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_ece_2' },
      { id: 'EC402L', code: 'EC402L', name: 'Wireless Systems Lab', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_ece_2' }
    ]
  },
  AI: {
    1: [
      { id: 'AI101', code: 'AI101', name: 'Introduction to AI & Python', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_ai_1' },
      { id: 'AI102L', code: 'AI102L', name: 'Python for AI Lab', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_ai_1' }
    ],
    2: [
      { id: 'AI201', code: 'AI201', name: 'Data Structures for Data Science', type: 'theory', defaultTheoryHrs: 4, defaultLabHrs: 0, defaultFaculty: 'prof_ai_2' },
      { id: 'AI202L', code: 'AI202L', name: 'Data Science Lab', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_ai_2' }
    ],
    3: [
      { id: 'AI301', code: 'AI301', name: 'Machine Learning', type: 'theory', defaultTheoryHrs: 4, defaultLabHrs: 0, defaultFaculty: 'prof_ai_3' },
      { id: 'AI302L', code: 'AI302L', name: 'Machine Learning Lab', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_ai_3' }
    ],
    4: [
      { id: 'AI401', code: 'AI401', name: 'Deep Generative Models', type: 'theory', defaultTheoryHrs: 3, defaultLabHrs: 0, defaultFaculty: 'prof_ai_1' },
      { id: 'AI402L', code: 'AI402L', name: 'Generative AI Studio Lab', type: 'lab', defaultTheoryHrs: 0, defaultLabHrs: 2, defaultFaculty: 'prof_ai_1' }
    ]
  }
};

/**
 * Creates an empty global occupancy map tracking occupied faculty & rooms per slot:
 * occupancy[day][period] -> { facultyIds: Set(), roomIds: Set() }
 */
export function createGlobalOccupancyTracker() {
  const tracker = {};
  DAYS.forEach(day => {
    tracker[day] = {};
    TIME_SLOTS.forEach(slot => {
      if (slot.isBreak) return;
      tracker[day][slot.id] = {
        facultyIds: new Set(),
        roomIds: new Set()
      };
    });
  });
  return tracker;
}

/**
 * Generates a schedule grid with strict zero-overlap forward checking against the global occupancy tracker.
 * If zero-overlap is mathematically impossible under current resource constraints, records infeasibility.
 */
export function generateScheduleWithGlobalCSP({
  department = 'IT',
  year = 3,
  section = 'A',
  status = 'DRAFT',
  selectedSubjects = [],
  subjectSettings = {},
  selectedClassrooms = [],
  selectedLabs = [],
  labsPerSection = 2,
  allocatedClassroom = null,
  allocatedLabs = [],
  globalOccupancy = null
}) {
  const grid = {};
  
  DAYS.forEach(day => {
    grid[day] = {};
    TIME_SLOTS.forEach(slot => {
      if (slot.isBreak) return;
      grid[day][slot.id] = null;
    });
  });

  const assignedClassroom = allocatedClassroom || selectedClassrooms[0] || { id: `${department}-CR101`, name: `${department} Lecture Hall 101` };
  const assignedLab1 = allocatedLabs[0] || selectedLabs[0] || { id: `${department}-LAB1`, name: `${department} Lab 1` };
  const assignedLab2 = allocatedLabs[1] || selectedLabs[1] || assignedLab1;

  const allDeptSubjects = SUBJECTS_BY_DEPT_YEAR[department]?.[year] || SUBJECTS_BY_DEPT_YEAR['IT'][3];
  const activeSubjects = selectedSubjects.length > 0
    ? allDeptSubjects.filter(s => selectedSubjects.includes(s.id))
    : allDeptSubjects;

  const facultyPool = PROFESSORS.filter(p => p.department === department);

  const lecturePool = [];
  const labSessionPool = [];

  activeSubjects.forEach(s => {
    const config = subjectSettings[s.id] || {};
    const thHours = config.theoryHours !== undefined ? Number(config.theoryHours) : (s.defaultTheoryHrs || 3);
    const lbHours = config.labHours !== undefined ? Number(config.labHours) : (s.defaultLabHrs || (s.type === 'lab' ? 2 : 0));
    const faculty = facultyPool.find(p => p.id === (config.facultyId || s.defaultFaculty)) || facultyPool[0];

    // Theory sessions
    for (let i = 0; i < thHours; i++) {
      lecturePool.push({
        subjectId: s.id,
        subjectCode: s.code,
        subjectName: s.name,
        type: 'theory',
        facultyId: faculty.id,
        facultyName: faculty.name,
        roomId: assignedClassroom.id,
        roomName: assignedClassroom.name,
        isLab: false
      });
    }

    // Lab sessions (2 periods)
    if (lbHours > 0) {
      const sessions = Math.ceil(lbHours / 2);
      for (let i = 0; i < sessions; i++) {
        const labRoom = (i % 2 === 0 || labsPerSection < 2) ? assignedLab1 : assignedLab2;
        labSessionPool.push({
          subjectId: s.id,
          subjectCode: s.code,
          subjectName: s.name,
          type: 'lab',
          facultyId: faculty.id,
          facultyName: faculty.name,
          roomId: labRoom.id,
          roomName: labRoom.name,
          isLab: true
        });
      }
    }
  });

  const tracker = globalOccupancy || createGlobalOccupancyTracker();
  const unplacedSessions = [];
  const daySessionCount = { 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0 };

  // 1. Place 2-hour contiguous lab sessions without room or faculty conflicts
  // Prioritize afternoon 14:00-15:45 [6, 7] and morning 10:00-11:45 [3, 4] / 09:00-10:45 [2, 3]
  // Rule: Maximum 1 lab for a day per section!
  const labPeriodPairs = [[6, 7], [3, 4], [2, 3], [7, 8], [8, 9], [5, 6], [1, 2]];
  const daysWithLab = new Set();

  labSessionPool.forEach(labItem => {
    let placed = false;
    // Prioritize days with fewest sessions so far
    const sortedDaysForLab = [...DAYS].sort((a, b) => daySessionCount[a] - daySessionCount[b]);

    for (const day of sortedDaysForLab) {
      if (placed) break;
      // Constraint: Maximum 1 lab per day for this section
      if (daysWithLab.has(day)) continue;

      for (const [p1, p2] of labPeriodPairs) {
        if (grid[day][p1] === null && grid[day][p2] === null) {
          const t1 = tracker[day]?.[p1];
          const t2 = tracker[day]?.[p2];

          // STRICT CSP: Faculty and Lab Room must NOT be occupied in any other section
          const noFacultyClash = (!t1 || !t1.facultyIds.has(labItem.facultyId)) && (!t2 || !t2.facultyIds.has(labItem.facultyId));
          const noRoomClash = (!t1 || !t1.roomIds.has(labItem.roomId)) && (!t2 || !t2.roomIds.has(labItem.roomId));

          if (noFacultyClash && noRoomClash) {
            const labInstanceId = `lab_${day}_${p1}_${p2}_${Date.now()}_${Math.random()}`;
            grid[day][p1] = { 
              ...labItem, 
              id: `slot_${day}_${p1}_${labInstanceId}`,
              labInstanceId,
              isLabStart: true,
              labSpan: 2,
              spanSlots: [p1, p2]
            };
            grid[day][p2] = { 
              ...labItem, 
              id: `slot_${day}_${p2}_${labInstanceId}`,
              labInstanceId,
              isLabContinuation: true,
              spanSlots: [p1, p2]
            };

            if (t1) {
              t1.facultyIds.add(labItem.facultyId);
              t1.roomIds.add(labItem.roomId);
            }
            if (t2) {
              t2.facultyIds.add(labItem.facultyId);
              t2.roomIds.add(labItem.roomId);
            }
            daysWithLab.add(day);
            daySessionCount[day] += 2; // 2 periods
            placed = true;
            break;
          }
        }
      }
    }

    if (!placed) {
      unplacedSessions.push({
        ...labItem,
        reason: `No conflict-free 2-hour slot available for ${labItem.facultyName} in ${labItem.roomName}`
      });
    }
  });

  // 2. Place 1-hour theory lectures with STRICT forward checking
  // Preference: Classes mostly start at 9am (Period 2) and end by 4pm (Period 7/8).
  // Avoid Period 5 (13:00 - 13:45 post-lunch slot) as much as possible!
  // Mandatory Rule: Must have classes every day, no day empty, minimum of 2 classes assigned for every day!
  const preferredPeriods = [2, 3, 4, 6, 7, 8, 1, 5, 9, 10];

  lecturePool.forEach(thItem => {
    let placed = false;

    // Prioritize days that currently have < 2 classes first, then least loaded days!
    const prioritizedDays = [...DAYS].sort((a, b) => {
      const loadA = daySessionCount[a];
      const loadB = daySessionCount[b];
      if (loadA < 2 && loadB >= 2) return -1;
      if (loadB < 2 && loadA >= 2) return 1;
      return loadA - loadB;
    });

    for (const day of prioritizedDays) {
      if (placed) break;
      for (const p of preferredPeriods) {
        if (grid[day][p] === null) {
          const t = tracker[day]?.[p];
          // HARD CONSTRAINT: Professor must not be in any other class at this time slot
          const noFacultyClash = !t || !t.facultyIds.has(thItem.facultyId);
          // HARD CONSTRAINT: Classroom must not be used by any other section at this time slot
          const noRoomClash = !t || !t.roomIds.has(thItem.roomId);

          if (noFacultyClash && noRoomClash) {
            grid[day][p] = { ...thItem, id: `slot_${day}_${p}_${Date.now()}_${Math.random()}` };
            if (t) {
              t.facultyIds.add(thItem.facultyId);
              t.roomIds.add(thItem.roomId);
            }
            daySessionCount[day] += 1;
            placed = true;
            break;
          }
        }
      }
    }

    if (!placed) {
      unplacedSessions.push({
        ...thItem,
        reason: `No conflict-free period available across weekly slots for ${thItem.facultyName} in ${thItem.roomName}`
      });
    }
  });

  // Verify that every day has at least 2 assigned classes
  DAYS.forEach(day => {
    if (daySessionCount[day] < 2) {
      unplacedSessions.push({
        subjectCode: 'DAILY_DISTRIBUTION_CONSTRAINT',
        subjectName: `Under-allocated Day: ${day}`,
        facultyName: 'All Faculties',
        reason: `${day} has only ${daySessionCount[day]} session(s). Minimum 2 classes required per day.`
      });
    }
  });

  const isFeasible = unplacedSessions.length === 0;

  return {
    id: `tt_${department}_Y${year}_S${section}`,
    department,
    year: Number(year),
    section,
    academicYear: '2026-2027 (Odd Semester)',
    status,
    lastUpdated: new Date().toISOString(),
    assignedClassroom: assignedClassroom.name,
    assignedLabs: [assignedLab1.name, ...(labsPerSection > 1 ? [assignedLab2.name] : [])],
    isFeasible,
    unplacedSessions,
    grid
  };
}

// Generate Initial Default Zero-Conflict Schedules
function buildInitialTimetables() {
  const tracker = createGlobalOccupancyTracker();
  const list = [];
  
  // IT Year 3 Sec A (Approved)
  const it3A = generateScheduleWithGlobalCSP({
    department: 'IT',
    year: 3,
    section: 'A',
    status: 'APPROVED',
    selectedClassrooms: DEPARTMENT_CLASSROOMS['IT'],
    selectedLabs: DEPARTMENT_LABS['IT'],
    allocatedClassroom: DEPARTMENT_CLASSROOMS['IT'][0],
    allocatedLabs: [DEPARTMENT_LABS['IT'][0], DEPARTMENT_LABS['IT'][1]],
    globalOccupancy: tracker
  });
  if (it3A.isFeasible) list.push(it3A);

  // IT Year 3 Sec B (Approved)
  const it3B = generateScheduleWithGlobalCSP({
    department: 'IT',
    year: 3,
    section: 'B',
    status: 'APPROVED',
    selectedClassrooms: DEPARTMENT_CLASSROOMS['IT'],
    selectedLabs: DEPARTMENT_LABS['IT'],
    allocatedClassroom: DEPARTMENT_CLASSROOMS['IT'][1] || DEPARTMENT_CLASSROOMS['IT'][0],
    allocatedLabs: [DEPARTMENT_LABS['IT'][1] || DEPARTMENT_LABS['IT'][0], DEPARTMENT_LABS['IT'][0]],
    globalOccupancy: tracker
  });
  if (it3B.isFeasible) list.push(it3B);

  return list;
}

export const INITIAL_TIMETABLES = buildInitialTimetables();
