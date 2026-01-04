import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'UPSERT (INSERT ... ON CONFLICT) - PostgreSQL Learning',
  description: 'Learn about UPSERT operations in PostgreSQL using INSERT ... ON CONFLICT with DO NOTHING, DO UPDATE, and conflict targets',
};

export default function Upsert() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">UPSERT (INSERT ... ON CONFLICT)</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">DO NOTHING</h2>

          <CodeBlock
            title="SQL: ON CONFLICT DO NOTHING"
            language="sql"
            code={`-- ON CONFLICT DO NOTHING (ignore conflict)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert, ignore if username exists
INSERT INTO users (username, email)
VALUES ('johndoe', 'john@example.com')
ON CONFLICT (username) DO NOTHING;

-- Insert, ignore if email exists
INSERT INTO users (username, email)
VALUES ('johndoe', 'john@example.com')
ON CONFLICT (email) DO NOTHING;

-- Multiple conflict targets
INSERT INTO user_roles (user_id, role_id)
VALUES (1, 1)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ON CONFLICT DO NOTHING with RETURNING
INSERT INTO users (username, email)
VALUES ('johndoe', 'john@example.com')
ON CONFLICT (username) DO NOTHING
RETURNING *;
-- Returns NULL if conflict occurred`}
          />
          <CodeBlock
            title="Prisma: DO NOTHING"
            language="prisma"
            code={`// Prisma handles conflicts with createMany skipDuplicates
const result = await prisma.user.createMany({
  data: [
    { username: 'johndoe', email: 'john@example.com' },
    { username: 'janedoe', email: 'jane@example.com' },
  ],
  skipDuplicates: true,  // Ignores conflicts
});

// For single record, use try-catch or upsert
try {
  await prisma.user.create({
    data: {
      username: 'johndoe',
      email: 'john@example.com',
    },
  });
} catch (error) {
  // Handle unique constraint violation
  if (error.code === 'P2002') {
    // Duplicate entry, ignore
  }
}

// Or use upsert with same create/update
const user = await prisma.user.upsert({
  where: { username: 'johndoe' },
  update: {},  // No update, effectively DO NOTHING
  create: {
    username: 'johndoe',
    email: 'john@example.com',
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">DO UPDATE</h2>

          <CodeBlock
            title="SQL: ON CONFLICT DO UPDATE"
            language="sql"
            code={`-- ON CONFLICT DO UPDATE (update on conflict)
INSERT INTO users (username, email, last_login)
VALUES ('johndoe', 'newemail@example.com', CURRENT_TIMESTAMP)
ON CONFLICT (username) 
DO UPDATE SET 
  email = EXCLUDED.email,
  last_login = EXCLUDED.last_login;

-- Update specific columns only
INSERT INTO products (sku, name, price, stock)
VALUES ('SKU-001', 'Product Name', 99.99, 10)
ON CONFLICT (sku) 
DO UPDATE SET 
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

-- Update with expressions
INSERT INTO users (username, login_count)
VALUES ('johndoe', 1)
ON CONFLICT (username) 
DO UPDATE SET 
  login_count = users.login_count + 1,
  last_login = CURRENT_TIMESTAMP;

-- Conditional update
INSERT INTO products (sku, name, price)
VALUES ('SKU-001', 'Product', 89.99)
ON CONFLICT (sku) 
DO UPDATE SET 
  price = EXCLUDED.price
WHERE products.price != EXCLUDED.price;`}
          />
          <CodeBlock
            title="Prisma: DO UPDATE"
            language="prisma"
            code={`// Prisma upsert handles DO UPDATE
const user = await prisma.user.upsert({
  where: { username: 'johndoe' },
  update: {
    email: 'newemail@example.com',
    lastLogin: new Date(),
  },
  create: {
    username: 'johndoe',
    email: 'newemail@example.com',
    lastLogin: new Date(),
  },
});

// Update with increment
const user = await prisma.user.upsert({
  where: { username: 'johndoe' },
  update: {
    loginCount: {
      increment: 1,
    },
    lastLogin: new Date(),
  },
  create: {
    username: 'johndoe',
    email: 'john@example.com',
    loginCount: 1,
    lastLogin: new Date(),
  },
});

// Complex DO UPDATE with raw SQL
await prisma.$executeRaw\`
  INSERT INTO products (sku, name, price)
  VALUES ('SKU-001', 'Product', 89.99)
  ON CONFLICT (sku) 
  DO UPDATE SET 
    price = EXCLUDED.price
  WHERE products.price != EXCLUDED.price
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Conflict Targets</h2>

          <CodeBlock
            title="SQL: Conflict Targets"
            language="sql"
            code={`-- Conflict on unique column
INSERT INTO users (username, email)
VALUES ('johndoe', 'john@example.com')
ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email;

-- Conflict on unique constraint name
INSERT INTO users (username, email)
VALUES ('johndoe', 'john@example.com')
ON CONFLICT ON CONSTRAINT users_username_key 
DO UPDATE SET email = EXCLUDED.email;

-- Conflict on composite unique constraint
INSERT INTO user_roles (user_id, role_id)
VALUES (1, 1)
ON CONFLICT (user_id, role_id) 
DO UPDATE SET created_at = CURRENT_TIMESTAMP;

-- Conflict on unique index
CREATE UNIQUE INDEX idx_users_lower_email ON users(LOWER(email));

INSERT INTO users (username, email)
VALUES ('johndoe', 'John@Example.com')
ON CONFLICT (LOWER(email)) 
DO UPDATE SET username = EXCLUDED.username;

-- Conflict on partial unique index
CREATE UNIQUE INDEX idx_active_users_email ON users(email) 
WHERE status = 'active';

INSERT INTO users (username, email, status)
VALUES ('johndoe', 'john@example.com', 'active')
ON CONFLICT (email) WHERE status = 'active'
DO UPDATE SET username = EXCLUDED.username;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">UPSERT with RETURNING</h2>

          <CodeBlock
            title="SQL: UPSERT with RETURNING"
            language="sql"
            code={`-- Return inserted or updated row
INSERT INTO users (username, email)
VALUES ('johndoe', 'john@example.com')
ON CONFLICT (username) 
DO UPDATE SET email = EXCLUDED.email
RETURNING *;

-- Return with indicator
INSERT INTO users (username, email, login_count)
VALUES ('johndoe', 'john@example.com', 1)
ON CONFLICT (username) 
DO UPDATE SET 
  login_count = users.login_count + 1,
  last_login = CURRENT_TIMESTAMP
RETURNING 
  *,
  (xmax = 0) AS inserted;  -- true if inserted, false if updated`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}

