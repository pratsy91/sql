import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'NOT NULL Constraint - PostgreSQL Learning',
  description: 'Learn about NOT NULL constraints in PostgreSQL at column level with SQL and Prisma examples',
};

export default function NotNullConstraint() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">NOT NULL Constraint</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Column-Level NOT NULL</h2>
          <p className="mb-4">
            The NOT NULL constraint ensures that a column cannot contain NULL values. This is a column-level constraint.
          </p>

          <CodeBlock
            title="SQL: NOT NULL Constraint"
            language="sql"
            code={`-- Create table with NOT NULL constraints
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),  -- Allows NULL
  last_name VARCHAR(50),   -- Allows NULL
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert with NULL in NOT NULL column (will fail)
INSERT INTO users (username, email, password_hash, first_name)
VALUES (NULL, 'test@example.com', 'hash123', 'John');
-- Error: null value in column "username" violates not-null constraint

-- Valid insert
INSERT INTO users (username, email, password_hash, first_name)
VALUES ('johndoe', 'test@example.com', 'hash123', 'John');

-- Add NOT NULL to existing column
ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;

-- Remove NOT NULL constraint
ALTER TABLE users ALTER COLUMN first_name DROP NOT NULL;

-- Add NOT NULL to column with existing NULLs (requires default or update first)
-- Step 1: Update existing NULLs
UPDATE users SET first_name = '' WHERE first_name IS NULL;

-- Step 2: Add NOT NULL constraint
ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;`}
          />
          <CodeBlock
            title="Prisma: NOT NULL Constraint"
            language="prisma"
            code={`// schema.prisma
model User {
  id          Int       @id @default(autoincrement())
  username    String    // NOT NULL by default in Prisma
  email       String    // NOT NULL by default
  passwordHash String   @map("password_hash")  // NOT NULL
  firstName   String?   @map("first_name")     // Nullable (optional)
  lastName    String?   @map("last_name")      // Nullable (optional)
  createdAt   DateTime  @default(now()) @map("created_at")  // NOT NULL with default
  
  @@map("users")
}

// Usage - Prisma enforces NOT NULL at application level
const user = await prisma.user.create({
  data: {
    username: 'johndoe',
    email: 'test@example.com',
    passwordHash: 'hash123',
    firstName: 'John',  // Optional
    // lastName can be omitted (will be NULL)
  },
});

// This will fail (username is required)
try {
  await prisma.user.create({
    data: {
      email: 'test@example.com',
      passwordHash: 'hash123',
    },
  });
} catch (error) {
  console.error('Missing required field:', error);
}

// Add NOT NULL constraint to existing column
// Update schema.prisma:
// firstName String @map("first_name")  // Remove the ? to make it required

// Then run migration
npx prisma migrate dev --name make_first_name_required`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">NOT NULL with Defaults</h2>

          <CodeBlock
            title="SQL: NOT NULL with Defaults"
            language="sql"
            code={`-- NOT NULL with default value
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  stock INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert without specifying NOT NULL columns with defaults
INSERT INTO products (name) VALUES ('Laptop');
-- price, stock, status, created_at use defaults

-- NOT NULL with function defaults
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL DEFAULT 'ORD-' || nextval('order_seq')::text,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use NOT NULL</strong> for required fields (IDs, emails, critical data)</li>
              <li><strong>Combine with DEFAULT</strong> when you want a value but allow omission</li>
              <li><strong>Consider nullable</strong> for optional fields (middle names, optional metadata)</li>
              <li><strong>Add NOT NULL</strong> to existing columns only after ensuring no NULLs exist</li>
              <li><strong>Primary keys</strong> are automatically NOT NULL</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

