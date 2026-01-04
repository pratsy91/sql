import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'DROP TABLE - PostgreSQL Learning',
  description: 'Learn about dropping tables in PostgreSQL including CASCADE vs RESTRICT options',
};

export default function DropTable() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">DROP TABLE</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Basic DROP TABLE</h2>

          <CodeBlock
            title="SQL: DROP TABLE"
            language="sql"
            code={`-- Drop table
DROP TABLE users;

-- Drop table if exists (prevents error if table doesn't exist)
DROP TABLE IF EXISTS users;

-- Drop multiple tables
DROP TABLE users, products, orders;

-- Drop table with CASCADE (drops dependent objects)
DROP TABLE users CASCADE;

-- Drop table with RESTRICT (default, fails if dependencies exist)
DROP TABLE users RESTRICT;`}
          />
          <CodeBlock
            title="Prisma: DROP TABLE"
            language="prisma"
            code={`// Remove model from schema.prisma
// model User {
//   id   Int    @id @default(autoincrement())
//   name String
// }

// Generate migration
npx prisma migrate dev --name remove_user_table

// Prisma will generate DROP TABLE statement

// Or manually drop using raw SQL
await prisma.$executeRaw\`DROP TABLE IF EXISTS users CASCADE\`;

// Note: Be careful with CASCADE as it drops dependent objects`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">CASCADE vs RESTRICT</h2>

          <CodeBlock
            title="SQL: CASCADE vs RESTRICT"
            language="sql"
            code={`-- RESTRICT (default) - fails if dependencies exist
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  category_id INTEGER REFERENCES categories(id)
);

-- This will fail because products table depends on categories
DROP TABLE categories RESTRICT;
-- Error: cannot drop table categories because other objects depend on it

-- CASCADE - drops dependent objects
DROP TABLE categories CASCADE;
-- This will drop both categories and products tables

-- Check dependencies before dropping
SELECT 
  dependent_ns.nspname AS dependent_schema,
  dependent_table.relname AS dependent_table,
  source_ns.nspname AS source_schema,
  source_table.relname AS source_table
FROM pg_depend
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
JOIN pg_class AS dependent_table ON pg_rewrite.ev_class = dependent_table.oid
JOIN pg_class AS source_table ON pg_depend.refobjid = source_table.oid
JOIN pg_namespace dependent_ns ON dependent_table.relnamespace = dependent_ns.oid
JOIN pg_namespace source_ns ON source_table.relnamespace = source_ns.oid
WHERE source_table.relname = 'categories';`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}

