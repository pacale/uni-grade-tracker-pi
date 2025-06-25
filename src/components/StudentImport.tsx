
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { importStudentsFromCSV } from "@/utils/supabaseDataService";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText } from "lucide-react";

interface StudentImportProps {
  onComplete: () => void;
}

const StudentImport = ({ onComplete }: StudentImportProps) => {
  const [csvData, setCsvData] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasHeaderRow, setHasHeaderRow] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!csvData.trim()) {
        toast.error("Inserisci i dati CSV");
        setIsSubmitting(false);
        return;
      }
      
      const importedStudents = await importStudentsFromCSV(csvData);
      
      if (importedStudents.length === 0) {
        toast.info("Nessuno studente importato. Verifica il formato del file CSV.");
      } else {
        toast.success(`Importati ${importedStudents.length} studenti con successo`);
        onComplete();
      }
    } catch (error) {
      console.error('Error importing students:', error);
      toast.error(error instanceof Error ? error.message : "Errore durante l'importazione");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
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
            Dati CSV Studenti
          </Label>
          <textarea
            id="csvData"
            className="w-full h-40 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="matricola,nome,cognome&#10;0612710900,Mario,Rossi&#10;0612710901,Lucia,Bianchi"
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
          />

          <div className="text-sm text-muted-foreground">
            <p className="font-medium">Formato richiesto:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>matricola</code>: La matricola dello studente (obbligatorio)</li>
              <li><code>nome</code>: Nome dello studente (obbligatorio)</li>
              <li><code>cognome</code>: Cognome dello studente (obbligatorio)</li>
            </ul>
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
          Importa Studenti
        </Button>
      </div>
    </form>
  );
};

export default StudentImport;
