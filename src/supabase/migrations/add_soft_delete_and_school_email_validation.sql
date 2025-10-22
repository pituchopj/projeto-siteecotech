
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;


CREATE OR REPLACE FUNCTION public.validate_school_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.property_type = 'escola' THEN
    IF NOT EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = NEW.user_id 
      AND email LIKE '%@aluno.ce.gov.br'
    ) THEN
      RAISE EXCEPTION 'Apenas emails institucionais (@aluno.ce.gov.br) podem usar tipo escola';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS validate_school_email_trigger ON public.profiles;
CREATE TRIGGER validate_school_email_trigger
  BEFORE INSERT OR UPDATE OF property_type ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_school_email();

CREATE POLICY "Admins can soft delete profiles"
  ON public.profiles
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));


DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

UPDATE storage.buckets 
SET public = false 
WHERE id = 'avatars';