
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initializeSampleData } from "@/utils/dataStorage";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import StudentTable from "@/components/StudentTable";
import CourseForm from "@/components/CourseForm";
import GradeEntry from "@/components/GradeEntry";
import GradeImport from "@/components/GradeImport";
import ExamStats from "@/components/ExamStats";

const Index = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Initialize sample data if needed
  useEffect(() => {
    initializeSampleData();
  }, []);

  const handleStudentEdit = (student: any) => {
    console.log('Edit student:', student);
  };

  const handleStudentView = (student: any) => {
    console.log('View student:', student);
  };

  const handleFormComplete = () => {
    console.log('Form completed');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 mb-6">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="students" disabled={!isAdmin}>
                  Studenti
                </TabsTrigger>
                <TabsTrigger value="courses" disabled={!isAdmin}>
                  Esami
                </TabsTrigger>
                <TabsTrigger value="grades" disabled={!isAdmin}>
                  Voti
                </TabsTrigger>
                <TabsTrigger value="import" disabled={!isAdmin}>
                  Importa
                </TabsTrigger>
                <TabsTrigger value="stats" disabled={!isAdmin}>
                  Statistiche
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                <TabsContent value="dashboard" className="m-0">
                  <Dashboard />
                </TabsContent>

                {isAdmin && (
                  <>
                    <TabsContent value="students" className="m-0">
                      <ProtectedRoute requireAdmin>
                        <StudentTable onEdit={handleStudentEdit} onView={handleStudentView} />
                      </ProtectedRoute>
                    </TabsContent>

                    <TabsContent value="courses" className="m-0">
                      <ProtectedRoute requireAdmin>
                        <CourseForm onComplete={handleFormComplete} />
                      </ProtectedRoute>
                    </TabsContent>

                    <TabsContent value="grades" className="m-0">
                      <ProtectedRoute requireAdmin>
                        <GradeEntry onComplete={handleFormComplete} />
                      </ProtectedRoute>
                    </TabsContent>

                    <TabsContent value="import" className="m-0">
                      <ProtectedRoute requireAdmin>
                        <GradeImport onComplete={handleFormComplete} />
                      </ProtectedRoute>
                    </TabsContent>

                    <TabsContent value="stats" className="m-0">
                      <ProtectedRoute requireAdmin>
                        <ExamStats />
                      </ProtectedRoute>
                    </TabsContent>
                  </>
                )}
              </div>
            </Tabs>

            {!isAdmin && (
              <div className="p-6 border-t bg-blue-50">
                <div className="text-center">
                  <p className="text-sm text-blue-600">
                    <strong>Nota:</strong> Stai utilizzando un account utente. 
                    Puoi visualizzare solo la dashboard con le statistiche degli esami.
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    Per accedere alle funzionalità di modifica, contatta un amministratore.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Index;
