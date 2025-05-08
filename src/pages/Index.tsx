
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import Dashboard from "@/components/Dashboard";
import StudentTable from "@/components/StudentTable";
import GradeEntry from "@/components/GradeEntry";
import ExamStats from "@/components/ExamStats";
import { Student, Exam, ExamType } from "@/types";
import { addStudent, getStudentWithGrades, importStudentsFromCSV, initializeSampleData, updateStudent, getExams, addExam, deleteExam, updateExam } from "@/utils/dataStorage";
import { formatGrade } from "@/utils/gradeUtils";
import GradeImport from "@/components/GradeImport";
import { Calendar, Edit, Trash2, List, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [showStudentDetail, setShowStudentDetail] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showImportGradeDialog, setShowImportGradeDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  
  const [newStudent, setNewStudent] = useState({
    matricola: "",
    nome: "",
    cognome: ""
  });
  
  const [newExam, setNewExam] = useState({
    nome: "",
    tipo: "completo" as ExamType,
    data: new Date().toISOString().split('T')[0],
    useLetterGrades: false
  });
  
  const [csvData, setCsvData] = useState("");
  const [studentDetail, setStudentDetail] = useState<any>(null);
  const [exams, setExams] = useState<Exam[]>([]);

  // Initialize sample data if needed
  useEffect(() => {
    initializeSampleData();
    refreshData();
  }, []);

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
    setExams(getExams());
  };

  const handleAddStudent = () => {
    try {
      if (!newStudent.matricola || !newStudent.nome || !newStudent.cognome) {
        toast.error("Tutti i campi sono obbligatori");
        return;
      }
      
      // Validate matricola format (e.g., 10 digits)
      if (!/^\d{10}$/.test(newStudent.matricola)) {
        toast.error("La matricola deve essere composta da 10 cifre");
        return;
      }
      
      if (editingStudent) {
        // Update
        updateStudent({
          ...editingStudent,
          ...newStudent
        });
        toast.success("Studente aggiornato con successo");
      } else {
        // Add new
        addStudent(newStudent);
        toast.success("Studente aggiunto con successo");
      }
      
      setShowAddStudent(false);
      setEditingStudent(null);
      setNewStudent({ matricola: "", nome: "", cognome: "" });
      refreshData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore durante il salvataggio");
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setNewStudent({
      matricola: student.matricola,
      nome: student.nome,
      cognome: student.cognome
    });
    setShowAddStudent(true);
  };

  const handleViewStudent = (matricola: string) => {
    const detail = getStudentWithGrades(matricola);
    setStudentDetail(detail);
    setShowStudentDetail(matricola);
  };

  const handleImportCSV = () => {
    try {
      const importedStudents = importStudentsFromCSV(csvData);
      
      if (importedStudents.length > 0) {
        toast.success(`Importati ${importedStudents.length} studenti con successo`);
        setShowImportDialog(false);
        setCsvData("");
        refreshData();
      } else {
        toast.info("Nessuno nuovo studente importato");
      }
    } catch (error) {
      toast.error("Errore durante l'importazione");
    }
  };

  const handleAddExam = () => {
    if (!newExam.nome || !newExam.data) {
      toast.error("Il nome e la data sono obbligatori");
      return;
    }
    
    try {
      if (editingExam) {
        // Update existing exam
        const updatedExam = { 
          ...editingExam, 
          nome: newExam.nome,
          data: newExam.data, 
          tipo: newExam.tipo,
          useLetterGrades: newExam.useLetterGrades
        };
        
        // Call updateExam function
        updateExam(updatedExam);
        toast.success("Esame aggiornato con successo");
      } else {
        // Add new exam
        const exam = addExam(newExam);
        if (exam) {
          toast.success("Esame aggiunto con successo");
        }
      }
      
      setShowAddExam(false);
      setEditingExam(null);
      setNewExam({
        nome: "",
        tipo: "completo",
        data: new Date().toISOString().split('T')[0],
        useLetterGrades: false
      });
      refreshData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore durante il salvataggio dell'esame");
    }
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setNewExam({
      nome: exam.nome,
      tipo: exam.tipo,
      data: exam.data,
      useLetterGrades: exam.useLetterGrades
    });
    setShowAddExam(true);
  };

  const handleDeleteExam = (examId: string) => {
    try {
      deleteExam(examId);
      toast.success("Esame eliminato con successo");
      refreshData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore durante l'eliminazione dell'esame");
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="flex justify-between items-center py-6">
        <div>
          <h1 className="text-3xl font-bold text-university-700">Sistema di Gestione Voti Universitari</h1>
          <p className="text-muted-foreground mt-1">Gestione e monitoraggio dei voti degli studenti</p>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="students">Studenti</TabsTrigger>
          <TabsTrigger value="exams">Esami</TabsTrigger>
          <TabsTrigger value="grades">Voti</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <Dashboard />
        </TabsContent>
        
        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gestione Studenti</h2>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowImportDialog(true)}
              >
                Importa CSV
              </Button>
              <Button onClick={() => setShowAddStudent(true)}>
                Aggiungi Studente
              </Button>
            </div>
          </div>
          <StudentTable 
            onEdit={handleEditStudent} 
            onView={handleViewStudent}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>
        
        <TabsContent value="exams" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gestione Esami</h2>
            <Button onClick={() => setShowAddExam(true)}>
              <Plus className="mr-2" size={16} />
              Aggiungi Esame
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground py-12">
                Nessun esame presente. Aggiungi un nuovo esame per iniziare.
              </p>
            ) : (
              exams.map((exam) => (
                <Card key={exam.id}>
                  <CardHeader>
                    <CardTitle>{exam.nome}</CardTitle>
                    <CardDescription>
                      Data: {new Date(exam.data).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">
                      Tipo: {exam.tipo === 'completo' ? 'Completo' : 'Intermedio'}<br />
                      Valutazione: {exam.useLetterGrades ? 'In lettere (A-F)' : 'Numerica (18-30)'}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => handleEditExam(exam)}
                    >
                      <Edit className="mr-2" size={16} />
                      Modifica
                    </Button>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDeleteExam(exam.id)}
                    >
                      <Trash2 className="mr-1" size={16} />
                      Elimina
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
          
          {/* Add Exam Statistics section */}
          <ExamStats />
        </TabsContent>
        
        <TabsContent value="grades" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gestione Voti</h2>
            <div className="space-x-2">
              <Button 
                variant="outline"
                onClick={() => setShowImportGradeDialog(true)}
              >
                Importa CSV
              </Button>
              <Button onClick={() => setShowAddGrade(true)}>
                Aggiungi Voto
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Student Dialog */}
      <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStudent ? "Modifica Studente" : "Aggiungi Studente"}</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli dello studente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="matricola">Matricola</Label>
              <Input
                id="matricola"
                placeholder="es. 0612710900"
                value={newStudent.matricola}
                onChange={(e) => setNewStudent({ ...newStudent, matricola: e.target.value })}
                disabled={!!editingStudent} // Disable editing matricola for existing students
              />
              <p className="text-xs text-muted-foreground">
                La matricola deve essere composta da 10 cifre.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={newStudent.nome}
                  onChange={(e) => setNewStudent({ ...newStudent, nome: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cognome">Cognome</Label>
                <Input
                  id="cognome"
                  value={newStudent.cognome}
                  onChange={(e) => setNewStudent({ ...newStudent, cognome: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowAddStudent(false);
                setEditingStudent(null);
                setNewStudent({ matricola: "", nome: "", cognome: "" });
              }}>
                Annulla
              </Button>
              <Button onClick={handleAddStudent}>
                {editingStudent ? "Aggiorna" : "Aggiungi"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Students Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importa Studenti da CSV</DialogTitle>
            <DialogDescription>
              Incolla i dati CSV nel formato: matricola,nome,cognome
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Label htmlFor="csv">Dati CSV</Label>
            <textarea
              id="csv"
              className="w-full h-40 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="0612710900,Marco,Rossi&#10;0612710901,Lucia,Bianchi"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Gli studenti con matricole già esistenti verranno ignorati.
            </p>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Annulla
              </Button>
              <Button onClick={handleImportCSV}>
                Importa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Exam Dialog */}
      <Dialog open={showAddExam} onOpenChange={setShowAddExam}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExam ? "Modifica Esame" : "Aggiungi Esame"}</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli dell'esame.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="examName">Nome dell'esame</Label>
              <Input
                id="examName"
                value={newExam.nome}
                onChange={(e) => setNewExam({...newExam, nome: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="examDate">Data dell'esame</Label>
              <Input
                id="examDate"
                type="date"
                value={newExam.data}
                onChange={(e) => setNewExam({...newExam, data: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo di valutazione</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="useLetterGrades"
                  checked={newExam.useLetterGrades}
                  onCheckedChange={(checked) => setNewExam({...newExam, useLetterGrades: !!checked})}
                />
                <Label htmlFor="useLetterGrades">Usa voti in lettere (A-F)</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {newExam.useLetterGrades 
                  ? "I voti verranno espressi in lettere da A a F." 
                  : "I voti verranno espressi in numeri da 18 a 30, con possibilità di lode."}
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowAddExam(false);
                setEditingExam(null);
                setNewExam({
                  nome: "",
                  tipo: "completo",
                  data: new Date().toISOString().split('T')[0],
                  useLetterGrades: false
                });
              }}>
                Annulla
              </Button>
              <Button onClick={handleAddExam}>
                {editingExam ? "Aggiorna" : "Aggiungi"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Grade Dialog */}
      <Dialog open={showAddGrade} onOpenChange={setShowAddGrade}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Aggiungi Voto</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli del voto.
            </DialogDescription>
          </DialogHeader>
          
          <GradeEntry
            onComplete={() => {
              setShowAddGrade(false);
              refreshData();
            }}
            enableExamCreation={true}
          />
        </DialogContent>
      </Dialog>

      {/* Import Grades Dialog */}
      <Dialog open={showImportGradeDialog} onOpenChange={setShowImportGradeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importa Voti da CSV</DialogTitle>
            <DialogDescription>
              Importa voti da un file CSV
            </DialogDescription>
          </DialogHeader>
          
          <GradeImport
            onComplete={() => {
              setShowImportGradeDialog(false);
              refreshData();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Student Detail Dialog */}
      <Dialog open={!!showStudentDetail} onOpenChange={() => setShowStudentDetail(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Dettaglio Studente</DialogTitle>
            <DialogDescription>
              {studentDetail?.matricola} - {studentDetail?.nome} {studentDetail?.cognome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {studentDetail?.grades.length > 0 ? (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Esame</th>
                      <th className="px-4 py-2 text-left">Tipo</th>
                      <th className="px-4 py-2 text-left">Data</th>
                      <th className="px-4 py-2 text-left">Voto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentDetail.grades.map((grade: any) => (
                      <tr key={grade.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-2">{grade.exam.nome}</td>
                        <td className="px-4 py-2">
                          {grade.exam.tipo === 'intermedio' ? 'Intermedio' : 'Completo'}
                        </td>
                        <td className="px-4 py-2">{new Date(grade.exam.data).toLocaleDateString()}</td>
                        <td className="px-4 py-2 font-medium">
                          {formatGrade(grade)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nessun voto registrato per questo studente.
              </p>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowStudentDetail(null)}>
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
