
import { Student, Exam, Grade, ExamType, LetterGrade, Course } from "@/types";

// Local storage keys
const STUDENTS_KEY = "sgvu_students";
const EXAMS_KEY = "sgvu_exams";
const GRADES_KEY = "sgvu_grades";
const COURSES_KEY = "sgvu_courses";

// Helper to generate IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Local storage getters and setters
export const getStudents = (): Student[] => {
  const data = localStorage.getItem(STUDENTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const setStudents = (students: Student[]): void => {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
};

export const getExams = (): Exam[] => {
  const data = localStorage.getItem(EXAMS_KEY);
  return data ? JSON.parse(data) : [];
};

export const setExams = (exams: Exam[]): void => {
  localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
};

export const getGrades = (): Grade[] => {
  const data = localStorage.getItem(GRADES_KEY);
  return data ? JSON.parse(data) : [];
};

export const setGrades = (grades: Grade[]): void => {
  localStorage.setItem(GRADES_KEY, JSON.stringify(grades));
};

export const getCourses = (): Course[] => {
  const data = localStorage.getItem(COURSES_KEY);
  return data ? JSON.parse(data) : [];
};

export const setCourses = (courses: Course[]): void => {
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
};

// CRUD Operations
// Students
export const addStudent = (student: Omit<Student, "id">): Student => {
  const newStudent = { ...student, id: generateId() };
  const students = getStudents();
  
  // Check for duplicate matricola
  if (students.some(s => s.matricola === student.matricola)) {
    throw new Error("Matricola already exists");
  }
  
  setStudents([...students, newStudent]);
  return newStudent;
};

export const updateStudent = (student: Student): Student => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === student.id);
  
  if (index === -1) {
    throw new Error("Student not found");
  }
  
  // Check for duplicate matricola (excluding current student)
  if (students.some(s => s.matricola === student.matricola && s.id !== student.id)) {
    throw new Error("Matricola already exists");
  }
  
  students[index] = student;
  setStudents(students);
  return student;
};

export const deleteStudent = (id: string): void => {
  const students = getStudents();
  setStudents(students.filter(s => s.id !== id));
  
  // Also delete related grades
  const grades = getGrades();
  const student = students.find(s => s.id === id);
  if (student) {
    setGrades(grades.filter(g => g.matricola !== student.matricola));
  }
};

// Exams
export const addExam = (exam: Omit<Exam, "id">): Exam => {
  console.log('Adding exam:', exam);
  const newExam = { ...exam, id: generateId() };
  const exams = getExams();
  const updatedExams = [...exams, newExam];
  setExams(updatedExams);
  console.log('Exam added successfully:', newExam);
  console.log('Updated exams list:', updatedExams);
  return newExam;
};

export const updateExam = (exam: Exam): Exam => {
  const exams = getExams();
  const index = exams.findIndex(e => e.id === exam.id);
  
  if (index === -1) {
    throw new Error("Exam not found");
  }
  
  exams[index] = exam;
  setExams(exams);
  return exam;
};

export const deleteExam = (id: string): void => {
  const exams = getExams();
  setExams(exams.filter(e => e.id !== id));
  
  // Also delete related grades
  const grades = getGrades();
  setGrades(grades.filter(g => g.examId !== id));
};

// Clear all exams
export const clearAllExams = (): void => {
  console.log('Clearing all exams...');
  setExams([]);
  // Also clear all grades since they depend on exams
  setGrades([]);
  console.log('All exams and grades cleared');
};

// Courses
export const addCourse = (course: Omit<Course, "id">): Course => {
  const newCourse = { ...course, id: generateId() };
  const courses = getCourses();
  setCourses([...courses, newCourse]);
  return newCourse;
};

export const updateCourse = (course: Course): Course => {
  const courses = getCourses();
  const index = courses.findIndex(c => c.id === course.id);
  
  if (index === -1) {
    throw new Error("Course not found");
  }
  
  courses[index] = course;
  setCourses(courses);
  return course;
};

// Grades
export const addGrade = (grade: Omit<Grade, "id">): Grade => {
  const newGrade = { ...grade, id: generateId() };
  const grades = getGrades();
  
  // Validate grade data, but allow grades for non-registered students
  validateGrade(newGrade, true);
  
  setGrades([...grades, newGrade]);
  return newGrade;
};

export const updateGrade = (grade: Grade): Grade => {
  const grades = getGrades();
  const index = grades.findIndex(g => g.id === grade.id);
  
  if (index === -1) {
    throw new Error("Grade not found");
  }
  
  // Validate grade data, but allow grades for non-registered students
  validateGrade(grade, true);
  
  grades[index] = grade;
  setGrades(grades);
  return grade;
};

export const deleteGrade = (id: string): void => {
  const grades = getGrades();
  setGrades(grades.filter(g => g.id !== id));
};

// Grade validation helper
const validateGrade = (grade: Grade, allowNonRegisteredStudents: boolean = false): void => {
  // Get the exam to check its type
  const exams = getExams();
  const exam = exams.find(e => e.id === grade.examId);
  
  if (!exam) {
    throw new Error("Related exam not found");
  }
  
  // For exams with letter grades
  if (exam.useLetterGrades) {
    if (!grade.votoLettera) {
      throw new Error("Letter grade is required for exams with letter grades");
    }
    if (grade.votoNumerico !== undefined) {
      throw new Error("Numeric grade is not applicable for exams with letter grades");
    }
  }
  
  // For exams with numeric grades
  if (!exam.useLetterGrades) {
    if (grade.votoNumerico === undefined) {
      throw new Error("Numeric grade is required for exams with numeric grades");
    }
    if (grade.votoLettera !== undefined) {
      throw new Error("Letter grade is not applicable for exams with numeric grades");
    }
    // Allow any numeric grade from 0 to 30
    if (grade.votoNumerico !== undefined && (grade.votoNumerico < 0 || grade.votoNumerico > 30)) {
      throw new Error("Numeric grade must be between 0 and 30");
    }
  }
  
  // Check if student exists only if not allowing non-registered students
  if (!allowNonRegisteredStudents) {
    const students = getStudents();
    const student = students.find(s => s.matricola === grade.matricola);
    if (!student) {
      throw new Error("Student not found");
    }
  }
};

// Advanced queries
export const getStudentWithGrades = (matricola: string) => {
  const students = getStudents();
  const student = students.find(s => s.matricola === matricola);
  
  if (!student) {
    return null;
  }
  
  const grades = getGrades().filter(g => g.matricola === matricola);
  const exams = getExams();
  
  const gradesWithDetails = grades.map(grade => {
    const exam = exams.find(e => e.id === grade.examId);
    
    return {
      ...grade,
      exam: exam!
    };
  }).filter(g => g.exam); // Filter out any incomplete relations
  
  return {
    ...student,
    grades: gradesWithDetails
  };
};

// Import students from CSV formatted string
export const importStudentsFromCSV = (csv: string): Student[] => {
  const rows = csv.split('\n').filter(row => row.trim());
  
  // Skip header row if it exists
  const startIndex = rows[0].includes('matricola') || 
                    rows[0].includes('nome') || 
                    rows[0].includes('cognome') ? 1 : 0;
  
  const importedStudents: Student[] = [];
  const existingStudents = getStudents();
  const existingMatricole = new Set(existingStudents.map(s => s.matricola));
  
  for (let i = startIndex; i < rows.length; i++) {
    const columns = rows[i].split(',').map(col => col.trim());
    
    if (columns.length >= 3) {
      const matricola = columns[0];
      const nome = columns[1];
      const cognome = columns[2];
      
      // Skip if matricola already exists
      if (existingMatricole.has(matricola)) {
        continue;
      }
      
      // Basic validation
      if (matricola && nome && cognome) {
        const newStudent = addStudent({
          matricola,
          nome,
          cognome
        });
        
        importedStudents.push(newStudent);
        existingMatricole.add(matricola);
      }
    }
  }
  
  return importedStudents;
};

// Import grades from CSV
interface GradeImportOptions {
  csvData: string;
  examId: string;
  examType: ExamType;
  hasHeaderRow: boolean;
}

interface ImportResult {
  imported: number;
  errors: number;
}

export const importGradesFromCSV = (options: GradeImportOptions): ImportResult => {
  const { csvData, examId, hasHeaderRow } = options;
  const rows = csvData.split('\n').filter(row => row.trim());
  
  if (rows.length === 0) {
    return { imported: 0, errors: 0 };
  }
  
  // Skip header row if indicated
  const startIndex = hasHeaderRow ? 1 : 0;
  
  // Get the exam
  const exams = getExams();
  const exam = exams.find(e => e.id === examId);
  
  if (!exam) {
    throw new Error("Esame non trovato");
  }
  
  // Process each row
  let imported = 0;
  let errors = 0;
  
  for (let i = startIndex; i < rows.length; i++) {
    const columns = rows[i].split(',').map(col => col.trim());
    
    try {
      if (columns.length < 2) {
        errors++;
        console.error(`Riga ${i+1}: formato non valido (numero colonne insufficiente)`);
        continue;
      }
      
      const matricola = columns[0];
      
      if (exam.useLetterGrades) {
        // For letter grades
        const votoLettera = columns[1].toUpperCase();
        
        if (!['A', 'B', 'C', 'D', 'E', 'F'].includes(votoLettera)) {
          errors++;
          console.error(`Riga ${i+1}: voto in lettere non valido (${votoLettera}) per lo studente ${matricola}`);
          continue;
        }
        
        addGrade({
          matricola,
          examId: exam.id,
          votoLettera: votoLettera as LetterGrade
        });
      } else {
        // For numeric grades
        const votoNumerico = parseInt(columns[1]);
        
        if (isNaN(votoNumerico) || votoNumerico < 0 || votoNumerico > 30) {
          errors++;
          console.error(`Riga ${i+1}: voto numerico non valido (${columns[1]}) per lo studente ${matricola}`);
          continue;
        }
        
        addGrade({
          matricola,
          examId: exam.id,
          votoNumerico
        });
      }
      
      imported++;
    } catch (error) {
      errors++;
      console.error(`Errore nell'importazione della riga ${i+1}:`, error);
    }
  }
  
  return { imported, errors };
};

// Initialize with sample data if empty (without creating sample exams)
export const initializeSampleData = () => {
  // Clear all exams first
  clearAllExams();
  
  if (getStudents().length === 0) {
    // Sample students
    const students = [
      { matricola: "0612710901", nome: "Marco", cognome: "Rossi" },
      { matricola: "0612710902", nome: "Lucia", cognome: "Bianchi" },
      { matricola: "0612710903", nome: "Giovanni", cognome: "Verdi" },
    ];
    
    students.forEach(student => {
      try { addStudent(student); } catch(e) { /* ignore */ }
    });
  }
};
