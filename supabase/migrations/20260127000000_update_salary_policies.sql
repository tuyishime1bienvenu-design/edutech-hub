-- Allow users to insert their own salary
CREATE POLICY "Users can insert their own salary" ON public.salaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own salary
CREATE POLICY "Users can update their own salary" ON public.salaries
  FOR UPDATE USING (auth.uid() = user_id);
