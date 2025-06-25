
-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matricola TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exams table
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('completo', 'intermedio')),
  data DATE NOT NULL,
  use_letter_grades BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create grades table
CREATE TABLE public.grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matricola TEXT NOT NULL,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  voto_lettera TEXT CHECK (voto_lettera IN ('A', 'B', 'C', 'D', 'E', 'F')),
  voto_numerico INTEGER CHECK (voto_numerico >= 0 AND voto_numerico <= 30),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT grades_student_exam_unique UNIQUE (matricola, exam_id),
  CONSTRAINT grades_vote_type_check CHECK (
    (voto_lettera IS NOT NULL AND voto_numerico IS NULL) OR
    (voto_lettera IS NULL AND voto_numerico IS NOT NULL)
  )
);

-- Enable Row Level Security (make data public for all users)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all users to read and write all data
CREATE POLICY "Allow all users to view students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow all users to insert students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all users to update students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Allow all users to delete students" ON public.students FOR DELETE USING (true);

CREATE POLICY "Allow all users to view exams" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Allow all users to insert exams" ON public.exams FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all users to update exams" ON public.exams FOR UPDATE USING (true);
CREATE POLICY "Allow all users to delete exams" ON public.exams FOR DELETE USING (true);

CREATE POLICY "Allow all users to view grades" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Allow all users to insert grades" ON public.grades FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all users to update grades" ON public.grades FOR UPDATE USING (true);
CREATE POLICY "Allow all users to delete grades" ON public.grades FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_students_matricola ON public.students(matricola);
CREATE INDEX idx_grades_matricola ON public.grades(matricola);
CREATE INDEX idx_grades_exam_id ON public.grades(exam_id);
