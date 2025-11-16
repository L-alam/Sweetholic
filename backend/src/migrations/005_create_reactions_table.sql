-- Migration: Create Reactions Table
-- Users can react to posts with different emoji types

CREATE TABLE IF NOT EXISTS reactions (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('heart', 'thumbs_up', 'star_eyes', 'jealous', 'dislike')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Each user can only give one of each reaction type per post
    UNIQUE(post_id, user_id, reaction_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);