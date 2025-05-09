
import { useState, useEffect } from "react";
import { 
  Exam, 
  ExamType, 
  Grade, 
  LetterGrade, 
  Student 
} from "@/types";
import { 
  getExams, 
  getStudents,
  addGrade,
  addExam
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
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface GradeEntryProps {
  onComplete: () => void;
  enableExamCreation?: boolean;
}

interface FormData {
  examId: string;
  studentId: string;
  letterGrade?: string;
  numericGrade?: number;
}

const newExamFormSchema = z.object({
  nome: z.string().min(1, "Il nome è richiesto"),
  data: z.string().min(1, "La data è richiesta"),
  tipo: z.enum(["completo", "intermedio"]),
  useLetterGrades: z.boolean().default(false)
});

type NewExamFormData = z.infer<typeof newExamFormSchema>;

const GradeEntry = ({ onComplete, enableExamCreation = false }: GradeEntryProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showNewExamDialog, setShowNewExamDialog] = useState(false);
  
  const form = useForm<FormData>({
    defaultValues: {
      numericGrade: undefined
    }
  });
  
  const newExamForm = useForm<NewExamFormData>({
    resolver: zodResolver(newExamFormSchema),
    defaultValues: {
      nome: "",
      data: new Date().toISOString().split('T')[0],
      tipo: "completo",
      useLetterGrades: false
    }
  });
  
  const { watch, setValue } = form;
  
  const watchExamId = watch('examId');
  const watchNumericGrade = watch('numericGrade');
  
  useEffect(() => {
    // Load data
    setStudents(getStudents());
    setExams(getExams());
  }, []);
  
  // Update selected exam when examId changes
  useEffect(() => {
    if (watchExamId) {
      const exam = exams.find(e => e.id === watchExamId) || null;
      setSelectedExam(exam);
    } else {
      setSelectedExam(null);
    }
  }, [watchExamId, exams]);
  
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
      
      // Add the appropriate grade type based on exam settings
      if (selectedExam.useLetterGrades) {
        gradeData.votoLettera = data.letterGrade as LetterGrade;
      } else {
        gradeData.votoNumerico = data.numericGrade;
        // Removed lode option
      }
      
      // Validate grade data
      if (selectedExam.useLetterGrades && !gradeData.votoLettera) {
        toast.error("Il voto in lettere è obbligatorio");
        return;
      }
      
      if (!selectedExam.useLetterGrades && gradeData.votoNumerico === undefined) {
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

  const handleAddExam = async (formData: NewExamFormData) => {
    try {
      // Fix: Ensure all required fields are present
      const newExamData: Omit<Exam, "id"> = {
        nome: formData.nome,
        tipo: formData.tipo,
        data: formData.data,
        useLetterGrades: formData.useLetterGrades
      };
      
      const newExam = addExam(newExamData);
      setExams(prev => [...prev, newExam]);
      setValue("examId", newExam.id);
      setShowNewExamDialog(false);
      toast.success("Esame creato con successo");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore durante la creazione dell'esame");
    }
  };
  
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="examId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Esame</FormLabel>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona un esame" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {exams.map((exam) => {
                            const formattedDate = new Date(exam.data).toLocaleDateString();
                            return (
                              <SelectItem key={exam.id} value={exam.id}>
                                {exam.nome} - {formattedDate}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    {enableExamCreation && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => setShowNewExamDialog(true)}
                      >
                        <Plus size={18} />
                      </Button>
                    )}
                  </div>
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

            {/* Grade fields based on exam type */}
            {selectedExam?.useLetterGrades ? (
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
                        <SelectItem value="A">A (Eccellente - 30)</SelectItem>
                        <SelectItem value="B">B (Buono - 28/29)</SelectItem>
                        <SelectItem value="C">C (Discreto - 25/27)</SelectItem>
                        <SelectItem value="D">D (Sufficiente - 22/24)</SelectItem>
                        <SelectItem value="E">E (Appena sufficiente - 18/21)</SelectItem>
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
                          min={0} 
                          max={30} 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)} 
                        />
                      </FormControl>
                      <FormDescription>
                        I voti sotto il 18 saranno conteggiati come insufficienti, non inclusi nella media
                      </FormDescription>
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

      {/* New Exam Dialog */}
      <Dialog open={showNewExamDialog} onOpenChange={setShowNewExamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Esame</DialogTitle>
            <DialogDescription>
              Crea un nuovo esame per registrare i voti
            </DialogDescription>
          </DialogHeader>
          
          <Form {...newExamForm}>
            <form onSubmit={newExamForm.handleSubmit(handleAddExam)} className="space-y-4">
              <FormField
                control={newExamForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome dell'esame</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newExamForm.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data dell'esame</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newExamForm.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo di esame</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona il tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="completo">Completo</SelectItem>
                        <SelectItem value="intermedio">Intermedio</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newExamForm.control}
                name="useLetterGrades"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Utilizza voti in lettere</FormLabel>
                      <FormDescription>
                        Altrimenti verranno utilizzati voti numerici (0-30)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowNewExamDialog(false)}
                >
                  Annulla
                </Button>
                <Button type="submit">Crea Esame</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GradeEntry;
