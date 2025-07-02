
import { useState, useEffect } from "react";
import { Exam } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
    const loadExams = async () => {
      try {
        setLoading(true);
        console.log('Loading exams from Supabase...');
        
        const { data: examsData, error } = await supabase
          .from('exams')
          .select('*')
          .order('data', { ascending: false });

        if (error) {
          console.error('Error loading exams:', error);
          toast.error("Errore nel caricamento degli esami");
          return;
        }

        // Convert Supabase data to our Exam type
        const formattedExams: Exam[] = (examsData || []).map(exam => ({
          id: exam.id,
          nome: exam.nome,
          tipo: exam.tipo as 'intermedio' | 'completo',
          data: exam.data,
          useLetterGrades: exam.use_letter_grades
        }));

        console.log('Loaded exams:', formattedExams);
        setExams(formattedExams);
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

  const importGradesFromCSV = async (csvData: string, examId: string, hasHeaderRow: boolean) => {
    const rows = csvData.split('\n').filter(row => row.trim());
    
    if (rows.length === 0) {
      return { imported: 0, errors: 0 };
    }
    
    // Skip header row if indicated
    const startIndex = hasHeaderRow ? 1 : 0;
    
    // Get the exam
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
          
          const { error } = await supabase
            .from('grades')
            .insert({
              matricola,
              exam_id: exam.id,
              voto_lettera: votoLettera
            });
            
          if (error) {
            errors++;
            console.error(`Errore nell'inserimento del voto per ${matricola}:`, error);
            continue;
          }
        } else {
          // For numeric grades
          const votoNumerico = parseInt(columns[1]);
          
          if (isNaN(votoNumerico) || votoNumerico < 0 || votoNumerico > 30) {
            errors++;
            console.error(`Riga ${i+1}: voto numerico non valido (${columns[1]}) per lo studente ${matricola}`);
            continue;
          }
          
          const { error } = await supabase
            .from('grades')
            .insert({
              matricola,
              exam_id: exam.id,
              voto_numerico: votoNumerico
            });
            
          if (error) {
            errors++;
            console.error(`Errore nell'inserimento del voto per ${matricola}:`, error);
            continue;
          }
        }
        
        imported++;
      } catch (error) {
        errors++;
        console.error(`Errore nell'importazione della riga ${i+1}:`, error);
      }
    }
    
    return { imported, errors };
  };

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
      const result = await importGradesFromCSV(csvData, selectedExam.id, hasHeaderRow);
      
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
