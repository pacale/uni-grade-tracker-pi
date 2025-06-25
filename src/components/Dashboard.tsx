
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getDashboardAnalytics, getStudentRanking } from "@/utils/gradeUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getExams } from "@/utils/supabaseDataService";
import { Exam, StudentWithGrades } from "@/types";
import { formatGrade } from "@/utils/gradeUtils";
import {
  Table,
  TableBody,
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
  const [rankingType, setRankingType] = useState<'exam' | 'all'>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const availableExams = await getExams();
        setExams(availableExams);
        
        // Set first exam as default if none selected and exams are available
        if (!selectedExamId && availableExams.length > 0) {
          setSelectedExamId(availableExams[0].id);
        }
        
        // Only load dashboard data if an exam is selected
        if (selectedExamId) {
          const data = getDashboardAnalytics(selectedExamId);
          setAnalytics(data);
        }
        
        // Load student ranking
        loadStudentRanking();
      } catch (error) {
        console.error("Error loading analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedExamId]);

  // Separate function to load student ranking based on current rankingType
  const loadStudentRanking = () => {
    try {
      // Either filter by exam or get all students
      const ranking = rankingType === 'exam' && selectedExamId 
        ? getStudentRanking(selectedExamId) 
        : getStudentRanking();
      
      setStudentRanking(ranking);
    } catch (error) {
      console.error("Error loading student ranking:", error);
    }
  };

  // Update rankings when ranking type changes
  useEffect(() => {
    loadStudentRanking();
  }, [rankingType, selectedExamId]);

  const prepareDistributionData = () => {
    if (!analytics?.overallStats?.distribution) return [];
    
    const distribution = analytics.overallStats.distribution;
    const distributionData = Object.keys(distribution)
      .map(key => {
        // For numeric grades, filter out failing grades (< 18)
        if (!isNaN(Number(key))) {
          const gradeValue = Number(key);
          // If the grade is numeric and below 18, mark as "Non sufficiente" (Failed)
          if (gradeValue < 18) {
            return { grade: "Non sufficiente", count: distribution[key], failing: true };
          }
          return { grade: key, count: distribution[key] };
        }
        // For letter grades, keep as is
        return { grade: key, count: distribution[key], failing: key === 'F' };
      })
      // Group all failing grades together
      .reduce((acc, item) => {
        if (item.failing) {
          const failingIndex = acc.findIndex(g => g.grade === "Non sufficiente");
          if (failingIndex >= 0) {
            acc[failingIndex].count += item.count;
          } else {
            acc.push({ grade: "Non sufficiente", count: item.count, failing: true });
          }
          return acc;
        }
        acc.push(item);
        return acc;
      }, [] as any[]);
    
    // Sort by grade value (highest to lowest)
    return distributionData
      .filter(item => !item.failing) // Remove failing grades
      .sort((a, b) => {
        // For letter grades (A, B, C, D, E)
        if (isNaN(Number(a.grade)) && isNaN(Number(b.grade))) {
          return a.grade.localeCompare(b.grade);
        }
        // For numeric grades (30, 29, 28, etc.)
        return Number(b.grade) - Number(a.grade);
      })
      // Add failing grades at the end
      .concat(distributionData.filter(item => item.failing));
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
                <Bar 
                  dataKey="count" 
                  name="Numero di voti" 
                  fill="#1a75ff"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Student Ranking Section */}
      <Card>
        <CardHeader>
          <CardTitle>Classifica Studenti</CardTitle>
          <CardDescription>
            Studenti ordinati per media voti (dal più alto al più basso)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={(value) => setRankingType(value as 'all' | 'exam')}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Tutti gli esami</TabsTrigger>
              <TabsTrigger value="exam">Esame selezionato</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Posizione</TableHead>
                      <TableHead>Matricola</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cognome</TableHead>
                      <TableHead className="text-right">Media</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentRanking.length > 0 ? (
                      studentRanking.map((student, index) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{student.matricola}</TableCell>
                          <TableCell>{student.nome}</TableCell>
                          <TableCell>{student.cognome}</TableCell>
                          <TableCell className="text-right font-medium">{student.average}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nessun dato disponibile
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="exam">
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
                    {studentRanking.length > 0 ? (
                      studentRanking.map((student, index) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{student.matricola}</TableCell>
                          <TableCell>{student.nome}</TableCell>
                          <TableCell>{student.cognome}</TableCell>
                          <TableCell className="text-right font-medium">{student.average}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nessun dato disponibile per questo esame
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
