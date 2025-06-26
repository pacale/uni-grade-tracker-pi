
import { useState, useEffect } from "react";
import { Student } from "@/types";
import { getStudentGrades, getStudentAverage, formatGrade } from "@/utils/gradeUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StudentGradeDetailsProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

const StudentGradeDetails = ({ student, isOpen, onClose }: StudentGradeDetailsProps) => {
  const [grades, setGrades] = useState<any[]>([]);
  const [average, setAverage] = useState<number>(0);

  useEffect(() => {
    if (student) {
      const studentGrades = getStudentGrades(student.matricola);
      const studentAverage = getStudentAverage(student.matricola);
      
      setGrades(studentGrades);
      setAverage(studentAverage);
    }
  }, [student]);

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Voti di {student.nome} {student.cognome}
          </DialogTitle>
          <DialogDescription>
            Matricola: {student.matricola}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Media</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {average || "N/A"}
              </div>
              <p className="text-sm text-muted-foreground">
                Media calcolata sui voti sufficienti (≥18)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dettaglio Voti</CardTitle>
            </CardHeader>
            <CardContent>
              {grades.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Esame</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Voto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.map((grade, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {grade.examName}
                          </TableCell>
                          <TableCell>
                            {new Date(grade.examDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="capitalize">
                            {grade.examType}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatGrade(grade)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nessun voto registrato per questo studente
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentGradeDetails;
