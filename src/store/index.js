import { configureStore } from '@reduxjs/toolkit';
import auth from './slices/auth';
import attendance from './slices/attendance';
import dailyWork from './slices/dailyWork';
import review from './slices/review';
import admin from './slices/admin';
import student from './slices/student';
import teacher from './slices/teacher';
import reminders from './slices/reminders';
import reports from './slices/reports';
import loginHistory from './slices/loginHistory';
import task from './slices/task';

export const store = configureStore({
  reducer: {
    auth,
    attendance,
    dailyWork,
    review,
    admin,
    student,
    teacher,
    reminders,
    reports,
    loginHistory,
    task,
  },
});
