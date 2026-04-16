-- Add thumbnail_url column to blog_posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- NOTE: You also need to create a Supabase Storage bucket called "blog-thumbnails"
-- with public access. This can be done via the Supabase Dashboard:
--   1. Go to Storage > New bucket
--   2. Name: "blog-thumbnails"
--   3. Public bucket: ON
--   4. Allowed MIME types: image/png, image/jpeg, image/webp
--   5. Max file size: 5MB
--
-- Or via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('blog-thumbnails', 'blog-thumbnails', true)
-- ON CONFLICT (id) DO NOTHING;
