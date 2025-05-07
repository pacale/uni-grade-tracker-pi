import { Exam, Grade, GradeStats, LetterGrade, Student, StudentWithGrades } from "@/types";
import { getExams, getGrades, getStudents } from "./dataStorage";

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
  if (grade.votoNumerico) {
    return grade.conLode ? `${grade.votoNumerico}L` : grade.votoNumerico.toString();
  }
  return '';
};

// Check if a grade indicates a passed exam
export const isPassing = (grade: Grade): boolean => {
  if (grade.votoLettera) {
    return grade.votoLettera !== 'F';
  }
  if (grade.votoNumerico) {
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
  let passing = 0;
  let failing = 0;
  const distribution: Record<string, number> = {};
  
  grades.forEach(grade => {
    // Calculate numeric value for average
    let numericValue = 0;
    let gradeKey = '';
    
    if (grade.votoLettera) {
      numericValue = letterToNumeric(grade.votoLettera);
      gradeKey = grade.votoLettera;
    } else if (grade.votoNumerico) {
      numericValue = grade.votoNumerico;
      gradeKey = grade.conLode ? `${grade.votoNumerico}L` : grade.votoNumerico.toString();
    }
    
    totalScore += numericValue;
    
    // Count passing/failing
    if (isPassing(grade)) {
      passing++;
    } else {
      failing++;
    }
    
    // Update distribution
    distribution[gradeKey] = (distribution[gradeKey] || 0) + 1;
  });
  
  return {
    average: parseFloat((totalScore / grades.length).toFixed(2)),
    passing,
    failing,
    passingPercentage: parseFloat(((passing / grades.length) * 100).toFixed(2)),
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
  
  grades.forEach(grade => {
    if (grade.votoLettera) {
      totalScore += letterToNumeric(grade.votoLettera);
    } else if (grade.votoNumerico) {
      totalScore += grade.votoNumerico;
    }
  });
  
  return parseFloat((totalScore / grades.length).toFixed(2));
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
export const getStudentRanking = (): StudentWithGrades[] => {
  const matricole = getUniqueMatricoleWithGrades();
  const students = getStudents();
  const exams = getExams();
  const grades = getGrades();
  
  const studentsWithGrades: StudentWithGrades[] = [];
  
  // Process each matricola (including those not in registered students)
  matricole.forEach(matricola => {
    // Find the student if registered
    const registeredStudent = students.find(s => s.matricola === matricola);
    
    // Get all grades for this student
    const studentGrades = grades.filter(g => g.matricola === matricola);
    
    // Convert to StudentWithGrades format
    const gradesWithExams = studentGrades.map(grade => {
      const exam = exams.find(e => e.id === grade.examId);
      return {
        ...grade,
        exam: exam!
      };
    }).filter(g => g.exam); // Filter out any incomplete relations
    
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
      // Calculate student average
      let totalScore = 0;
      student.grades.forEach(grade => {
        if (grade.votoLettera) {
          totalScore += letterToNumeric(grade.votoLettera);
        } else if (grade.votoNumerico) {
          totalScore += grade.votoNumerico;
        }
      });
      
      const average = student.grades.length > 0 ? 
        parseFloat((totalScore / student.grades.length).toFixed(2)) : 0;
      
      return {
        ...student,
        average
      };
    })
    .sort((a, b) => (b.average || 0) - (a.average || 0)); // Sort by average (highest first)
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
  
  // Exam statistics
  const examStats = exams.map(exam => {
    const stats = getExamStats(exam.id);
    return {
      id: exam.id,
      name: exam.nome,
      date: new Date(exam.data).toLocaleDateString(),
      stats: {
        average: stats.average,
        passing: stats.passing,
        failing: stats.failing,
        passingPercentage: stats.passingPercentage,
        distribution: stats.distribution,
        totalGrades: stats.gradeCount
      },
      gradeType: exam.useLetterGrades ? 'lettera' : 'numerica'
    };
  });
  
  // Recent exams
  const recentExams = [...exams]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5)
    .map(exam => {
      const stats = getExamStats(exam.id);
      return {
        id: exam.id,
        name: exam.nome,
        date: new Date(exam.data).toLocaleDateString(),
        stats: stats,
        grades: stats.gradeCount
      };
    });
  
  return {
    counts: {
      registeredStudents: students.length,
      uniqueStudentsWithGrades: uniqueMatricoleWithGrades.size,
      exams: exams.length,
      grades: filteredGrades.length
    },
    overallStats,
    examStats,
    recentExams
  };
};
