-- Migration: Create Food Items Table
-- Each post can have multiple food items with individual ratings

CREATE TABLE IF NOT EXISTS food_items (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2),
    rating INTEGER,
    item_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_food_items_post_id ON food_items(post_id);
CREATE INDEX IF NOT EXISTS idx_food_items_order ON food_items(post_id, item_order);

-- Note: The rating_type is still stored at the post level since all items in a post share the same scale