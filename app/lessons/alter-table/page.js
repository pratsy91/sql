import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'ALTER TABLE - PostgreSQL Learning',
  description: 'Learn about altering tables in PostgreSQL including adding/removing columns, modifying columns, renaming, and changing constraints',
};

export default function AlterTable() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">ALTER TABLE</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Add Columns</h2>

          <CodeBlock
            title="SQL: Add Columns"
            language="sql"
            code={`-- Add single column
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Add column with default value
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- Add column with NOT NULL (requires default or existing data)
ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Add multiple columns
ALTER TABLE users 
  ADD COLUMN first_name VARCHAR(50),
  ADD COLUMN last_name VARCHAR(50),
  ADD COLUMN middle_name VARCHAR(50);

-- Add column at specific position (PostgreSQL doesn't support this directly)
-- Columns are always added at the end
-- Use views or recreate table to change order`}
          />
          <CodeBlock
            title="Prisma: Add Columns"
            language="prisma"
            code={`// schema.prisma - Add new field
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  email     String
  phone     String?  // New column
  status    String   @default("active")  // New column with default
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("users")
}

// Generate and apply migration
npx prisma migrate dev --name add_phone_and_status

// Prisma automatically generates ALTER TABLE statements`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Remove Columns</h2>

          <CodeBlock
            title="SQL: Remove Columns"
            language="sql"
            code={`-- Drop column
ALTER TABLE users DROP COLUMN phone;

-- Drop column with CASCADE (drops dependent objects)
ALTER TABLE users DROP COLUMN phone CASCADE;

-- Drop column with RESTRICT (default, fails if dependencies exist)
ALTER TABLE users DROP COLUMN phone RESTRICT;

-- Drop multiple columns
ALTER TABLE users 
  DROP COLUMN phone,
  DROP COLUMN fax;

-- Drop column if exists
ALTER TABLE users DROP COLUMN IF EXISTS phone;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Modify Columns</h2>

          <CodeBlock
            title="SQL: Modify Columns"
            language="sql"
            code={`-- Change column data type
ALTER TABLE users ALTER COLUMN phone TYPE VARCHAR(30);

-- Change type with USING clause (for type conversion)
ALTER TABLE products ALTER COLUMN price TYPE DECIMAL(10,2) 
  USING price::DECIMAL(10,2);

-- Set column default
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';

-- Drop column default
ALTER TABLE users ALTER COLUMN status DROP DEFAULT;

-- Set NOT NULL constraint
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- Drop NOT NULL constraint
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Rename column
ALTER TABLE users RENAME COLUMN phone TO phone_number;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Rename Operations</h2>

          <CodeBlock
            title="SQL: Rename Operations"
            language="sql"
            code={`-- Rename table
ALTER TABLE old_table_name RENAME TO new_table_name;

-- Rename column
ALTER TABLE users RENAME COLUMN old_column TO new_column;

-- Rename constraint
ALTER TABLE users RENAME CONSTRAINT old_constraint_name TO new_constraint_name;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Change Constraints</h2>

          <CodeBlock
            title="SQL: Modify Constraints"
            language="sql"
            code={`-- Add constraint
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
ALTER TABLE users ADD CONSTRAINT users_age_check CHECK (age >= 0);
ALTER TABLE users ADD CONSTRAINT users_fk_role FOREIGN KEY (role_id) REFERENCES roles(id);

-- Drop constraint
ALTER TABLE users DROP CONSTRAINT users_email_unique;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_age_check;

-- Rename constraint
ALTER TABLE users RENAME CONSTRAINT old_name TO new_name;

-- Disable constraint (for CHECK constraints)
ALTER TABLE users DISABLE TRIGGER ALL;  -- Disable triggers
-- Note: CHECK constraints cannot be disabled, must be dropped

-- Enable constraint
ALTER TABLE users ENABLE TRIGGER ALL;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}

