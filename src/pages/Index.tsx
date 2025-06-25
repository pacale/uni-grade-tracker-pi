
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initializeSampleData } from "@/utils/supabaseDataService";
import { useAuth } from "@/hooks/useAuth";
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize sample data if needed
  useEffect(() => {
    const initData = async () => {
      try {
        await initializeSampleData();
      } catch (error) {
        console.error('Error initializing sample data:', error);
      }
    };
    
    initData();
  }, []);

  const handleStudentEdit = (student: any) => {
    console.log('Edit student:', student);
  };

  const handleStudentView = (student: any) => {
    console.log('View student:', student);
  };

  const handleFormComplete = () => {
    console.log('Form completed');
    // Trigger refresh for components that need it
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 mb-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="students">
                Studenti
              </TabsTrigger>
              <TabsTrigger value="courses">
                Esami
              </TabsTrigger>
              <TabsTrigger value="grades">
                Voti
              </TabsTrigger>
              <TabsTrigger value="import">
                Importa
              </TabsTrigger>
              <TabsTrigger value="stats">
                Statistiche
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="dashboard" className="m-0">
                <Dashboard />
              </TabsContent>

              <TabsContent value="students" className="m-0">
                <StudentTable 
                  onEdit={handleStudentEdit} 
                  onView={handleStudentView}
                  refreshTrigger={refreshTrigger}
                />
              </TabsContent>

              <TabsContent value="courses" className="m-0">
                <CourseForm onComplete={handleFormComplete} />
              </TabsContent>

              <TabsContent value="grades" className="m-0">
                <GradeEntry onComplete={handleFormComplete} />
              </TabsContent>

              <TabsContent value="import" className="m-0">
                <GradeImport onComplete={handleFormComplete} />
              </TabsContent>

              <TabsContent value="stats" className="m-0">
                <ExamStats />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
