// Mock fixture data for UI development.
// To enable: set VITE_USE_MOCKS=true in .env (see .env.example) and restart `vite`.

import dayjs from 'dayjs';

const today = dayjs();
const fmt = (d) => d.format('YYYY-MM-DD');
const iso = (d) => d.toISOString();
const oid = () => Math.random().toString(36).slice(2, 10);

// ---------- offices ----------
export const offices = [
  {
    _id: 'off_nashik',
    name: 'Nashik HQ',
    address: 'Gangapur Road, Nashik 422013',
    lat: 19.989,
    lng: 73.77,
    radiusMeters: 1500,
    openTime: '09:00',
    closeTime: '19:00',
  },
  {
    _id: 'off_pune',
    name: 'Pune Branch',
    address: 'Baner Road, Pune 411045',
    lat: 18.5618,
    lng: 73.7768,
    radiusMeters: 1000,
    openTime: '09:30',
    closeTime: '18:30',
  },
];

// ---------- users ----------
const trainers = [
  { _id: 'u_t1', name: 'Anita Deshpande', email: 'anita.deshpande@demo.io', password: 'trainer123', role: 'teacher',
    technology: 'React', designation: 'Senior Trainer', department: 'Frontend', employeeId: 'EMP-101', phone: '9876500001', isActive: true },
  { _id: 'u_t2', name: 'Rohit Kulkarni', email: 'rohit.kulkarni@demo.io', password: 'trainer123', role: 'teacher',
    technology: 'Node.js', designation: 'Trainer', department: 'Backend', employeeId: 'EMP-102', phone: '9876500002', isActive: true },
  { _id: 'u_t3', name: 'Priya Shah', email: 'priya.shah@demo.io', password: 'trainer123', role: 'teacher',
    technology: 'Python', designation: 'Trainer', department: 'Data', employeeId: 'EMP-103', phone: '9876500003', isActive: true },
];

const studentNames = [
  'Aarav Mehta', 'Diya Patel', 'Kabir Sharma', 'Ishaan Verma',
  'Saanvi Singh', 'Arjun Rao', 'Myra Iyer', 'Vihaan Joshi',
  'Anaya Nair', 'Reyansh Gupta',
];
const studentTechs = ['React', 'Node.js', 'Python', 'React', 'Python', 'Node.js', 'React', 'Python', 'React', 'Node.js'];

const students = studentNames.map((name, i) => {
  const n = i + 1;
  return {
    _id: `u_s${n}`,
    name,
    email: `student${String(n).padStart(2, '0')}@demo.io`,
    password: 'student123',
    role: 'student',
    rollNo: `R-2024-${String(100 + n)}`,
    batch: i < 5 ? 'B-2024-A' : 'B-2024-B',
    technology: studentTechs[i],
    assignedTo: ['u_t1', 'u_t2', 'u_t3'][i % 3],
    internshipStartDate: fmt(today.subtract(60 + i * 2, 'day')),
    phone: `98765${String(10000 + n).slice(-5)}`,
    isActive: true,
  };
});

export const users = [
  { _id: 'u_admin', name: 'Admin Sharma', email: 'admin@demo.io', password: 'admin123', role: 'admin', isActive: true },
  ...trainers,
  ...students,
];

// ---------- attendance (last 30 days per student, weekdays only) ----------
const STATUS_BY_OFFSET = ['present', 'present', 'late', 'present', 'half-day', 'present', 'present', 'absent', 'on-leave', 'present'];

export const attendance = [];
for (const s of students) {
  const seed = parseInt(s._id.replace(/\D/g, ''), 10);
  for (let di = 0; di < 30; di++) {
    const d = today.subtract(29 - di, 'day');
    const dow = d.day();
    if (dow === 0 || dow === 6) continue; // weekends off
    const status = STATUS_BY_OFFSET[(seed + di) % STATUS_BY_OFFSET.length];
    const isOff = status === 'absent' || status === 'on-leave';
    const ci = isOff ? null : d.hour(status === 'late' ? 10 : 9).minute(status === 'late' ? 22 : 5).second(0);
    const co = isOff ? null : d.hour(status === 'half-day' ? 13 : 18).minute(status === 'half-day' ? 25 : 10).second(0);
    attendance.push({
      _id: `att_${s._id}_${fmt(d)}`,
      studentId: s._id,
      date: fmt(d),
      status,
      checkIn: ci ? { at: iso(ci), lat: 19.989, lng: 73.77, distanceM: 24 + (di % 18) } : null,
      checkOut: co ? { at: iso(co), lat: 19.989, lng: 73.77, distanceM: 18 + (di % 22) } : null,
      workedMinutes: isOff ? 0 : co.diff(ci, 'minute'),
      isLate: status === 'late',
    });
  }
}

// ---------- daily work ----------
const workTitles = [
  'Built login screen', 'Wrote Redux slice for tasks', 'Fixed responsive layout bug',
  'Integrated geolocation check-in', 'Set up Tailwind theme', 'Code review for teammate',
  'Studied JWT auth flow', 'Implemented attendance report table', 'Optimized re-renders',
  'Hooked up axios interceptors', 'Built office-radius helper', 'Wrote unit tests',
];
const allTech = ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind', 'Redux Toolkit', 'Vite', 'Jest'];

export const dailyWork = [];
for (const s of students) {
  for (let k = 0; k < 5; k++) {
    const d = today.subtract(k * 2 + 1, 'day');
    const idx = (parseInt(s._id.replace(/\D/g, ''), 10) + k) % workTitles.length;
    dailyWork.push({
      _id: `dw_${s._id}_${k}`,
      studentId: s._id,
      student: { _id: s._id, name: s.name, rollNo: s.rollNo },
      title: workTitles[idx],
      description: `Spent the day on ${workTitles[idx].toLowerCase()}. Pushed changes, opened PR, and asked for review from mentor.`,
      hoursSpent: 4 + (k % 4),
      technologies: [allTech[idx % allTech.length], allTech[(idx + 2) % allTech.length]],
      date: fmt(d),
      status: ['submitted', 'approved', 'approved', 'needs-changes', 'submitted'][k],
      teacherComment: k === 3 ? 'Please add more detail about the bug you fixed.' : '',
    });
  }
}

// ---------- tasks ----------
const taskTitles = [
  ['Build profile page', 'Create the student profile page with editable fields and avatar upload.'],
  ['Write unit tests for auth slice', 'Cover login, logout, and fetchMe thunks with mocked axios.'],
  ['Review teammate\'s PR', 'Check the reports module PR by EOD and leave comments.'],
  ['Document the geolocation flow', 'Add a short Markdown doc explaining the check-in distance math.'],
  ['Fix the late-arrival edge case', 'Half-day calculation breaks when check-in is exactly at open time.'],
  ['Migrate icons to lucide-react', 'Replace inline SVGs with the lucide-react package.'],
];

export const tasks = [];
for (const s of students) {
  for (let k = 0; k < 3; k++) {
    const [title, description] = taskTitles[(parseInt(s._id.replace(/\D/g, ''), 10) + k) % taskTitles.length];
    const trainer = trainers.find((t) => t._id === s.assignedTo);
    tasks.push({
      _id: `tsk_${s._id}_${k}`,
      title,
      description,
      priority: ['low', 'medium', 'high'][k % 3],
      status: ['open', 'in-progress', 'done'][k % 3],
      dueDate: fmt(today.add(k * 2 + 1, 'day')),
      assigneeId: s._id,
      assignee: { _id: s._id, name: s.name, rollNo: s.rollNo },
      createdBy: { _id: trainer._id, name: trainer.name, role: 'teacher' },
    });
  }
}

// ---------- reviews ----------
const ratingFor = (seed, i, key) => {
  const base = { punctuality: 7, discipline: 8, technical: 7, communication: 6, teamwork: 8 }[key];
  return Math.max(3, Math.min(10, base + ((seed + i) % 4) - 1));
};

const buildReviewDays = (startStr, len, seed) =>
  Array.from({ length: len }, (_, i) => {
    const date = fmt(dayjs(startStr).add(i, 'day'));
    const dow = dayjs(date).day();
    const isWeekend = dow === 0 || dow === 6;
    const day = {
      day: i + 1,
      date,
      punctuality: isWeekend ? 0 : ratingFor(seed, i, 'punctuality'),
      discipline: isWeekend ? 0 : ratingFor(seed, i, 'discipline'),
      technical: isWeekend ? 0 : ratingFor(seed, i, 'technical'),
      communication: isWeekend ? 0 : ratingFor(seed, i, 'communication'),
      teamwork: isWeekend ? 0 : ratingFor(seed, i, 'teamwork'),
      notes: isWeekend ? 'Weekend' : (i % 3 === 0 ? 'Solid effort today.' : ''),
    };
    return day;
  });

const scoreOf = (days) => {
  const filled = days.filter((d) => d.punctuality + d.discipline + d.technical + d.communication + d.teamwork > 0);
  if (filled.length === 0) return 0;
  const sum = filled.reduce((acc, d) => acc + d.punctuality + d.discipline + d.technical + d.communication + d.teamwork, 0);
  return Math.round((sum / (filled.length * 50)) * 100);
};

export const reviews = [];
for (const s of students.slice(0, 6)) {
  const trainer = trainers.find((t) => t._id === s.assignedTo);
  const seed = parseInt(s._id.replace(/\D/g, ''), 10);
  const startWeekly = fmt(today.subtract(6, 'day'));
  const daysWeekly = buildReviewDays(startWeekly, 7, seed);
  reviews.push({
    _id: `rev_w_${s._id}`,
    student: { _id: s._id, name: s.name, rollNo: s.rollNo },
    teacher: { _id: trainer._id, name: trainer.name },
    kind: 'weekly',
    periodStart: startWeekly,
    periodEnd: fmt(today),
    overallScore: scoreOf(daysWeekly),
    overallComment: 'Good week overall. Keep refining communication during stand-ups.',
    status: 'shared',
    feedbackEmailSent: seed % 2 === 0,
    days: daysWeekly,
  });

  if (seed % 2 === 0) {
    const startBi = fmt(today.subtract(14, 'day'));
    const daysBi = buildReviewDays(startBi, 15, seed + 1);
    reviews.push({
      _id: `rev_f_${s._id}`,
      student: { _id: s._id, name: s.name, rollNo: s.rollNo },
      teacher: { _id: trainer._id, name: trainer.name },
      kind: 'fortnightly',
      periodStart: startBi,
      periodEnd: fmt(today),
      overallScore: scoreOf(daysBi),
      overallComment: '15-day summary: punctual, growing technically, needs to speak up more in reviews.',
      status: 'draft',
      feedbackEmailSent: false,
      days: daysBi,
    });
  }
}

// ---------- login history ----------
const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64) Chrome/124.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) Safari/17.0',
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) Chrome/124.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4) Safari/17.0',
];
const IP_POOL = ['203.0.113.10', '203.0.113.22', '198.51.100.40', '192.0.2.55', '203.0.113.77'];

export const loginHistory = [];
for (const u of users) {
  const seed = u._id.length;
  for (let k = 0; k < 6; k++) {
    const at = today.subtract(k * 2, 'day').hour(9 + (k % 3)).minute(5 + k).second(0);
    loginHistory.push({
      _id: oid(),
      userId: u._id,
      event: k === 4 ? 'failed' : k === 5 ? 'logout' : 'login',
      at: iso(at),
      ip: IP_POOL[(seed + k) % IP_POOL.length],
      userAgent: UA_POOL[(seed + k) % UA_POOL.length],
    });
  }
}
loginHistory.sort((a, b) => (a.at < b.at ? 1 : -1));

// ---------- helpers consumed by adapter ----------
export const findUserByEmail = (email) =>
  users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());

export const userById = (id) => users.find((u) => u._id === id);

export const studentsList = () => users.filter((u) => u.role === 'student');
export const trainersList = () => users.filter((u) => u.role === 'teacher');

export const summarizeAttendance = (studentId, from, to) => {
  const rows = attendance.filter(
    (a) => a.studentId === studentId && (!from || a.date >= from) && (!to || a.date <= to),
  );
  const count = (st) => rows.filter((r) => r.status === st).length;
  const present = count('present');
  const late = count('late');
  const halfDay = count('half-day');
  const absent = count('absent');
  const onLeave = count('on-leave');
  const totalWorking = rows.length;
  const attendancePct = totalWorking === 0
    ? 0
    : Math.round(((present + late + halfDay * 0.5) / totalWorking) * 100);
  return { present, late, halfDay, absent, onLeave, totalWorking, attendancePct };
};

export const todayAttendanceFor = (studentId) => {
  const d = fmt(today);
  return attendance.find((a) => a.studentId === studentId && a.date === d) || null;
};
