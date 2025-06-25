
import { useState, useEffect } from "react";
import { getExamRanking } from "@/utils/gradeUtils";
import { ExamWithStats } from "@/types";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ExamStatsProps {
  selectedExamId?: string;
}

const ExamStats = ({ selectedExamId }: ExamStatsProps) => {
  const [examRanking, setExamRanking] = useState<ExamWithStats[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load exam ranking
        const examRank = await getExamRanking();
        setExamRanking(examRank);
        console.log("Exam ranking loaded:", examRank);
      } catch (error) {
        console.error("Error loading exam rankings:", error);
      }
    };

    loadData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiche Esami</CardTitle>
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
  );
};

export default ExamStats;
