
import { Student, Class, Role, ScheduleItem } from './types';

export const CLASSES: Class[] = [
  { id: 'c1', name: '2nde A', level: '2nde' },
  { id: 'c2', name: '2nde B', level: '2nde' },
  { id: 'c3', name: '1ère C', level: '1ère' }
];

// Génération de 60 élèves avec un parent unique pour chacun
const BASE_STUDENTS: Student[] = Array.from({ length: 60 }).map((_, i) => ({
  id: `s${i + 1}`,
  name: `Élève ${i + 1}`,
  classId: i < 20 ? 'c1' : i < 40 ? 'c2' : 'c3',
  matricule: `MAT-${1000 + i}`,
  pensionTotal: 450000,
  pensionPaid: i % 5 === 0 ? 200000 : 450000,
  level: i < 40 ? '2nde' : '1ère',
  parentUniqueId: `PAR-${100 + i}` // Lien direct: MAT-1000 -> PAR-100
}));

export const STUDENTS: Student[] = [
  {
    id: 's0',
    name: 'Axel Konan',
    classId: 'c1',
    matricule: 'MAT-001',
    pensionTotal: 450000,
    pensionPaid: 450000,
    level: '2nde',
    parentUniqueId: 'PAR-001'
  },
  ...BASE_STUDENTS
];

export const VALID_IDS: Record<Role, string[]> = {
  DIRECTOR: ['DIR-001'],
  CPE: ['CPE-001', 'CPE-002'],
  TEACHER: ['PROF-001', 'PROF-002', 'PROF-003', 'PROF-004', 'PROF-005'],
  STUDENT: STUDENTS.map(s => s.matricule),
  PARENT: ['PAR-001', ...Array.from({ length: 60 }).map((_, i) => `PAR-${100 + i}`)],
};

export const INITIAL_HOMEWORK = [
  { id: 'h1', classId: 'c1', subject: 'Mathématiques', description: 'Exercices 4, 5, 6 page 12', dueDate: '2024-05-20' },
  { id: 'h2', classId: 'c1', subject: 'Physique', description: 'Réviser le chapitre sur l\'optique', dueDate: '2024-05-22' }
];

export const SCHEDULE: ScheduleItem[] = [
  { id: 'sc1', day: 'Lundi', startTime: '08:00', endTime: '10:00', subject: 'Mathématiques', teacherName: 'M. Kouassi', room: 'Salle 101', classId: 'c1' },
  { id: 'sc2', day: 'Lundi', startTime: '10:00', endTime: '12:00', subject: 'Français', teacherName: 'Mme Bamba', room: 'Salle 101', classId: 'c1' },
  { id: 'sc3', day: 'Mardi', startTime: '08:00', endTime: '10:00', subject: 'Anglais', teacherName: 'M. Smith', room: 'Salle 102', classId: 'c1' },
  { id: 'sc4', day: 'Mardi', startTime: '10:00', endTime: '12:00', subject: 'Physique', teacherName: 'M. Yao', room: 'Labo 1', classId: 'c1' },
  { id: 'sc5', day: 'Mercredi', startTime: '08:00', endTime: '10:00', subject: 'Histoire-Géo', teacherName: 'Mme Koné', room: 'Salle 101', classId: 'c1' },
  { id: 'sc6', day: 'Jeudi', startTime: '08:00', endTime: '10:00', subject: 'SVT', teacherName: 'M. Diallo', room: 'Labo 2', classId: 'c1' },
  { id: 'sc7', day: 'Vendredi', startTime: '08:00', endTime: '10:00', subject: 'Philosophie', teacherName: 'M. Traoré', room: 'Salle 201', classId: 'c1' },
];
