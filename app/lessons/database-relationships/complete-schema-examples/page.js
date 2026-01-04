import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Complete Schema Examples - Database Relationships',
  description: 'Complete database schema examples with all relationship types',
};

export default function CompleteSchemaExamples() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Complete Schema Examples</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Example 1: E-Commerce Schema</h2>
          <p className="mb-4">
            A complete e-commerce schema demonstrating all relationship types with real-world complexity.
          </p>
          
          <CodeBlock
            title="Complete E-Commerce Schema"
            language="sql"
            code={`-- ============================================
-- E-COMMERCE DATABASE SCHEMA
-- ============================================

-- Users table (customers and admins)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User profiles (1:1 relationship - optional extended info)
CREATE TABLE user_profiles (
  user_id INT PRIMARY KEY,
  phone VARCHAR(20),
  date_of_birth DATE,
  avatar_url VARCHAR(255),
  bio TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Addresses (1:N - one user can have many addresses)
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50),
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categories (self-referencing hierarchy)
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  parent_id INT,
  description TEXT,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Products
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL,  -- 1:N relationship
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  sku VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- Product images (1:N - one product can have many images)
CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  alt_text VARCHAR(200),
  display_order INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Product tags (M:N relationship via junction table)
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE product_tags (
  product_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (product_id, tag_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Orders (1:N relationship with users)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  shipping_address_id INT NOT NULL,
  billing_address_id INT NOT NULL,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  ordered_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (shipping_address_id) REFERENCES addresses(id),
  FOREIGN KEY (billing_address_id) REFERENCES addresses(id)
);

-- Order items (M:N relationship with products, with attributes)
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,  -- Price at time of order
  total_price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Payments (1:N relationship with orders)
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_id VARCHAR(100) UNIQUE,
  status VARCHAR(50) NOT NULL,
  paid_at TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
);

-- Reviews (1:N relationship with products and users)
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (product_id, user_id)  -- One review per user per product
);

-- Shopping cart (1:N relationship with users, M:N with products)
CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  added_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE (user_id, product_id)  -- One cart item per product per user
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);`}
          />

          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Relationship Summary</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>1:1:</strong> users ↔ user_profiles</li>
              <li><strong>1:N:</strong> users → addresses, users → orders, categories → products, products → product_images, orders → order_items, orders → payments, products → reviews</li>
              <li><strong>M:N:</strong> products ↔ tags (via product_tags), users ↔ products (via cart_items), orders ↔ products (via order_items)</li>
              <li><strong>Self-referencing:</strong> categories (parent_id)</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Example 2: Blog/CMS Schema</h2>
          
          <CodeBlock
            title="Complete Blog Schema"
            language="sql"
            code={`-- ============================================
-- BLOG/CMS DATABASE SCHEMA
-- ============================================

-- Authors (users who can write posts)
CREATE TABLE authors (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Categories (self-referencing for hierarchy)
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id INT,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Tags (simple lookup table)
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL
);

-- Posts
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_id INT NOT NULL,  -- 1:N relationship
  category_id INT,  -- 1:N relationship (optional)
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft',  -- draft, published, archived
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE RESTRICT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Post tags (M:N relationship)
CREATE TABLE post_tags (
  post_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Comments (self-referencing for threading)
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL,  -- 1:N relationship
  author_id INT,  -- Can be NULL for anonymous
  parent_id INT,  -- Self-referencing for replies
  author_name VARCHAR(100),  -- For anonymous comments
  author_email VARCHAR(100),  -- For anonymous comments
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'approved',  -- approved, pending, spam
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Media library (for images, files)
CREATE TABLE media (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  file_size BIGINT,
  alt_text VARCHAR(200),
  uploaded_by INT,  -- 1:N relationship
  uploaded_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (uploaded_by) REFERENCES authors(id) ON DELETE SET NULL
);

-- Post media (M:N relationship - posts can have multiple media)
CREATE TABLE post_media (
  post_id INT NOT NULL,
  media_id INT NOT NULL,
  display_order INT DEFAULT 0,
  PRIMARY KEY (post_id, media_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
);

-- INDEXES
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Example 3: Social Media Schema</h2>
          
          <CodeBlock
            title="Complete Social Media Schema"
            language="sql"
            code={`-- ============================================
-- SOCIAL MEDIA DATABASE SCHEMA
-- ============================================

-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User profiles (1:1 - extended user info)
CREATE TABLE user_profiles (
  user_id INT PRIMARY KEY,
  date_of_birth DATE,
  location VARCHAR(100),
  website VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Posts
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,  -- 1:N relationship
  content TEXT NOT NULL,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Comments (self-referencing for threading)
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL,  -- 1:N relationship
  user_id INT NOT NULL,  -- 1:N relationship
  parent_id INT,  -- Self-referencing for replies
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Likes (M:N relationship - users can like many posts, posts can be liked by many users)
CREATE TABLE post_likes (
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User follows (M:N self-referencing relationship)
CREATE TABLE user_follows (
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (follower_id != following_id)  -- Can't follow yourself
);

-- Messages (1:N relationship - sender to message)
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversation participants (M:N relationship)
CREATE TABLE conversation_participants (
  conversation_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages (1:N relationship with conversations and users)
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,  -- 1:N relationship
  content TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- INDEXES
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Design Patterns Used</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">1:1 Relationships</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>users ↔ user_profiles</li>
                <li>Separates optional/extended data</li>
              </ul>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">1:N Relationships</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>users → posts</li>
                <li>categories → products</li>
                <li>posts → comments</li>
                <li>orders → order_items</li>
              </ul>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">M:N Relationships</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>products ↔ tags</li>
                <li>posts ↔ tags</li>
                <li>users ↔ users (follows)</li>
                <li>posts ↔ users (likes)</li>
              </ul>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Self-Referencing</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>categories (hierarchy)</li>
                <li>comments (threading)</li>
                <li>employees (org chart)</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

