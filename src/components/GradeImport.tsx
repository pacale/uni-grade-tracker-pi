import { useState, useEffect } from "react";
import { Exam } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getExams, importGradesFromCSV } from "@/utils/dataService";
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
  const [csvData, setCsvData] = useState("");
  const [examId, setExamId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExams = () => {
      try {
        setLoading(true);
        const examsData = getExams();
        setExams(examsData);
      } catch (error) {
        console.error('Error loading exams:', error);
        toast.error("Errore nel caricamento degli esami");
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, []);
  
  // Update selected exam when examId changes
  useEffect(() => {
    if (examId) {
      const exam = exams.find(e => e.id === examId) || null;
      setSelectedExam(exam);
    } else {
      setSelectedExam(null);
    }
  }, [examId, exams]);

  const handleSubmit = (e: React.FormEvent) => {
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
      console.error('Error importing grades:', error);
      toast.error(error instanceof Error ? error.message : "Errore durante l'importazione");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

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
              selectedExam?.useLetterGrades
                ? "matricola,voto\n0612710900,A\n0612710901,B"
                : "matricola,voto\n0612710900,30\n0612710901,28"
            }
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
          />

          <div className="text-sm text-muted-foreground">
            <p className="font-medium">Formato richiesto:</p>
            {selectedExam?.useLetterGrades ? (
              <ul className="list-disc pl-5 space-y-1">
                <li><code>matricola</code>: La matricola dello studente (obbligatorio)</li>
                <li><code>voto</code>: Voto letterale da A a F (obbligatorio)</li>
              </ul>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                <li><code>matricola</code>: La matricola dello studente (obbligatorio)</li>
                <li><code>voto</code>: Voto numerico da 0 a 30 (obbligatorio)</li>
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
