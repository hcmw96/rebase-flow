-- Make vids bucket public so the video can be used as a background
UPDATE storage.buckets SET public = true WHERE id = 'vids';

-- Add public read policy for vids bucket
CREATE POLICY "Public read access for vids" ON storage.objects FOR SELECT USING (bucket_id = 'vids');