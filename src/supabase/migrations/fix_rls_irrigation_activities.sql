
DROP POLICY IF EXISTS "Users can view all activities" ON public.irrigation_activities;


CREATE POLICY "Users can view their own activities" 
ON public.irrigation_activities 
FOR SELECT 
USING (auth.uid() = user_id);


CREATE POLICY "Users can update their own activities"
ON public.irrigation_activities
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
ON public.irrigation_activities
FOR DELETE
USING (auth.uid() = user_id);