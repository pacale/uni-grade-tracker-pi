
import { useState, useEffect } from "react";
import { Course, Exam, Student } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getCourses, getExams, importGradesFromCSV } from "@/utils/dataStorage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText } from "lucide-react";

interface GradeImportProps {
  onComplete: () => void;
}

const GradeImport = ({ onComplete }: GradeImportProps) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [csvData, setCsvData] = useState("");
  const [examId, setExamId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [hasHeaderRow, setHasHeaderRow] = useState(true);

  useEffect(() => {
    // Load courses and exams
    setCourses(getCourses());
    setExams(getExams());
  }, []);
  
  // Update selected exam and course when examId changes
  useEffect(() => {
    if (examId) {
      const exam = exams.find(e => e.id === examId) || null;
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
  }, [examId, exams, courses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validation
      if (!examId) {
        toast.error("Seleziona un esame");
        setIsSubmitting(false);
        return;
      }
      
      if (!csvData.trim()) {
        toast.error("Inserisci i dati CSV");
        setIsSubmitting(false);
        return;
      }
      
      if (!selectedExam) {
        toast.error("Esame non trovato");
        setIsSubmitting(false);
        return;
      }
      
      // Import grades
      const result = importGradesFromCSV({
        csvData,
        courseId: selectedExam.courseId,
        examId: selectedExam.id,
        examType: selectedExam.tipo,
        hasHeaderRow
      });
      
      if (result.imported === 0) {
        toast.info("Nessun voto importato. Verifica il formato del file CSV e assicurati che le matricole esistano.");
      } else {
        toast.success(`Importati ${result.imported} voti con successo`);
        
        if (result.errors > 0) {
          toast.warning(`${result.errors} voti non importati a causa di errori. Verifica le matricole o il formato.`);
        }
        
        onComplete();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore durante l'importazione");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="examId">Esame</Label>
          <Select value={examId} onValueChange={setExamId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona un esame" />
            </SelectTrigger>
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
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="hasHeaderRow"
            checked={hasHeaderRow}
            onCheckedChange={(checked) => setHasHeaderRow(!!checked)}
          />
          <Label htmlFor="hasHeaderRow">Il CSV contiene una riga di intestazione</Label>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="csvData" className="flex items-center gap-2">
            <FileText size={16} />
            Dati CSV
          </Label>
          <textarea
            id="csvData"
            className="w-full h-40 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={
              selectedCourse?.haIntermedio
                ? "matricola,voto\n0612710900,A\n0612710901,B"
                : "matricola,voto,lode\n0612710900,30,true\n0612710901,28,false"
            }
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
          />

          <div className="text-sm text-muted-foreground">
            <p className="font-medium">Formato richiesto:</p>
            {selectedCourse?.haIntermedio ? (
              <ul className="list-disc pl-5 space-y-1">
                <li><code>matricola</code>: La matricola dello studente (obbligatorio)</li>
                <li><code>voto</code>: Voto letterale da A a F (obbligatorio)</li>
              </ul>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                <li><code>matricola</code>: La matricola dello studente (obbligatorio)</li>
                <li><code>voto</code>: Voto numerico da 18 a 30 (obbligatorio)</li>
                <li><code>lode</code>: true/false se il voto è con lode (opzionale)</li>
              </ul>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onComplete}
        >
          Annulla
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
        >
          <Upload className="mr-2" size={16} />
          Importa Voti
        </Button>
      </div>
    </form>
  );
};

export default GradeImport;
