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
  votoNumerico?: number; // 18-30
  conLode?: boolean;
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

// Add this stub type to fix CourseForm imports
export interface Course {
  id: string;
  nome: string;
  // Add other properties as needed
}
