-- Migration: Create Photos Table
-- Each post can have multiple photos

CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_order INTEGER DEFAULT 0,
    individual_description TEXT,
    individual_rating INTEGER,
    is_front_camera BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_photos_post_id ON photos(post_id);
CREATE INDEX IF NOT EXISTS idx_photos_order ON photos(post_id, photo_order);