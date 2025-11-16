-- Migration: Create Posts Table
-- This table stores all user posts (sweet treats journal entries)

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    caption TEXT,
    location_name VARCHAR(255),
    location_coordinates POINT,
    food_type VARCHAR(100),
    price DECIMAL(10, 2),
    rating_type VARCHAR(10) CHECK (rating_type IN ('3_star', '5_star', '10_star')),
    rating INTEGER,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_is_public ON posts(is_public);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Spatial index for location-based queries (optional but useful)
CREATE INDEX IF NOT EXISTS idx_posts_location ON posts USING GIST(location_coordinates);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();