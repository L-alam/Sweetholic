-- Migration: Create List Items Table
-- Junction table for many-to-many relationship between lists and posts

CREATE TABLE IF NOT EXISTS list_items (
    id SERIAL PRIMARY KEY,
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    item_order INTEGER DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure a post can only be added once to a list
    UNIQUE(list_id, post_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_post_id ON list_items(post_id);
CREATE INDEX IF NOT EXISTS idx_list_items_order ON list_items(list_id, item_order);