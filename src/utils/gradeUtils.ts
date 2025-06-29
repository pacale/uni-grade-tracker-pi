
import { Exam, Grade, GradeStats, LetterGrade, Student, StudentWithGrades, ExamWithStats } from "@/types";
import { getExams, getGrades, getStudents } from "./dataService";

// Convert letter grade to numeric equivalent for calculations
export const letterToNumeric = (letter: LetterGrade): number => {
  const mapping: Record<LetterGrade, number> = {
    'A': 30,
    'B': 28, // 28-29 = B (using average 28.5)
    'C': 26, // 25-27 = C (using average 26)
    'D': 23, // 22-24 = D (using average 23)
    'E': 19, // 18-21 = E (using average 19.5)
    'F': 0
  };
  return mapping[letter];
};

// Convert numeric grade to letter equivalent
export const numericToLetter = (numeric: number): LetterGrade => {
  if (numeric === 30) return 'A';
  if (numeric >= 28 && numeric <= 29) return 'B';
  if (numeric >= 25 && numeric <= 27) return 'C';
  if (numeric >= 22 && numeric <= 24) return 'D';
  if (numeric >= 18 && numeric <= 21) return 'E';
  return 'F';
};

// Format grade for display
export const formatGrade = (grade: Grade): string => {
  if (grade.votoLettera) {
    return grade.votoLettera;
  }
  if (grade.votoNumerico !== undefined) {
    return grade.votoNumerico.toString();
  }
  return '';
};

// Check if a grade indicates a passed exam
export const isPassing = (grade: Grade): boolean => {
  if (grade.votoLettera) {
    return grade.votoLettera !== 'F';
  }
  if (grade.votoNumerico !== undefined) {
    return grade.votoNumerico >= 18;
  }
  return false;
};

// Calculate statistics for a set of grades
export const calculateStats = (grades: Grade[]): GradeStats => {
  if (grades.length === 0) {
    return {
      average: 0,
      passing: 0,
      failing: 0,
      passingPercentage: 0,
      distribution: {}
    };
  }
  
  let totalScore = 0;
  let passingCount = 0;
  let failing = 0;
  const distribution: Record<string, number> = {};
  
  grades.forEach(grade => {
    // Calculate numeric value for average
    let numericValue = 0;
    let gradeKey = '';
    let isPassed = false;
    
    if (grade.votoLettera) {
      numericValue = letterToNumeric(grade.votoLettera);
      gradeKey = grade.votoLettera;
      isPassed = grade.votoLettera !== 'F';
    } else if (grade.votoNumerico !== undefined) {
      numericValue = grade.votoNumerico;
      gradeKey = grade.votoNumerico.toString();
      // Only grades >= 18 are considered passing
      isPassed = grade.votoNumerico >= 18;
    }
    
    // Count passing/failing and only include passing grades in average
    if (isPassed) {
      totalScore += numericValue;
      passingCount++;
    } else {
      failing++;
    }
    
    // Update distribution
    distribution[gradeKey] = (distribution[gradeKey] || 0) + 1;
  });
  
  // Calculate average only from passing grades (18 or above)
  const average = passingCount > 0 ? parseFloat((totalScore / passingCount).toFixed(2)) : 0;
  
  return {
    average,
    passing: passingCount,
    failing,
    passingPercentage: grades.length > 0 ? parseFloat(((passingCount / grades.length) * 100).toFixed(2)) : 0,
    distribution
  };
};

// Calculate statistics for an exam
export const getExamStats = (examId: string): GradeStats & { gradeCount: number } => {
  const examGrades = getGrades().filter(g => g.examId === examId);
  return {
    ...calculateStats(examGrades),
    gradeCount: examGrades.length
  };
};

// Get all grades for a student
export const getStudentGrades = (matricola: string) => {
  const grades = getGrades().filter(g => g.matricola === matricola);
  const exams = getExams();
  
  return grades.map(grade => {
    const exam = exams.find(e => e.id === grade.examId);
    
    return {
      ...grade,
      examType: exam?.tipo || '',
      examDate: exam?.data || '',
      examName: exam?.nome || ''
    };
  });
};

// Calculate average grade for a student
export const getStudentAverage = (matricola: string): number => {
  const grades = getGrades().filter(g => g.matricola === matricola);
  
  if (grades.length === 0) {
    return 0;
  }
  
  let totalScore = 0;
  let passingCount = 0;
  
  grades.forEach(grade => {
    // Only include passing grades in the average (18 or above)
    if (grade.votoLettera) {
      if (grade.votoLettera !== 'F') {
        totalScore += letterToNumeric(grade.votoLettera);
        passingCount++;
      }
    } else if (grade.votoNumerico !== undefined && grade.votoNumerico >= 18) {
      totalScore += grade.votoNumerico;
      passingCount++;
    }
  });
  
  return passingCount > 0 ? parseFloat((totalScore / passingCount).toFixed(2)) : 0;
};

// Get unique matricole with grades, regardless of being registered
export const getUniqueMatricoleWithGrades = (): string[] => {
  const grades = getGrades();
  const uniqueMatricole = new Set<string>();
  
  grades.forEach(grade => {
    uniqueMatricole.add(grade.matricola);
  });
  
  return Array.from(uniqueMatricole);
};

// Get student ranking based on average grades
export const getStudentRanking = (examId?: string): StudentWithGrades[] => {
  const matricole = getUniqueMatricoleWithGrades();
  const students = getStudents();
  const exams = getExams();
  const grades = getGrades();
  
  // If no grades exist at all, return empty array
  if (grades.length === 0) {
    return [];
  }
  
  const studentsWithGrades: StudentWithGrades[] = [];
  
  // Process each matricola (including those not in registered students)
  matricole.forEach(matricola => {
    // Find the student if registered
    const registeredStudent = students.find(s => s.matricola === matricola);
    
    // Get grades for this student, filtered by examId if provided
    const studentGrades = examId 
      ? grades.filter(g => g.matricola === matricola && g.examId === examId)
      : grades.filter(g => g.matricola === matricola);
    
    // Skip if no grades for this student (when filtered by examId)
    if (studentGrades.length === 0) {
      return;
    }
    
    // Convert to StudentWithGrades format
    const gradesWithExams = studentGrades.map(grade => {
      const exam = exams.find(e => e.id === grade.examId);
      if (!exam) return null;
      
      return {
        ...grade,
        exam
      };
    }).filter(Boolean) as (Grade & { exam: Exam })[];
    
    // Only include students who have at least one grade
    if (gradesWithExams.length === 0) {
      return;
    }
    
    // Create StudentWithGrades object
    const studentWithGrades: StudentWithGrades = {
      id: registeredStudent?.id || `unregistered-${matricola}`,
      matricola,
      nome: registeredStudent?.nome || "Non registrato",
      cognome: registeredStudent?.cognome || matricola,
      grades: gradesWithExams
    };
    
    studentsWithGrades.push(studentWithGrades);
  });
  
  // Calculate average for each student and sort
  return studentsWithGrades
    .map(student => {
      if (examId) {
        // For single exam, sort by the actual grade (not average)
        const singleExamGrade = student.grades.find(g => g.examId === examId);
        let gradeValue = 0;
        
        if (singleExamGrade) {
          if (singleExamGrade.votoLettera) {
            gradeValue = letterToNumeric(singleExamGrade.votoLettera);
          } else if (singleExamGrade.votoNumerico !== undefined) {
            gradeValue = singleExamGrade.votoNumerico;
          }
        }
        
        return {
          ...student,
          average: gradeValue
        };
      } else {
        // For all exams, calculate average (only passing grades)
        let totalScore = 0;
        let passingCount = 0;
        
        student.grades.forEach(grade => {
          // Only include passing grades (18 or above) in the average calculation
          if (grade.votoLettera && grade.votoLettera !== 'F') {
            totalScore += letterToNumeric(grade.votoLettera);
            passingCount++;
          } else if (grade.votoNumerico !== undefined && grade.votoNumerico >= 18) {
            totalScore += grade.votoNumerico;
            passingCount++;
          }
        });
        
        const average = passingCount > 0 ? 
          parseFloat((totalScore / passingCount).toFixed(2)) : 0;
        
        return {
          ...student,
          average
        };
      }
    })
    // Only include students with valid averages (> 0) in the ranking
    .filter(student => student.average > 0)
    .sort((a, b) => (b.average || 0) - (a.average || 0)); // Sort by average (highest first)
};

// Get exam ranking based on average grades
export const getExamRanking = (): ExamWithStats[] => {
  const exams = getExams();
  const grades = getGrades();
  
  const examsWithStats: ExamWithStats[] = [];
  
  // Process each exam
  exams.forEach(exam => {
    // Get all grades for this exam
    const examGrades = grades.filter(g => g.examId === exam.id);
    
    // Calculate statistics
    const stats = calculateStats(examGrades);
    
    // Count unique students for this exam
    const uniqueStudents = new Set(examGrades.map(g => g.matricola)).size;
    
    // Create ExamWithStats object
    const examWithStats: ExamWithStats = {
      ...exam,
      stats,
      studentCount: uniqueStudents
    };
    
    examsWithStats.push(examWithStats);
  });
  
  // Sort by average (highest first)
  return examsWithStats.sort((a, b) => b.stats.average - a.stats.average);
};

// Get analytics data for dashboard
export const getDashboardAnalytics = (examId?: string) => {
  const students = getStudents();
  const exams = getExams();
  const grades = getGrades();
  
  // Filter grades by exam if specified
  const filteredGrades = examId ? 
    grades.filter(g => g.examId === examId) : 
    grades;
  
  // Get unique matricole with grades (including those not registered)
  const uniqueMatricoleWithGrades = new Set<string>();
  filteredGrades.forEach(grade => {
    uniqueMatricoleWithGrades.add(grade.matricola);
  });
  
  // Overall statistics
  const overallStats = calculateStats(filteredGrades);
  
  return {
    counts: {
      registeredStudents: students.length,
      uniqueStudentsWithGrades: uniqueMatricoleWithGrades.size,
      exams: exams.length,
      grades: filteredGrades.length
    },
    overallStats
  };
};

// Get global student ranking across all exams
export const getGlobalStudentRanking = (): StudentWithGrades[] => {
  return getStudentRanking();
};
