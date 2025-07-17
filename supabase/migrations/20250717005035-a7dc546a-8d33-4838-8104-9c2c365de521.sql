-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('forms', 'forms', true),
  ('avatars', 'avatars', true),
  ('assets', 'assets', true);

-- Create storage policies for forms bucket
CREATE POLICY "Forms files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'forms');

CREATE POLICY "Users can upload forms files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'forms');

CREATE POLICY "Users can update forms files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'forms');

CREATE POLICY "Users can delete forms files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'forms');

-- Create storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for assets bucket
CREATE POLICY "Assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'assets');

CREATE POLICY "Users can upload assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Users can update assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'assets');

CREATE POLICY "Users can delete assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'assets');