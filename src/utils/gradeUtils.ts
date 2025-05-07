
import { Course, Exam, Grade, GradeStats, LetterGrade } from "@/types";
import { getCourses, getExams, getGrades, getStudents } from "./dataStorage";

// Convert letter grade to numeric equivalent for calculations
export const letterToNumeric = (letter: LetterGrade): number => {
  const mapping: Record<LetterGrade, number> = {
    'A': 30,
    'B': 27,
    'C': 24,
    'D': 21,
    'E': 18,
    'F': 0
  };
  return mapping[letter];
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

// Calculate statistics for a course
export const getCourseStats = (courseId: string): GradeStats => {
  const exams = getExams().filter(e => e.courseId === courseId);
  const examIds = exams.map(e => e.id);
  const courseGrades = getGrades().filter(g => examIds.includes(g.examId));
  return calculateStats(courseGrades);
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
  const courses = getCourses();
  
  return grades.map(grade => {
    const exam = exams.find(e => e.id === grade.examId);
    const course = exam ? courses.find(c => c.id === exam.courseId) : undefined;
    
    return {
      ...grade,
      examType: exam?.tipo || '',
      examDate: exam?.data || '',
      courseName: course?.nome || ''
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

// Get analytics data for dashboard
export const getDashboardAnalytics = () => {
  const students = getStudents();
  const courses = getCourses();
  const exams = getExams();
  const grades = getGrades();
  
  // Get unique matricole with grades (including those not registered)
  const uniqueMatricoleWithGrades = getUniqueMatricoleWithGrades();
  
  // Overall statistics
  const overallStats = calculateStats(grades);
  
  // Course statistics - group by courseId
  const courseStatsMap = new Map();
  exams.forEach(exam => {
    const examStats = getExamStats(exam.id);
    const course = courses.find(c => c.id === exam.courseId);
    
    if (course) {
      if (!courseStatsMap.has(course.id)) {
        courseStatsMap.set(course.id, {
          id: course.id,
          name: course.nome,
          stats: {
            average: 0,
            passing: 0,
            failing: 0,
            passingPercentage: 0,
            distribution: {},
            totalGrades: 0
          }
        });
      }
      
      const currentCourseStats = courseStatsMap.get(course.id);
      const currentTotal = currentCourseStats.stats.totalGrades;
      const newTotal = currentTotal + examStats.gradeCount;
      
      // Weighted average calculation
      if (newTotal > 0) {
        currentCourseStats.stats.average = 
          (currentCourseStats.stats.average * currentTotal + examStats.average * examStats.gradeCount) / newTotal;
        
        // Update passing rate
        currentCourseStats.stats.passing += examStats.passing;
        currentCourseStats.stats.failing += examStats.failing;
        currentCourseStats.stats.totalGrades = newTotal;
        currentCourseStats.stats.passingPercentage = 
          (currentCourseStats.stats.passing / newTotal) * 100;
      }
    }
  });
  
  // Recent exams
  const recentExams = [...exams]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5)
    .map(exam => {
      const course = courses.find(c => c.id === exam.courseId);
      const stats = getExamStats(exam.id);
      return {
        id: exam.id,
        date: new Date(exam.data).toLocaleDateString(),
        courseName: course?.nome || 'Corso sconosciuto',
        stats: stats,
        grades: stats.gradeCount
      };
    });
  
  return {
    counts: {
      registeredStudents: students.length,
      uniqueStudentsWithGrades: uniqueMatricoleWithGrades.length,
      courses: courses.length,
      exams: exams.length,
      grades: grades.length
    },
    overallStats,
    courseStats: Array.from(courseStatsMap.values()).map(course => {
      return {
        id: course.id,
        name: course.name,
        stats: {
          average: parseFloat(course.stats.average.toFixed(2)),
          passing: course.stats.passing,
          failing: course.stats.failing,
          passingPercentage: parseFloat(course.stats.passingPercentage.toFixed(2)),
          distribution: course.stats.distribution,
          totalGrades: course.stats.totalGrades
        }
      };
    }),
    recentExams
  };
};
