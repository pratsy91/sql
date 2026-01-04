import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'CREATE SCHEMA - PostgreSQL Learning',
  description: 'Learn about creating schemas in PostgreSQL, schema search paths, and Prisma integration',
};

export default function CreateSchema() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">CREATE SCHEMA</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Basic Schema Creation</h2>
          <p className="mb-4">
            A schema is a namespace that contains database objects. The default schema is <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">public</code>.
          </p>

          <CodeBlock
            title="SQL: CREATE SCHEMA"
            language="sql"
            code={`-- Create a schema
CREATE SCHEMA myschema;

-- Create schema with authorization
CREATE SCHEMA myschema AUTHORIZATION myuser;

-- Create schema if not exists (PostgreSQL 9.5+)
CREATE SCHEMA IF NOT EXISTS myschema;

-- List all schemas
\\dn

-- Or using SQL
SELECT schema_name 
FROM information_schema.schemata
WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schema_name;

-- Drop schema
DROP SCHEMA myschema;

-- Drop schema with all objects (CASCADE)
DROP SCHEMA myschema CASCADE;`}
          />
          <CodeBlock
            title="Prisma: Schema Usage"
            language="prisma"
            code={`// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public", "myschema"]  // Specify schemas to use
}

// Models in default public schema
model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String @unique
}

// Models in custom schema
model Product {
  id    Int    @id @default(autoincrement())
  name  String
  price Float
  
  @@schema("myschema")  // Specify schema for this model
}

// Create schema manually before running migrations
// Or use raw SQL in migration
await prisma.$executeRaw\`CREATE SCHEMA IF NOT EXISTS myschema\`;

// Then run migrations
npx prisma migrate dev --name add_schema`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Schema Search Path</h2>
          <p className="mb-4">
            The search path determines the order PostgreSQL searches for objects when no schema is specified.
          </p>

          <CodeBlock
            title="SQL: Schema Search Path"
            language="sql"
            code={`-- Show current search path
SHOW search_path;

-- Default search path: "$user", public

-- Set search path for session
SET search_path TO myschema, public;

-- Set search path with multiple schemas
SET search_path TO schema1, schema2, public;

-- Set search path for database (persistent)
ALTER DATABASE mydatabase SET search_path TO myschema, public;

-- Set search path for role
ALTER ROLE myuser SET search_path TO myschema, public;

-- Reset to default
SET search_path TO "$user", public;

-- Create objects in specific schema
CREATE TABLE myschema.users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);

-- Access with schema prefix
SELECT * FROM myschema.users;

-- Access without prefix (if in search path)
SET search_path TO myschema, public;
SELECT * FROM users;  -- Searches myschema first`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Schema Privileges</h2>

          <CodeBlock
            title="SQL: Schema Privileges"
            language="sql"
            code={`-- Grant usage on schema
GRANT USAGE ON SCHEMA myschema TO myuser;

-- Grant create privilege
GRANT CREATE ON SCHEMA myschema TO myuser;

-- Grant all privileges
GRANT ALL ON SCHEMA myschema TO myuser;

-- Revoke privileges
REVOKE CREATE ON SCHEMA myschema FROM myuser;

-- View schema privileges
SELECT 
  nspname AS schema_name,
  nspowner::regrole AS owner
FROM pg_namespace
WHERE nspname = 'myschema';`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}

