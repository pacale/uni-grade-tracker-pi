
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getDashboardAnalytics, getStudentRanking, getExamRanking } from "@/utils/gradeUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getExams } from "@/utils/dataStorage";
import { Exam, StudentWithGrades, ExamWithStats } from "@/types";
import { formatGrade } from "@/utils/gradeUtils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Dashboard = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [exams, setExams] = useState<Exam[]>([]);
  const [studentRanking, setStudentRanking] = useState<StudentWithGrades[]>([]);
  const [examRanking, setExamRanking] = useState<ExamWithStats[]>([]);

  useEffect(() => {
    const loadData = () => {
      try {
        const availableExams = getExams();
        setExams(availableExams);
        
        // Set first exam as default if none selected and exams are available
        if (!selectedExamId && availableExams.length > 0) {
          setSelectedExamId(availableExams[0].id);
        }
        
        // Only load dashboard data if an exam is selected
        if (selectedExamId) {
          const data = getDashboardAnalytics(selectedExamId);
          setAnalytics(data);
          
          // Load student ranking for the selected exam
          const ranking = getStudentRanking();
          setStudentRanking(ranking.filter(student => 
            student.grades.some(grade => grade.examId === selectedExamId)
          ));
          
          // Load exam ranking
          const examRank = getExamRanking();
          setExamRanking(examRank);
        }
      } catch (error) {
        console.error("Error loading analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedExamId]);

  const prepareDistributionData = () => {
    if (!analytics?.overallStats?.distribution) return [];
    
    const distribution = analytics.overallStats.distribution;
    return Object.keys(distribution).map(key => ({
      grade: key,
      count: distribution[key]
    }));
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

  if (!selectedExamId) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Seleziona un esame per visualizzare le statistiche</p>
          <div className="mt-4 w-64 mx-auto">
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un esame" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.nome} ({new Date(exam.data).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="w-64">
          <Select value={selectedExamId} onValueChange={setSelectedExamId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona un esame" />
            </SelectTrigger>
            <SelectContent>
              {exams.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.nome} ({new Date(exam.data).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Studenti con voti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.counts.uniqueStudentsWithGrades || 0}</div>
            <p className="text-xs text-muted-foreground">
              Studenti che hanno ricevuto voti per questo esame
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.counts.grades || 0}</div>
            <p className="text-xs text-muted-foreground">
              Totale voti registrati per questo esame
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.overallStats?.average || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Media dei voti per questo esame
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Percentuale approvati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.overallStats?.passingPercentage || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Percentuale di studenti che hanno superato l'esame
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribuzione dei voti</CardTitle>
            <CardDescription>
              Frequenza dei voti per questo esame
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prepareDistributionData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Numero di voti" fill="#1a75ff" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classifica Studenti per questo esame</CardTitle>
          <CardDescription>
            Studenti ordinati per voto (più alto in cima)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posizione</TableHead>
                  <TableHead>Matricola</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cognome</TableHead>
                  <TableHead className="text-right">Voto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentRanking.map((student, index) => {
                  const examGrade = student.grades.find(g => g.examId === selectedExamId);
                  if (!examGrade) return null;
                  
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{student.matricola}</TableCell>
                      <TableCell>{student.nome}</TableCell>
                      <TableCell>{student.cognome}</TableCell>
                      <TableCell className="text-right font-medium">{formatGrade(examGrade)}</TableCell>
                    </TableRow>
                  );
                })}
                {studentRanking.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nessun dato disponibile
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classifica Esami</CardTitle>
          <CardDescription>
            Esami ordinati per media voti (più alta in cima)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posizione</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Media</TableHead>
                  <TableHead className="text-right">Studenti</TableHead>
                  <TableHead className="text-right">% Approvazione</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examRanking.map((exam, index) => (
                  <TableRow key={exam.id} className={exam.id === selectedExamId ? "bg-muted" : undefined}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{exam.nome}</TableCell>
                    <TableCell>{new Date(exam.data).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-medium">{exam.stats.average}</TableCell>
                    <TableCell className="text-right">{exam.studentCount}</TableCell>
                    <TableCell className="text-right">{exam.stats.passingPercentage}%</TableCell>
                  </TableRow>
                ))}
                {examRanking.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nessun dato disponibile
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
