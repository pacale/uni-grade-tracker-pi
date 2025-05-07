
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getDashboardAnalytics, getStudentRanking } from "@/utils/gradeUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getExams } from "@/utils/dataStorage";
import { Exam, StudentWithGrades } from "@/types";
import { formatGrade } from "@/utils/gradeUtils";

const Dashboard = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState<string | undefined>(undefined);
  const [exams, setExams] = useState<Exam[]>([]);
  const [studentRanking, setStudentRanking] = useState<StudentWithGrades[]>([]);

  useEffect(() => {
    const loadData = () => {
      try {
        setExams(getExams());
        const data = getDashboardAnalytics(selectedExamId);
        setAnalytics(data);
        
        // Load student ranking
        const ranking = getStudentRanking();
        setStudentRanking(ranking);
      } catch (error) {
        console.error("Error loading analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedExamId]);

  const prepareChartData = () => {
    if (!analytics?.examStats) return [];
    
    return analytics.examStats.map((exam: any) => ({
      name: exam.name,
      average: exam.stats.average,
      passing: exam.stats.passingPercentage,
    }));
  };

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="w-64">
          <Select value={selectedExamId} onValueChange={setSelectedExamId}>
            <SelectTrigger>
              <SelectValue placeholder="Tutti gli esami" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={undefined}>Tutti gli esami</SelectItem>
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
              Studenti che hanno ricevuto almeno un voto
              {selectedExamId ? " per questo esame" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esami</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.counts.exams || 0}</div>
            <p className="text-xs text-muted-foreground">
              Sessioni d'esame registrate
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
              Totale voti registrati
              {selectedExamId ? " per questo esame" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media generale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.overallStats?.average || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Media di tutti i voti
              {selectedExamId ? " per questo esame" : ""}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribuzione dei voti</CardTitle>
            <CardDescription>
              Frequenza dei voti 
              {selectedExamId ? " per questo esame" : " di tutti gli esami"}
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
        
        <Card>
          <CardHeader>
            <CardTitle>Statistiche per esame</CardTitle>
            <CardDescription>
              Media e percentuale di approvazione
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prepareChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="average" name="Media" fill="#1a75ff" />
                <Bar dataKey="passing" name="% Approvazione" fill="#4d94ff" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classifica Studenti</CardTitle>
          <CardDescription>
            Studenti ordinati per media voti (più alta in cima)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Posizione</th>
                  <th className="px-4 py-2 text-left font-medium">Matricola</th>
                  <th className="px-4 py-2 text-left font-medium">Nome</th>
                  <th className="px-4 py-2 text-left font-medium">Cognome</th>
                  <th className="px-4 py-2 text-right font-medium">Media</th>
                  <th className="px-4 py-2 text-right font-medium">Esami</th>
                </tr>
              </thead>
              <tbody>
                {studentRanking.map((student, index) => (
                  <tr key={student.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-2 font-medium">{index + 1}</td>
                    <td className="px-4 py-2">{student.matricola}</td>
                    <td className="px-4 py-2">{student.nome}</td>
                    <td className="px-4 py-2">{student.cognome}</td>
                    <td className="px-4 py-2 text-right font-medium">{student.average}</td>
                    <td className="px-4 py-2 text-right">{student.grades.length}</td>
                  </tr>
                ))}
                {studentRanking.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Nessun dato disponibile
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Esami recenti</CardTitle>
          <CardDescription>
            Ultimi esami registrati
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {analytics?.recentExams?.length > 0 ? (
              analytics.recentExams.map((exam: any) => (
                <div key={exam.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {exam.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {exam.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      Media: {exam.stats.average}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {exam.grades} voti | Passati: {exam.stats.passing}/{exam.stats.passing + exam.stats.failing} ({exam.stats.passingPercentage}%)
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nessun esame registrato
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
