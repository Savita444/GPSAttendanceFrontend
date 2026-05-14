// Axios adapter that resolves API calls against the in-memory fixtures in ./data.js.
// Wired up from src/api/axios.js when VITE_USE_MOCKS === 'true'.

import dayjs from 'dayjs';
import {
  users, offices, attendance, dailyWork, tasks, reviews, loginHistory,
  findUserByEmail, userById, studentsList, trainersList,
  summarizeAttendance, todayAttendanceFor,
} from './data.js';

const fmt = (d) => d.format('YYYY-MM-DD');
const now = () => new Date().toISOString();
const oid = () => 'm_' + Math.random().toString(36).slice(2, 10);

const ok = (data, config) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: { 'content-type': 'application/json' },
  config,
  request: {},
});

const fail = (status, message, config) => {
  const err = new Error(message);
  err.response = {
    data: { message },
    status,
    statusText: 'Error',
    headers: {},
    config,
  };
  err.config = config;
  return err;
};

const parseToken = (config) => {
  const auth = config.headers?.Authorization || config.headers?.authorization;
  if (!auth) return null;
  const m = String(auth).match(/^Bearer\s+(.+)$/);
  if (!m) return null;
  try {
    return JSON.parse(atob(m[1]));
  } catch {
    return null;
  }
};

const currentUser = (config) => {
  const t = parseToken(config);
  return t ? userById(t.id) : null;
};

// ---------- route handlers ----------
const routes = [
  // ===== auth =====
  {
    method: 'POST', match: /^\/auth\/login$/,
    handle: (_m, _u, body) => {
      const u = findUserByEmail(body?.email);
      if (!u || u.password !== body?.password) {
        return { status: 401, body: { message: 'Invalid email or password' } };
      }
      const safeUser = { ...u };
      delete safeUser.password;
      const token = btoa(JSON.stringify({ id: u._id, role: u.role, at: Date.now() }));
      loginHistory.unshift({
        _id: oid(), userId: u._id, event: 'login',
        at: now(), ip: '127.0.0.1', userAgent: 'Mock/1.0',
      });
      return { body: { token, user: safeUser } };
    },
  },
  {
    method: 'POST', match: /^\/auth\/logout$/,
    handle: (_m, _u, _b, _p, config) => {
      const u = currentUser(config);
      if (u) {
        loginHistory.unshift({
          _id: oid(), userId: u._id, event: 'logout',
          at: now(), ip: '127.0.0.1', userAgent: 'Mock/1.0',
        });
      }
      return { body: { ok: true } };
    },
  },
  {
    method: 'GET', match: /^\/auth\/me$/,
    handle: (_m, _u, _b, _p, config) => {
      const u = currentUser(config);
      if (!u) return { status: 401, body: { message: 'Unauthorized' } };
      const safe = { ...u };
      delete safe.password;
      return { body: { user: safe } };
    },
  },
  {
    method: 'GET', match: /^\/auth\/login-history\/?(.*)$/,
    handle: (_m, url) => {
      const id = url.replace(/^\/auth\/login-history\/?/, '').split('?')[0];
      const items = id ? loginHistory.filter((l) => l.userId === id) : loginHistory.slice(0, 50);
      return { body: { items } };
    },
  },
  {
    method: 'POST', match: /^\/auth\/register$/,
    handle: (_m, _u, body) => {
      if (!body?.email || !body?.password) {
        return { status: 400, body: { message: 'Email and password required' } };
      }
      if (findUserByEmail(body.email)) {
        return { status: 409, body: { message: 'Email already in use' } };
      }
      const user = {
        _id: oid(),
        isActive: true,
        ...body,
      };
      users.unshift(user);
      const safe = { ...user };
      delete safe.password;
      return { body: { user: safe } };
    },
  },

  // ===== attendance =====
  {
    method: 'POST', match: /^\/attendance\/check-in$/,
    handle: (_m, _u, body, _p, config) => {
      const me = currentUser(config);
      if (!me || me.role !== 'student') return { status: 401, body: { message: 'Unauthorized' } };
      const today = fmt(dayjs());
      let row = attendance.find((a) => a.studentId === me._id && a.date === today);
      if (row?.checkIn) return { status: 400, body: { message: 'Already checked in today' } };
      row = row || {
        _id: oid(), studentId: me._id, date: today,
        status: 'present', checkIn: null, checkOut: null, workedMinutes: 0, isLate: false,
      };
      const lateAfter = dayjs().hour(9).minute(30);
      row.checkIn = { at: now(), lat: body?.lat ?? 19.989, lng: body?.lng ?? 73.77, distanceM: 24 };
      row.isLate = dayjs().isAfter(lateAfter);
      row.status = row.isLate ? 'late' : 'present';
      if (!attendance.includes(row)) attendance.push(row);
      return { body: { attendance: row } };
    },
  },
  {
    method: 'POST', match: /^\/attendance\/check-out$/,
    handle: (_m, _u, body, _p, config) => {
      const me = currentUser(config);
      if (!me || me.role !== 'student') return { status: 401, body: { message: 'Unauthorized' } };
      const today = fmt(dayjs());
      const row = attendance.find((a) => a.studentId === me._id && a.date === today);
      if (!row?.checkIn) return { status: 400, body: { message: 'Check in before checking out' } };
      if (row.checkOut) return { status: 400, body: { message: 'Already checked out today' } };
      row.checkOut = { at: now(), lat: body?.lat ?? 19.989, lng: body?.lng ?? 73.77, distanceM: 18 };
      row.workedMinutes = dayjs(row.checkOut.at).diff(dayjs(row.checkIn.at), 'minute');
      if (row.workedMinutes < 240) row.status = 'half-day';
      return { body: { attendance: row } };
    },
  },
  {
    method: 'GET', match: /^\/attendance\/today$/,
    handle: (_m, _u, _b, _p, config) => {
      const me = currentUser(config);
      if (!me) return { status: 401, body: { message: 'Unauthorized' } };
      return { body: { attendance: todayAttendanceFor(me._id) } };
    },
  },
  {
    method: 'GET', match: /^\/attendance\/history$/,
    handle: (_m, _u, _b, params, config) => {
      const me = currentUser(config);
      if (!me) return { status: 401, body: { message: 'Unauthorized' } };
      const items = attendance
        .filter((a) => a.studentId === me._id)
        .filter((a) => (!params.from || a.date >= params.from) && (!params.to || a.date <= params.to))
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      return { body: { items } };
    },
  },
  {
    method: 'GET', match: /^\/attendance\/summary$/,
    handle: (_m, _u, _b, params, config) => {
      const me = currentUser(config);
      if (!me) return { status: 401, body: { message: 'Unauthorized' } };
      return { body: summarizeAttendance(me._id, params.from, params.to) };
    },
  },

  // ===== student =====
  {
    method: 'GET', match: /^\/student\/dashboard$/,
    handle: (_m, _u, _b, _p, config) => {
      const me = currentUser(config);
      if (!me || me.role !== 'student') return { status: 401, body: { message: 'Unauthorized' } };
      const from = fmt(dayjs().subtract(29, 'day'));
      const to = fmt(dayjs());
      const summary = summarizeAttendance(me._id, from, to);
      const recentWork = dailyWork
        .filter((w) => w.studentId === me._id)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 5);
      const latestReview = reviews
        .filter((r) => r.student._id === me._id)
        .sort((a, b) => (a.periodStart < b.periodStart ? 1 : -1))[0] || null;
      return {
        body: {
          todayAttendance: todayAttendanceFor(me._id),
          summary,
          recentWork,
          latestReview,
        },
      };
    },
  },

  // ===== teacher =====
  {
    method: 'GET', match: /^\/teacher\/students$/,
    handle: (_m, _u, _b, _p, config) => {
      const me = currentUser(config);
      if (!me || me.role !== 'teacher') return { status: 401, body: { message: 'Unauthorized' } };
      const items = studentsList().filter((s) => s.assignedTo === me._id);
      return { body: { items } };
    },
  },
  {
    method: 'GET', match: /^\/teacher\/stats$/,
    handle: (_m, _u, _b, _p, config) => {
      const me = currentUser(config);
      if (!me || me.role !== 'teacher') return { status: 401, body: { message: 'Unauthorized' } };
      const myStudents = studentsList().filter((s) => s.assignedTo === me._id);
      const todayStr = fmt(dayjs());
      const presentToday = myStudents.filter((s) => {
        const a = attendance.find((x) => x.studentId === s._id && x.date === todayStr);
        return a && (a.status === 'present' || a.status === 'late' || a.status === 'half-day');
      }).length;
      const pendingWork = dailyWork.filter((w) =>
        myStudents.some((s) => s._id === w.studentId) && w.status === 'submitted',
      ).length;
      const pendingReviews = reviews.filter((r) =>
        myStudents.some((s) => s._id === r.student._id) && r.status === 'draft',
      ).length;
      return {
        body: {
          counts: { totalStudents: myStudents.length, presentToday, pendingWork, pendingReviews },
        },
      };
    },
  },
  {
    method: 'GET', match: /^\/teacher\/student\/([^/]+)\/summary$/,
    handle: (_m, url, _b, params) => {
      const id = url.match(/^\/teacher\/student\/([^/]+)\/summary$/)[1];
      return { body: summarizeAttendance(id, params.from, params.to) };
    },
  },
  {
    method: 'GET', match: /^\/teacher\/student\/([^/]+)\/details$/,
    handle: (_m, url) => {
      const id = url.match(/^\/teacher\/student\/([^/]+)\/details$/)[1];
      const s = userById(id);
      if (!s) return { status: 404, body: { message: 'Student not found' } };
      const from = fmt(dayjs().subtract(29, 'day'));
      const summary = summarizeAttendance(id, from, fmt(dayjs()));
      const att = attendance
        .filter((a) => a.studentId === id && a.date >= from)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      const studentTasks = tasks.filter((t) => t.assigneeId === id);
      return {
        body: {
          student: {
            id: s._id, _id: s._id, name: s.name, rollNo: s.rollNo, email: s.email,
            technology: s.technology, internshipStartDate: s.internshipStartDate,
          },
          summary,
          attendance: att,
          tasks: studentTasks,
        },
      };
    },
  },

  // ===== tasks =====
  {
    method: 'GET', match: /^\/tasks\/mine$/,
    handle: (_m, _u, _b, _p, config) => {
      const me = currentUser(config);
      if (!me) return { status: 401, body: { message: 'Unauthorized' } };
      const items = tasks.filter((t) => t.assigneeId === me._id);
      return { body: { items } };
    },
  },
  {
    method: 'GET', match: /^\/tasks$/,
    handle: (_m, _u, _b, params, config) => {
      const me = currentUser(config);
      if (!me) return { status: 401, body: { message: 'Unauthorized' } };
      let items = tasks.filter((t) => t.createdBy?._id === me._id);
      if (params.assigneeId) items = items.filter((t) => t.assigneeId === params.assigneeId);
      return { body: { items } };
    },
  },
  {
    method: 'POST', match: /^\/tasks$/,
    handle: (_m, _u, body, _p, config) => {
      const me = currentUser(config);
      if (!me) return { status: 401, body: { message: 'Unauthorized' } };
      const assignee = userById(body.assigneeId);
      const task = {
        _id: oid(),
        title: body.title,
        description: body.description || '',
        priority: body.priority || 'medium',
        status: 'open',
        dueDate: body.dueDate || null,
        assigneeId: body.assigneeId,
        assignee: assignee ? { _id: assignee._id, name: assignee.name, rollNo: assignee.rollNo } : null,
        createdBy: { _id: me._id, name: me.name, role: me.role },
      };
      tasks.unshift(task);
      return { body: { task } };
    },
  },
  {
    method: 'PATCH', match: /^\/tasks\/([^/]+)$/,
    handle: (_m, url, body) => {
      const id = url.match(/^\/tasks\/([^/]+)$/)[1];
      const t = tasks.find((x) => x._id === id);
      if (!t) return { status: 404, body: { message: 'Task not found' } };
      Object.assign(t, body);
      return { body: { task: t } };
    },
  },
  {
    method: 'DELETE', match: /^\/tasks\/([^/]+)$/,
    handle: (_m, url) => {
      const id = url.match(/^\/tasks\/([^/]+)$/)[1];
      const i = tasks.findIndex((x) => x._id === id);
      if (i < 0) return { status: 404, body: { message: 'Task not found' } };
      tasks.splice(i, 1);
      return { body: { ok: true } };
    },
  },

  // ===== admin =====
  {
    method: 'GET', match: /^\/admin\/dashboard$/,
    handle: () => {
      const studentsAll = studentsList();
      const teachersAll = trainersList();
      const todayStr = fmt(dayjs());
      const todayRows = attendance.filter((a) => a.date === todayStr);
      const presentToday = todayRows.filter((r) => r.status === 'present').length;
      const lateToday = todayRows.filter((r) => r.status === 'late').length;
      const recentLogins = loginHistory.slice(0, 8).map((l) => ({
        ...l, user: (() => {
          const u = userById(l.userId);
          return u ? { _id: u._id, name: u.name, role: u.role } : null;
        })(),
      }));
      return {
        body: {
          counts: {
            students: studentsAll.length,
            teachers: teachersAll.length,
            presentToday,
            lateToday,
          },
          recentLogins,
        },
      };
    },
  },
  {
    method: 'GET', match: /^\/admin\/performance$/,
    handle: (_m, _u, _b, params) => {
      const items = studentsList().map((s) => {
        const sum = summarizeAttendance(s._id, params.from, params.to);
        return { _id: s._id, name: s.name, rollNo: s.rollNo, attendancePct: sum.attendancePct };
      }).sort((a, b) => b.attendancePct - a.attendancePct);
      return { body: { items } };
    },
  },
  {
    method: 'GET', match: /^\/admin\/users$/,
    handle: (_m, _u, _b, params) => {
      let items = users.filter((u) => u.role !== 'admin');
      if (params.role) items = items.filter((u) => u.role === params.role);
      items = items.map((u) => { const c = { ...u }; delete c.password; return c; });
      return { body: { items } };
    },
  },
  {
    method: 'PATCH', match: /^\/admin\/users\/([^/]+)$/,
    handle: (_m, url, body) => {
      const id = url.match(/^\/admin\/users\/([^/]+)$/)[1];
      const u = userById(id);
      if (!u) return { status: 404, body: { message: 'User not found' } };
      Object.assign(u, body);
      const safe = { ...u };
      delete safe.password;
      return { body: { user: safe } };
    },
  },
  {
    method: 'PATCH', match: /^\/admin\/users\/([^/]+)\/active$/,
    handle: (_m, url, body) => {
      const id = url.match(/^\/admin\/users\/([^/]+)\/active$/)[1];
      const u = userById(id);
      if (!u) return { status: 404, body: { message: 'User not found' } };
      u.isActive = !!body.isActive;
      const safe = { ...u };
      delete safe.password;
      return { body: { user: safe } };
    },
  },
  {
    method: 'GET', match: /^\/admin\/offices$/,
    handle: () => ({ body: { items: offices } }),
  },
  {
    method: 'POST', match: /^\/admin\/offices$/,
    handle: (_m, _u, body) => {
      const office = { _id: oid(), ...body };
      offices.unshift(office);
      return { body: { office } };
    },
  },
  {
    method: 'PATCH', match: /^\/admin\/offices\/([^/]+)$/,
    handle: (_m, url, body) => {
      const id = url.match(/^\/admin\/offices\/([^/]+)$/)[1];
      const o = offices.find((x) => x._id === id);
      if (!o) return { status: 404, body: { message: 'Office not found' } };
      Object.assign(o, body);
      return { body: { office: o } };
    },
  },

  // ===== daily work =====
  {
    method: 'POST', match: /^\/daily-work$/,
    handle: (_m, _u, body, _p, config) => {
      const me = currentUser(config);
      if (!me || me.role !== 'student') return { status: 401, body: { message: 'Unauthorized' } };
      const work = {
        _id: oid(),
        studentId: me._id,
        student: { _id: me._id, name: me.name, rollNo: me.rollNo },
        title: body.title,
        description: body.description,
        hoursSpent: body.hoursSpent,
        technologies: body.technologies || [],
        date: body.date || fmt(dayjs()),
        status: 'submitted',
        teacherComment: '',
      };
      dailyWork.unshift(work);
      return { body: { work } };
    },
  },
  {
    method: 'GET', match: /^\/daily-work\/mine$/,
    handle: (_m, _u, _b, _p, config) => {
      const me = currentUser(config);
      if (!me) return { status: 401, body: { message: 'Unauthorized' } };
      const items = dailyWork
        .filter((w) => w.studentId === me._id)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      return { body: { items } };
    },
  },
  {
    method: 'GET', match: /^\/daily-work$/,
    handle: (_m, _u, _b, params, config) => {
      const me = currentUser(config);
      if (!me) return { status: 401, body: { message: 'Unauthorized' } };
      const myStudents = me.role === 'teacher'
        ? new Set(studentsList().filter((s) => s.assignedTo === me._id).map((s) => s._id))
        : null;
      let items = dailyWork.filter((w) => !myStudents || myStudents.has(w.studentId));
      if (params.status) items = items.filter((w) => w.status === params.status);
      return { body: { items } };
    },
  },
  {
    method: 'PATCH', match: /^\/daily-work\/([^/]+)\/review$/,
    handle: (_m, url, body) => {
      const id = url.match(/^\/daily-work\/([^/]+)\/review$/)[1];
      const w = dailyWork.find((x) => x._id === id);
      if (!w) return { status: 404, body: { message: 'Work not found' } };
      w.status = body.status;
      w.teacherComment = body.teacherComment || '';
      return { body: { work: w } };
    },
  },

  // ===== reviews =====
  {
    method: 'POST', match: /^\/review$/,
    handle: (_m, _u, body, _p, config) => {
      const me = currentUser(config);
      if (!me || me.role !== 'teacher') return { status: 401, body: { message: 'Unauthorized' } };
      const student = userById(body.studentId);
      if (!student) return { status: 404, body: { message: 'Student not found' } };
      const filled = (body.days || []).filter(
        (d) => d.punctuality + d.discipline + d.technical + d.communication + d.teamwork > 0,
      );
      const score = filled.length === 0 ? 0 : Math.round(
        filled.reduce(
          (acc, d) => acc + d.punctuality + d.discipline + d.technical + d.communication + d.teamwork,
          0,
        ) / (filled.length * 50) * 100,
      );
      const existing = reviews.find(
        (r) => r.student._id === body.studentId
          && r.periodStart === body.periodStart
          && r.periodEnd === body.periodEnd,
      );
      const review = existing || {
        _id: oid(),
        student: { _id: student._id, name: student.name, rollNo: student.rollNo },
        teacher: { _id: me._id, name: me.name },
        status: 'draft',
        feedbackEmailSent: false,
      };
      Object.assign(review, {
        kind: body.kind || 'weekly',
        periodStart: body.periodStart,
        periodEnd: body.periodEnd,
        overallComment: body.overallComment || '',
        overallScore: score,
        days: body.days || [],
      });
      if (!existing) reviews.unshift(review);
      return { body: { review } };
    },
  },
  {
    method: 'GET', match: /^\/review$/,
    handle: (_m, _u, _b, _p, config) => {
      const me = currentUser(config);
      if (!me) return { status: 401, body: { message: 'Unauthorized' } };
      let items;
      if (me.role === 'student') items = reviews.filter((r) => r.student._id === me._id);
      else if (me.role === 'teacher') items = reviews.filter((r) => r.teacher._id === me._id);
      else items = reviews.slice();
      items = items.sort((a, b) => (a.periodStart < b.periodStart ? 1 : -1));
      return { body: { items } };
    },
  },
  {
    method: 'GET', match: /^\/review\/([^/]+)$/,
    handle: (_m, url) => {
      const id = url.match(/^\/review\/([^/]+)$/)[1];
      const r = reviews.find((x) => x._id === id);
      if (!r) return { status: 404, body: { message: 'Review not found' } };
      return { body: { review: r } };
    },
  },
  {
    method: 'POST', match: /^\/review\/([^/]+)\/send-email$/,
    handle: (_m, url) => {
      const id = url.match(/^\/review\/([^/]+)\/send-email$/)[1];
      const r = reviews.find((x) => x._id === id);
      if (!r) return { status: 404, body: { message: 'Review not found' } };
      r.feedbackEmailSent = true;
      r.status = 'shared';
      return { body: { review: r } };
    },
  },

  // ===== reports =====
  {
    method: 'GET', match: /^\/reports\/attendance$/,
    handle: (_m, _u, _b, params) => {
      let rows = attendance.slice();
      if (params.from) rows = rows.filter((r) => r.date >= params.from);
      if (params.to) rows = rows.filter((r) => r.date <= params.to);
      if (params.studentId) rows = rows.filter((r) => r.studentId === params.studentId);
      if (params.batch) {
        const inBatch = new Set(studentsList().filter((s) => s.batch === params.batch).map((s) => s._id));
        rows = rows.filter((r) => inBatch.has(r.studentId));
      }
      const items = rows
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .map((r) => {
          const s = userById(r.studentId);
          return {
            date: r.date,
            rollNo: s?.rollNo,
            name: s?.name,
            batch: s?.batch,
            status: r.status,
            workedMinutes: r.workedMinutes,
            isLate: r.isLate,
          };
        });
      return { body: { items, total: items.length } };
    },
  },

  // ===== reminders / 15-day mail =====
  {
    method: 'GET', match: /^\/reminders\/fortnightly\/preview$/,
    handle: () => ({ body: { trainers: trainersList().map((t) => ({ _id: t._id, name: t.name, technology: t.technology })) } }),
  },
  {
    method: 'GET', match: /^\/reminders\/fortnightly\/preview\/([^/]+)$/,
    handle: (_m, url, _b, params) => {
      const id = url.match(/^\/reminders\/fortnightly\/preview\/([^/]+)$/)[1];
      const trainer = userById(id);
      if (!trainer) return { status: 404, body: { message: 'Trainer not found' } };
      const from = params.from || fmt(dayjs().subtract(14, 'day'));
      const to = params.to || fmt(dayjs());
      const myStudents = studentsList().filter((s) => s.assignedTo === id);
      const studentRows = myStudents.map((s) => {
        const sum = summarizeAttendance(s._id, from, to);
        const reviewSubmitted = reviews.some(
          (r) => r.student._id === s._id && r.kind === 'fortnightly' && r.periodStart >= from,
        );
        return {
          id: s._id, rollNo: s.rollNo, name: s.name, email: s.email,
          present: sum.present, late: sum.late, halfDay: sum.halfDay, absent: sum.absent,
          attendancePct: sum.attendancePct, reviewSubmitted,
        };
      });
      return {
        body: {
          trainer: { _id: trainer._id, name: trainer.name, technology: trainer.technology, email: trainer.email },
          periodStart: from,
          periodEnd: to,
          students: studentRows,
        },
      };
    },
  },
  {
    method: 'POST', match: /^\/reminders\/fortnightly\/send-trainer\/([^/]+)$/,
    handle: (_m, url) => {
      const id = url.match(/^\/reminders\/fortnightly\/send-trainer\/([^/]+)$/)[1];
      const trainer = userById(id);
      if (!trainer) return { status: 404, body: { message: 'Trainer not found' } };
      const count = studentsList().filter((s) => s.assignedTo === id).length;
      return { body: { mailedTo: trainer.email, studentCount: count } };
    },
  },
  {
    method: 'POST', match: /^\/reminders\/fortnightly\/send-all-trainers$/,
    handle: () => ({ body: { sent: trainersList().length, failed: 0 } }),
  },
  {
    method: 'POST', match: /^\/reminders\/fortnightly\/run-admin$/,
    handle: () => ({ body: { sent: trainersList().length, failed: 0 } }),
  },
];

// Strip the /api baseURL prefix so route patterns can stay relative.
const stripBase = (url) => url.replace(/^\/api/, '').split('?')[0];

const mockAdapter = (config) =>
  new Promise((resolve, reject) => {
    const method = (config.method || 'get').toUpperCase();
    const fullUrl = config.url.startsWith('http')
      ? new URL(config.url).pathname + new URL(config.url).search
      : (config.baseURL || '') + config.url;
    const url = stripBase(fullUrl);
    const params = { ...(config.params || {}) };
    let body = config.data;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { /* leave as string */ }
    }

    const route = routes.find((r) => r.method === method && r.match.test(url));
    const respond = () => {
      if (!route) {
        return reject(fail(404, `Mock route not found: ${method} ${url}`, config));
      }
      try {
        const r = route.handle(method, url, body, params, config) || {};
        if (r.status && r.status >= 400) {
          return reject(fail(r.status, r.body?.message || 'Error', config));
        }
        resolve(ok(r.body ?? {}, config));
      } catch (e) {
        reject(fail(500, e.message || 'Mock handler crashed', config));
      }
    };
    // Tiny latency so loading states render
    setTimeout(respond, 120);
  });

export default mockAdapter;
