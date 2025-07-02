
export type Student = {
  id: string;
  matricola: string;
  nome: string;
  cognome: string;
};

export type ExamType = 'intermedio' | 'completo';

export type Exam = {
  id: string;
  nome: string;
  tipo: ExamType;
  data: string; // ISO date string
  useLetterGrades: boolean;
};

export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type Grade = {
  id: string;
  matricola: string;
  examId: string;
  votoLettera?: LetterGrade;
  votoNumerico?: number; // 0-30
};

export type StudentWithGrades = Student & {
  grades: (Grade & { exam: Exam })[];
  average?: number;
};

export type ExamWithStats = Exam & {
  stats: GradeStats;
  studentCount: number;
};

export type GradeStats = {
  average: number;
  passing: number;
  failing: number;
  passingPercentage: number;
  distribution: Record<string, number>; // key is grade value (A, B, 18, 19, etc.)
};

// Fixed Course type to match CourseForm usage
export interface Course {
  id: string;
  nome: string;
  useLetterGrades: boolean;
  haIntermedio: boolean; // Added this property
}
