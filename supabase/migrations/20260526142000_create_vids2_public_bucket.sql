-- Hero background video bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vids2', 'vids2', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read access for vids2" ON storage.objects;
CREATE POLICY "Public read access for vids2"
ON storage.objects FOR SELECT
USING (bucket_id = 'vids2');
