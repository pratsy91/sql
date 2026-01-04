import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Naming Conventions - PostgreSQL Learning',
  description: 'Learn about PostgreSQL naming conventions for tables, columns, and indexes',
};

export default function NamingConventions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Naming Conventions</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Table Naming</h2>

          <CodeBlock
            title="SQL: Table Naming Conventions"
            language="sql"
            code={`-- Recommended: Plural, lowercase, snake_case
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  product_id INTEGER
);

-- Avoid:
-- CREATE TABLE User ();  -- Singular, PascalCase
-- CREATE TABLE orderItems ();  -- camelCase
-- CREATE TABLE ORDER_ITEMS ();  -- UPPERCASE

-- Join tables: Use both table names in alphabetical order
CREATE TABLE post_categories (
  post_id INTEGER,
  category_id INTEGER,
  PRIMARY KEY (post_id, category_id)
);

-- Or descriptive name
CREATE TABLE user_roles (
  user_id INTEGER,
  role_id INTEGER,
  PRIMARY KEY (user_id, role_id)
);

-- Naming patterns:
-- - Plural nouns: users, orders, products
-- - Descriptive: order_items, user_profiles
-- - Clear and concise: avoid abbreviations unless standard
-- - Consistent: use same pattern throughout

-- Examples:
CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT
);

CREATE TABLE blog_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER,
  content TEXT
);

CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  token TEXT
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Column Naming</h2>

          <CodeBlock
            title="SQL: Column Naming Conventions"
            language="sql"
            code={`-- Recommended: lowercase, snake_case, descriptive
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Foreign keys: {referenced_table}_id
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title TEXT,
  content TEXT
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER
);

-- Boolean columns: is_, has_, can_, should_
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  has_verified_email BOOLEAN DEFAULT FALSE,
  can_post BOOLEAN DEFAULT TRUE
);

-- Timestamps: created_at, updated_at, deleted_at
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Avoid:
-- CREATE TABLE users (
--   id SERIAL PRIMARY KEY,
--   Email TEXT,  -- PascalCase
--   firstName TEXT,  -- camelCase
--   created_At TEXT  -- Inconsistent
-- );

-- Naming patterns:
-- - Descriptive: first_name not fname
-- - Consistent: use same suffix for similar fields (_id, _at, _by)
-- - Clear: user_id not uid (unless standard abbreviation)
-- - Avoid reserved words: use order_status not status (if ambiguous)

-- Examples:
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2),
  category_id INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Index Naming</h2>

          <CodeBlock
            title="SQL: Index Naming Conventions"
            language="sql"
            code={`-- Recommended: idx_{table}_{columns}_{suffix}
-- Format: idx_<table>_<column(s)>_<type>

-- Single column index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- Composite index
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at);
CREATE INDEX idx_order_items_order_product ON order_items(order_id, product_id);

-- Unique index
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);
CREATE UNIQUE INDEX idx_posts_slug_unique ON posts(slug);

-- Partial index
CREATE INDEX idx_users_active_email ON users(email) WHERE is_active = TRUE;
CREATE INDEX idx_posts_published_created ON posts(created_at) WHERE published = TRUE;

-- Expression index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
CREATE INDEX idx_posts_title_trigram ON posts USING gin(title gin_trgm_ops);

-- Foreign key index (often auto-created, but explicit is better)
CREATE INDEX idx_posts_user_id_fk ON posts(user_id);

-- Naming patterns:
-- - Prefix: idx_ for regular, idx_{table}_unique for unique
-- - Table name: users, posts, order_items
-- - Columns: email, user_id, created_at
-- - Type suffix: _unique, _partial, _gin, _btree

-- Avoid:
-- CREATE INDEX email_idx ON users(email);  -- Suffix instead of prefix
-- CREATE INDEX idx1 ON users(email);  -- Not descriptive
-- CREATE INDEX users_email_idx ON users(email);  -- Missing idx prefix

-- Examples:
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_posts_user_published ON posts(user_id, published, created_at);
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);
CREATE INDEX idx_products_category_active ON products(category_id) WHERE is_active = TRUE;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Constraint Naming</h2>

          <CodeBlock
            title="SQL: Constraint Naming Conventions"
            language="sql"
            code={`-- Primary key: pk_{table}
ALTER TABLE users ADD CONSTRAINT pk_users PRIMARY KEY (id);
ALTER TABLE posts ADD CONSTRAINT pk_posts PRIMARY KEY (id);

-- Foreign key: fk_{table}_{referenced_table}
ALTER TABLE posts ADD CONSTRAINT fk_posts_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE order_items ADD CONSTRAINT fk_order_items_order_id
  FOREIGN KEY (order_id) REFERENCES orders(id);

ALTER TABLE order_items ADD CONSTRAINT fk_order_items_product_id
  FOREIGN KEY (product_id) REFERENCES products(id);

-- Unique constraint: uk_{table}_{column}
ALTER TABLE users ADD CONSTRAINT uk_users_email UNIQUE (email);
ALTER TABLE posts ADD CONSTRAINT uk_posts_slug UNIQUE (slug);

-- Check constraint: ck_{table}_{column}_{description}
ALTER TABLE users ADD CONSTRAINT ck_users_email_format
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');

ALTER TABLE products ADD CONSTRAINT ck_products_price_positive
  CHECK (price > 0);

-- Default constraint: Usually unnamed, but can be named
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT NOW();

-- Naming patterns:
-- - Prefix: pk_, fk_, uk_, ck_
-- - Table name: users, posts
-- - Column/description: email, user_id, email_format

-- Examples:
CREATE TABLE orders (
  id SERIAL,
  user_id INTEGER,
  total_amount NUMERIC,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT pk_orders PRIMARY KEY (id),
  CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT uk_orders_number UNIQUE (order_number),
  CONSTRAINT ck_orders_total_positive CHECK (total_amount >= 0),
  CONSTRAINT ck_orders_status_valid CHECK (status IN ('pending', 'completed', 'cancelled'))
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Naming Conventions</h2>

          <CodeBlock
            title="Prisma: Naming in Schema"
            language="prisma"
            code={`// Prisma schema with naming conventions

// Table names: Plural, PascalCase (Prisma convention)
// Use @@map to map to snake_case database names
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  firstName String?  @map("first_name")  // camelCase in Prisma, snake_case in DB
  lastName  String?  @map("last_name")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  posts     Post[]
  
  @@map("users")  // Map to snake_case table name
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  userId    Int      @map("user_id")  // Foreign key: snake_case
  createdAt DateTime @default(now()) @map("created_at")
  
  user      User     @relation(fields: [userId], references: [id])
  
  @@map("posts")
}

// Join table
model PostCategory {
  postId     Int @map("post_id")
  categoryId Int @map("category_id")
  
  post     Post     @relation(fields: [postId], references: [id])
  category Category @relation(fields: [categoryId], references: [id])
  
  @@id([postId, categoryId])
  @@map("post_categories")
}

// Boolean fields: camelCase in Prisma
model User {
  id            Int      @id @default(autoincrement())
  email         String   @unique
  isActive      Boolean  @default(true) @map("is_active")
  hasVerifiedEmail Boolean @default(false) @map("has_verified_email")
  
  @@map("users")
}

// Indexes: Use @@index
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  userId    Int      @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")
  
  user      User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([createdAt])
  @@index([userId, createdAt])
  @@map("posts")
}

// Unique constraints
model User {
  id    Int    @id @default(autoincrement())
  email String @unique  // Creates unique index
  username String @unique
  
  @@map("users")
}

// Composite unique
model PostCategory {
  postId     Int @map("post_id")
  categoryId Int @map("category_id")
  
  @@unique([postId, categoryId])
  @@map("post_categories")
}`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Be consistent</strong> - use same naming pattern throughout</li>
              <li><strong>Use snake_case</strong> - for database objects (tables, columns)</li>
              <li><strong>Use descriptive names</strong> - avoid abbreviations unless standard</li>
              <li><strong>Use plural for tables</strong> - users, orders, products</li>
              <li><strong>Use singular for columns</strong> - email, name, created_at</li>
              <li><strong>Prefix indexes</strong> - idx_ for easy identification</li>
              <li><strong>Name constraints</strong> - makes management easier</li>
              <li><strong>Document conventions</strong> - so team follows same pattern</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

