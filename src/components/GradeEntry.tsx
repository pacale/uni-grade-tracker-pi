
import { useState, useEffect } from "react";
import { 
  Course, 
  Exam, 
  ExamType, 
  Grade, 
  LetterGrade, 
  Student 
} from "@/types";
import { 
  getCourses, 
  getExams, 
  getStudents,
  addGrade
} from "@/utils/dataStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface GradeEntryProps {
  onComplete: () => void;
}

interface FormData {
  examId: string;
  studentId: string;
  letterGrade?: string;
  numericGrade?: number;
  conLode?: boolean;
}

const GradeEntry = ({ onComplete }: GradeEntryProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  const form = useForm<FormData>({
    defaultValues: {
      conLode: false
    }
  });
  
  const { watch, setValue } = form;
  
  const watchExamId = watch('examId');
  
  useEffect(() => {
    // Load data
    setCourses(getCourses());
    setStudents(getStudents());
    setExams(getExams());
  }, []);
  
  // Update selected exam when examId changes
  useEffect(() => {
    if (watchExamId) {
      const exam = exams.find(e => e.id === watchExamId) || null;
      setSelectedExam(exam);
      
      if (exam) {
        const course = courses.find(c => c.id === exam.courseId) || null;
        setSelectedCourse(course);
      } else {
        setSelectedCourse(null);
      }
    } else {
      setSelectedExam(null);
      setSelectedCourse(null);
    }
  }, [watchExamId, exams, courses]);
  
  const onSubmit = async (data: FormData) => {
    try {
      // Find the selected student
      const student = students.find(s => s.id === data.studentId);
      if (!student) {
        toast.error("Studente non trovato");
        return;
      }
      
      if (!selectedExam) {
        toast.error("Esame non selezionato");
        return;
      }
      
      // Create the grade
      const gradeData: Partial<Grade> = {
        matricola: student.matricola,
        examId: data.examId
      };
      
      // Add the appropriate grade type based on course settings
      if (selectedCourse?.haIntermedio) {
        gradeData.votoLettera = data.letterGrade as LetterGrade;
      } else {
        gradeData.votoNumerico = data.numericGrade;
        gradeData.conLode = data.conLode;
      }
      
      // Validate grade data
      if (selectedCourse?.haIntermedio && !gradeData.votoLettera) {
        toast.error("Il voto in lettere è obbligatorio");
        return;
      }
      
      if (!selectedCourse?.haIntermedio && !gradeData.votoNumerico) {
        toast.error("Il voto numerico è obbligatorio");
        return;
      }
      
      // Save the grade
      addGrade(gradeData as Omit<Grade, "id">);
      toast.success("Voto salvato con successo");
      onComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore durante il salvataggio");
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="examId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Esame</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un esame" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {exams.map((exam) => {
                      const course = courses.find(c => c.id === exam.courseId);
                      const formattedDate = new Date(exam.data).toLocaleDateString();
                      return (
                        <SelectItem key={exam.id} value={exam.id}>
                          {course?.nome || "Corso sconosciuto"} - {formattedDate}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Studente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona uno studente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.matricola} - {student.cognome} {student.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Grade fields based on course type */}
          {selectedCourse?.haIntermedio ? (
            <FormField
              control={form.control}
              name="letterGrade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voto (lettera)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un voto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A">A (Eccellente)</SelectItem>
                      <SelectItem value="B">B (Buono)</SelectItem>
                      <SelectItem value="C">C (Discreto)</SelectItem>
                      <SelectItem value="D">D (Sufficiente)</SelectItem>
                      <SelectItem value="E">E (Appena sufficiente)</SelectItem>
                      <SelectItem value="F">F (Insufficiente)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="numericGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voto (numerico)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={18} 
                        max={30} 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)} 
                      />
                    </FormControl>
                    <FormDescription>Il voto deve essere compreso tra 18 e 30</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="conLode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                        disabled={form.watch('numericGrade') !== 30}
                      />
                    </FormControl>
                    <FormLabel>Con lode</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onComplete}
          >
            Annulla
          </Button>
          <Button type="submit">
            Salva voto
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default GradeEntry;
