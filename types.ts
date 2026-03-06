
export type Role = 'DIRECTOR' | 'CPE' | 'TEACHER' | 'PARENT' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  uniqueId: string;
  password?: string;
  classes?: string[];
  subject?: string; 
  childrenIds?: string[];
  isValidated: boolean;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  matricule: string;
  pensionTotal: number;
  pensionPaid: number;
  level: string;
  parentUniqueId: string;
}

export interface Class {
  id: string;
  name: string;
  level: string;
}

export interface PushNotification {
  id: string;
  recipientId: string;
  title: string;
  body: string;
  type: 'ABSENCE' | 'GRADE' | 'FINANCE' | 'CONVOCATION' | 'OVERDUE' | 'COURSE';
  timestamp: number;
  acknowledged?: boolean;
  meta?: {
    sequence?: number;
    grade?: number;
    subject?: string;
    courseId?: string;
    fileName?: string;
    fileData?: string; 
    studentId?: string;
    studentName?: string;
  };
}

export interface ScheduleItem {
  id: string;
  day: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';
  startTime: string;
  endTime: string;
  subject: string;
  teacherName: string;
  room: string;
  classId: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  content: string;
  timestamp: number;
}

export interface SchoolConfig {
  absenceAlertThreshold: number;
  pensionsByLevel: Record<string, number>;
  examPeriods: { name: string; startDate: string }[];
}
