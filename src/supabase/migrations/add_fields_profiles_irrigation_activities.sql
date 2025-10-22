
ALTER TABLE public.profiles
ADD COLUMN property_type text,
ADD COLUMN user_role text CHECK (user_role IN ('aluno', 'responsavel') OR user_role IS NULL),
ADD COLUMN class_name text;

ALTER TABLE public.irrigation_activities
ADD COLUMN note text;