import { supabase } from "@/integrations/supabase/client";
import { Student, Exam, Grade, LetterGrade, ExamType } from "@/types";

// Helper to convert database rows to app types
const convertDbStudentToApp = (dbStudent: any): Student => ({
  id: dbStudent.id,
  matricola: dbStudent.matricola,
  nome: dbStudent.nome,
  cognome: dbStudent.cognome
});

const convertDbExamToApp = (dbExam: any): Exam => ({
  id: dbExam.id,
  nome: dbExam.nome,
  tipo: dbExam.tipo as ExamType,
  data: dbExam.data,
  useLetterGrades: dbExam.use_letter_grades
});

const convertDbGradeToApp = (dbGrade: any): Grade => ({
  id: dbGrade.id,
  matricola: dbGrade.matricola,
  examId: dbGrade.exam_id,
  votoLettera: dbGrade.voto_lettera as LetterGrade,
  votoNumerico: dbGrade.voto_numerico
});

// Students operations
export const getStudents = async (): Promise<Student[]> => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('cognome', { ascending: true });
  
  if (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
  
  return data?.map(convertDbStudentToApp) || [];
};

export const addStudent = async (student: Omit<Student, "id">): Promise<Student> => {
  // Check for duplicate matricola
  const { data: existing } = await supabase
    .from('students')
    .select('id')
    .eq('matricola', student.matricola)
    .single();
  
  if (existing) {
    throw new Error("Matricola already exists");
  }
  
  const { data, error } = await supabase
    .from('students')
    .insert({
      matricola: student.matricola,
      nome: student.nome,
      cognome: student.cognome
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding student:', error);
    throw error;
  }
  
  return convertDbStudentToApp(data);
};

export const updateStudent = async (student: Student): Promise<Student> => {
  // Check for duplicate matricola (excluding current student)
  const { data: existing } = await supabase
    .from('students')
    .select('id')
    .eq('matricola', student.matricola)
    .neq('id', student.id)
    .single();
  
  if (existing) {
    throw new Error("Matricola already exists");
  }
  
  const { data, error } = await supabase
    .from('students')
    .update({
      matricola: student.matricola,
      nome: student.nome,
      cognome: student.cognome
    })
    .eq('id', student.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating student:', error);
    throw error;
  }
  
  return convertDbStudentToApp(data);
};

export const deleteStudent = async (id: string): Promise<void> => {
  // Get student to find matricola
  const { data: student } = await supabase
    .from('students')
    .select('matricola')
    .eq('id', id)
    .single();
  
  if (student) {
    // Delete related grades first
    await supabase
      .from('grades')
      .delete()
      .eq('matricola', student.matricola);
  }
  
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
};

// Exams operations
export const getExams = async (): Promise<Exam[]> => {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .order('data', { ascending: false });
  
  if (error) {
    console.error('Error fetching exams:', error);
    throw error;
  }
  
  return data?.map(convertDbExamToApp) || [];
};

export const addExam = async (exam: Omit<Exam, "id">): Promise<Exam> => {
  const { data, error } = await supabase
    .from('exams')
    .insert({
      nome: exam.nome,
      tipo: exam.tipo,
      data: exam.data,
      use_letter_grades: exam.useLetterGrades
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding exam:', error);
    throw error;
  }
  
  return convertDbExamToApp(data);
};

export const updateExam = async (exam: Exam): Promise<Exam> => {
  const { data, error } = await supabase
    .from('exams')
    .update({
      nome: exam.nome,
      tipo: exam.tipo,
      data: exam.data,
      use_letter_grades: exam.useLetterGrades
    })
    .eq('id', exam.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating exam:', error);
    throw error;
  }
  
  return convertDbExamToApp(data);
};

export const deleteExam = async (id: string): Promise<void> => {
  // Delete related grades first (handled by CASCADE)
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting exam:', error);
    throw error;
  }
};

// Grades operations
export const getGrades = async (): Promise<Grade[]> => {
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching grades:', error);
    throw error;
  }
  
  return data?.map(convertDbGradeToApp) || [];
};

export const addGrade = async (grade: Omit<Grade, "id">): Promise<Grade> => {
  const { data, error } = await supabase
    .from('grades')
    .insert({
      matricola: grade.matricola,
      exam_id: grade.examId,
      voto_lettera: grade.votoLettera || null,
      voto_numerico: grade.votoNumerico || null
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding grade:', error);
    throw error;
  }
  
  return convertDbGradeToApp(data);
};

export const updateGrade = async (grade: Grade): Promise<Grade> => {
  const { data, error } = await supabase
    .from('grades')
    .update({
      matricola: grade.matricola,
      exam_id: grade.examId,
      voto_lettera: grade.votoLettera || null,
      voto_numerico: grade.votoNumerico || null
    })
    .eq('id', grade.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating grade:', error);
    throw error;
  }
  
  return convertDbGradeToApp(data);
};

export const deleteGrade = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('grades')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting grade:', error);
    throw error;
  }
};

// Advanced queries
export const getStudentWithGrades = async (matricola: string) => {
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('matricola', matricola)
    .single();
  
  if (studentError || !student) {
    return null;
  }
  
  const { data: grades, error: gradesError } = await supabase
    .from('grades')
    .select(`
      *,
      exams:exam_id (*)
    `)
    .eq('matricola', matricola);
  
  if (gradesError) {
    console.error('Error fetching student grades:', gradesError);
    return convertDbStudentToApp(student);
  }
  
  const gradesWithDetails = grades?.map(grade => ({
    ...convertDbGradeToApp(grade),
    exam: convertDbExamToApp(grade.exams)
  })) || [];
  
  return {
    ...convertDbStudentToApp(student),
    grades: gradesWithDetails
  };
};

// Import functions
export const importStudentsFromCSV = async (csv: string): Promise<Student[]> => {
  const rows = csv.split('\n').filter(row => row.trim());
  
  const startIndex = rows[0].includes('matricola') || 
                    rows[0].includes('nome') || 
                    rows[0].includes('cognome') ? 1 : 0;
  
  const importedStudents: Student[] = [];
  
  for (let i = startIndex; i < rows.length; i++) {
    const columns = rows[i].split(',').map(col => col.trim());
    
    if (columns.length >= 3) {
      const matricola = columns[0];
      const nome = columns[1];
      const cognome = columns[2];
      
      if (matricola && nome && cognome) {
        try {
          const newStudent = await addStudent({
            matricola,
            nome,
            cognome
          });
          importedStudents.push(newStudent);
        } catch (error) {
          console.error(`Error importing student ${matricola}:`, error);
        }
      }
    }
  }
  
  return importedStudents;
};

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

export const importGradesFromCSV = async (options: GradeImportOptions): Promise<ImportResult> => {
  const { csvData, examId, hasHeaderRow } = options;
  const rows = csvData.split('\n').filter(row => row.trim());
  
  if (rows.length === 0) {
    return { imported: 0, errors: 0 };
  }
  
  const startIndex = hasHeaderRow ? 1 : 0;
  
  // Get the exam
  const exams = await getExams();
  const exam = exams.find(e => e.id === examId);
  
  if (!exam) {
    throw new Error("Esame non trovato");
  }
  
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
        const votoLettera = columns[1].toUpperCase();
        
        if (!['A', 'B', 'C', 'D', 'E', 'F'].includes(votoLettera)) {
          errors++;
          console.error(`Riga ${i+1}: voto in lettere non valido (${votoLettera}) per lo studente ${matricola}`);
          continue;
        }
        
        await addGrade({
          matricola,
          examId: exam.id,
          votoLettera: votoLettera as LetterGrade
        });
      } else {
        const votoNumerico = parseInt(columns[1]);
        
        if (isNaN(votoNumerico) || votoNumerico < 0 || votoNumerico > 30) {
          errors++;
          console.error(`Riga ${i+1}: voto numerico non valido (${columns[1]}) per lo studente ${matricola}`);
          continue;
        }
        
        await addGrade({
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

// Initialize with sample data if needed
export const initializeSampleData = async () => {
  const students = await getStudents();
  const exams = await getExams();
  
  if (students.length === 0 && exams.length === 0) {
    // Sample students
    const sampleStudents = [
      { matricola: "0612710901", nome: "Marco", cognome: "Rossi" },
      { matricola: "0612710902", nome: "Lucia", cognome: "Bianchi" },
      { matricola: "0612710903", nome: "Giovanni", cognome: "Verdi" },
    ];
    
    const createdStudents = [];
    for (const student of sampleStudents) {
      try {
        const newStudent = await addStudent(student);
        createdStudents.push(newStudent);
      } catch (e) {
        console.error('Error creating sample student:', e);
      }
    }
    
    // Sample exams
    const sampleExams = [
      { nome: "Programmazione - Prova finale", tipo: "completo" as ExamType, data: new Date().toISOString().split('T')[0], useLetterGrades: true },
      { nome: "Matematica Discreta - Primo appello", tipo: "completo" as ExamType, data: new Date().toISOString().split('T')[0], useLetterGrades: true },
      { nome: "Fisica - Computo finale", tipo: "completo" as ExamType, data: new Date().toISOString().split('T')[0], useLetterGrades: false },
    ];
    
    const createdExams = [];
    for (const exam of sampleExams) {
      try {
        const newExam = await addExam(exam);
        createdExams.push(newExam);
      } catch (e) {
        console.error('Error creating sample exam:', e);
      }
    }
    
    // Add sample grades
    if (createdExams.length > 0 && createdStudents.length > 0) {
      for (const exam of createdExams) {
        for (let i = 0; i < createdStudents.length; i++) {
          const student = createdStudents[i];
          try {
            if (exam.useLetterGrades) {
              const letterGrades: LetterGrade[] = ['A', 'B', 'C', 'D', 'E', 'F'];
              await addGrade({
                matricola: student.matricola,
                examId: exam.id,
                votoLettera: letterGrades[i % letterGrades.length]
              });
            } else {
              const baseGrade = 18 + (i * 3);
              const grade = Math.min(baseGrade, 30);
              
              await addGrade({
                matricola: student.matricola,
                examId: exam.id,
                votoNumerico: grade
              });
            }
          } catch (e) {
            console.error('Error creating sample grade:', e);
          }
        }
      }
    }
  }
};

// Stubs for compatibility
export const addCourse = (course: any) => {
  console.warn("addCourse is not implemented");
  return null;
};

export const updateCourse = (course: any) => {
  console.warn("updateCourse is not implemented");
  return null;
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// For backward compatibility, keep the old localStorage functions but mark them as deprecated
export const setStudents = (students: Student[]): void => {
  console.warn("setStudents is deprecated, use Supabase operations instead");
};

export const setExams = (exams: Exam[]): void => {
  console.warn("setExams is deprecated, use Supabase operations instead");
};

export const setGrades = (grades: Grade[]): void => {
  console.warn("setGrades is deprecated, use Supabase operations instead");
};
