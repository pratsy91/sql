import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'System Catalogs - PostgreSQL Learning',
  description: 'Learn about PostgreSQL system catalogs including pg_class, pg_attribute, pg_index, pg_constraint, pg_proc, and pg_type',
};

export default function SystemCatalogs() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">System Catalogs</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What are System Catalogs?</h2>
          <p className="mb-4">
            System catalogs are special tables that store metadata about the database. 
            They contain information about tables, columns, indexes, constraints, functions, types, and more. 
            PostgreSQL uses these catalogs to manage the database structure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">pg_class - Tables and Relations</h2>

          <CodeBlock
            title="SQL: pg_class Catalog"
            language="sql"
            code={`-- pg_class stores information about tables, indexes, sequences, views, etc.

-- View all tables
SELECT 
  relname AS table_name,
  relkind AS relation_type,
  reltuples AS estimated_rows,
  pg_size_pretty(pg_total_relation_size(oid)) AS total_size
FROM pg_class
WHERE relkind = 'r'  -- 'r' = regular table
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY relname;

-- Relation types:
-- 'r' = regular table
-- 'i' = index
-- 'S' = sequence
-- 'v' = view
-- 'm' = materialized view
-- 'c' = composite type
-- 't' = TOAST table
-- 'f' = foreign table

-- Get table information
SELECT 
  relname AS table_name,
  reltuples AS estimated_rows,
  relpages AS pages,
  relallvisible AS visible_pages,
  relfrozenxid AS frozen_xid,
  relminmxid AS min_multixact_id
FROM pg_class
WHERE relname = 'users';

-- View all relations (tables, views, indexes)
SELECT 
  relname AS relation_name,
  CASE relkind
    WHEN 'r' THEN 'table'
    WHEN 'i' THEN 'index'
    WHEN 'S' THEN 'sequence'
    WHEN 'v' THEN 'view'
    WHEN 'm' THEN 'materialized view'
    WHEN 'c' THEN 'composite type'
    WHEN 't' THEN 'TOAST table'
    WHEN 'f' THEN 'foreign table'
  END AS relation_type,
  pg_size_pretty(pg_relation_size(oid)) AS size
FROM pg_class
WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY relkind, relname;

-- Get table OID
SELECT oid, relname 
FROM pg_class 
WHERE relname = 'users';

-- Check if table exists
SELECT EXISTS(
  SELECT 1 FROM pg_class 
  WHERE relname = 'users' 
    AND relkind = 'r'
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">pg_attribute - Column Information</h2>

          <CodeBlock
            title="SQL: pg_attribute Catalog"
            language="sql"
            code={`-- pg_attribute stores information about table columns

-- View all columns in a table
SELECT 
  a.attname AS column_name,
  t.typname AS data_type,
  a.attnotnull AS not_null,
  a.atthasdef AS has_default,
  a.attnum AS column_number
FROM pg_attribute a
JOIN pg_type t ON a.atttypid = t.oid
JOIN pg_class c ON a.attrelid = c.oid
WHERE c.relname = 'users'
  AND a.attnum > 0  -- Exclude system columns
  AND NOT a.attisdropped
ORDER BY a.attnum;

-- Get column details with constraints
SELECT 
  a.attname AS column_name,
  t.typname AS data_type,
  CASE 
    WHEN t.typname = 'varchar' THEN t.typname || '(' || a.atttypmod || ')'
    WHEN t.typname = 'numeric' THEN t.typname || '(' || 
      (a.atttypmod >> 16) || ',' || ((a.atttypmod - 4) & 65535) || ')'
    ELSE t.typname
  END AS full_type,
  a.attnotnull AS not_null,
  pg_get_expr(adbin, adrelid) AS default_value
FROM pg_attribute a
JOIN pg_type t ON a.atttypid = t.oid
JOIN pg_class c ON a.attrelid = c.oid
LEFT JOIN pg_attrdef ad ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
WHERE c.relname = 'users'
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;

-- View column statistics
SELECT 
  a.attname AS column_name,
  s.n_distinct AS distinct_values,
  s.null_frac AS null_fraction,
  s.avg_width AS average_width,
  s.most_common_vals AS most_common_values
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
LEFT JOIN pg_stats s ON s.tablename = c.relname AND s.attname = a.attname
WHERE c.relname = 'users'
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">pg_index - Index Information</h2>

          <CodeBlock
            title="SQL: pg_index Catalog"
            language="sql"
            code={`-- pg_index stores information about indexes

-- View all indexes on a table
SELECT 
  i.indexrelid::regclass AS index_name,
  i.indrelid::regclass AS table_name,
  i.indisunique AS is_unique,
  i.indisprimary AS is_primary_key,
  i.indisexclusion AS is_exclusion,
  i.indimmediate AS is_immediate,
  i.indisclustered AS is_clustered,
  pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size
FROM pg_index i
JOIN pg_class c ON i.indrelid = c.oid
WHERE c.relname = 'users'
ORDER BY i.indexrelid::regclass::text;

-- Get index columns
SELECT 
  i.indexrelid::regclass AS index_name,
  a.attname AS column_name,
  am.amname AS index_method
FROM pg_index i
JOIN pg_class c ON i.indrelid = c.oid
JOIN pg_class ic ON i.indexrelid = ic.oid
JOIN pg_am am ON ic.relam = am.oid
JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
WHERE c.relname = 'users'
ORDER BY i.indexrelid::regclass::text, array_position(i.indkey, a.attnum);

-- View index definition
SELECT 
  indexrelid::regclass AS index_name,
  pg_get_indexdef(indexrelid) AS index_definition
FROM pg_index
WHERE indrelid = 'users'::regclass::oid;

-- Find unused indexes
SELECT 
  i.indexrelid::regclass AS index_name,
  i.indrelid::regclass AS table_name,
  s.idx_scan AS index_scans,
  pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size
FROM pg_index i
JOIN pg_stat_user_indexes s ON i.indexrelid = s.indexrelid
WHERE s.idx_scan = 0
  AND i.indisprimary = false
ORDER BY pg_relation_size(i.indexrelid) DESC;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">pg_constraint - Constraints</h2>

          <CodeBlock
            title="SQL: pg_constraint Catalog"
            language="sql"
            code={`-- pg_constraint stores information about constraints

-- View all constraints on a table
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass::oid
ORDER BY contype, conname;

-- Constraint types:
-- 'p' = primary key
-- 'f' = foreign key
-- 'u' = unique
-- 'c' = check
-- 't' = trigger
-- 'x' = exclusion

-- View foreign key constraints
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'users';

-- View check constraints
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass::oid
  AND contype = 'c';

-- View unique constraints
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass::oid
  AND contype = 'u';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">pg_proc - Functions and Procedures</h2>

          <CodeBlock
            title="SQL: pg_proc Catalog"
            language="sql"
            code={`-- pg_proc stores information about functions and procedures

-- View all functions
SELECT 
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments,
  pg_get_function_result(oid) AS return_type,
  prokind AS function_kind,
  prosecdef AS security_definer,
  proisstrict AS is_strict,
  provolatile AS volatility
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- Function kinds:
-- 'f' = function
-- 'p' = procedure
-- 'a' = aggregate
-- 'w' = window function

-- Volatility:
-- 'i' = immutable (always returns same result)
-- 's' = stable (returns same result within transaction)
-- 'v' = volatile (can return different results)

-- View function source code
SELECT 
  proname AS function_name,
  prosrc AS source_code,
  proconfig AS configuration
FROM pg_proc
WHERE proname = 'my_function';

-- View function dependencies
SELECT 
  p.proname AS function_name,
  d.classid::regclass AS dependent_type,
  d.objid::regclass AS dependent_object
FROM pg_proc p
JOIN pg_depend d ON p.oid = d.refobjid
WHERE p.proname = 'my_function';

-- View all user-defined functions
SELECT 
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, p.proname;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">pg_type - Data Types</h2>

          <CodeBlock
            title="SQL: pg_type Catalog"
            language="sql"
            code={`-- pg_type stores information about data types

-- View all data types
SELECT 
  typname AS type_name,
  typtype AS type_category,
  typcategory AS type_category_char,
  typlen AS type_length,
  typbyval AS passed_by_value
FROM pg_type
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY typname;

-- Type categories:
-- 'b' = base type
-- 'c' = composite type
-- 'd' = domain
-- 'e' = enum
-- 'p' = pseudo-type
-- 'r' = range type

-- View enum types
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typtype = 'e'
ORDER BY t.typname, e.enumsortorder;

-- View composite types
SELECT 
  t.typname AS composite_type_name,
  a.attname AS attribute_name,
  at.typname AS attribute_type
FROM pg_type t
JOIN pg_class c ON t.typrelid = c.oid
JOIN pg_attribute a ON a.attrelid = c.oid
JOIN pg_type at ON a.atttypid = at.oid
WHERE t.typtype = 'c'
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY t.typname, a.attnum;

-- View domain types
SELECT 
  t.typname AS domain_name,
  bt.typname AS base_type,
  pg_get_constraintdef(d.oid) AS constraint_definition
FROM pg_type t
JOIN pg_type bt ON t.typbasetype = bt.oid
LEFT JOIN pg_constraint d ON t.oid = d.contypid
WHERE t.typtype = 'd'
ORDER BY t.typname;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: System Catalogs</h2>

          <CodeBlock
            title="Prisma: Querying System Catalogs"
            language="prisma"
            code={`// Query system catalogs using raw SQL

// Get all tables
const tables = await prisma.$queryRaw\`
  SELECT 
    relname AS table_name,
    relkind AS relation_type,
    reltuples AS estimated_rows,
    pg_size_pretty(pg_total_relation_size(oid)) AS total_size
  FROM pg_class
  WHERE relkind = 'r'
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ORDER BY relname
\`;

// Get table columns
const columns = await prisma.$queryRaw\`
  SELECT 
    a.attname AS column_name,
    t.typname AS data_type,
    a.attnotnull AS not_null
  FROM pg_attribute a
  JOIN pg_type t ON a.atttypid = t.oid
  JOIN pg_class c ON a.attrelid = c.oid
  WHERE c.relname = $1
    AND a.attnum > 0
    AND NOT a.attisdropped
  ORDER BY a.attnum
\`, 'users';

// Get indexes
const indexes = await prisma.$queryRaw\`
  SELECT 
    i.indexrelid::regclass AS index_name,
    i.indrelid::regclass AS table_name,
    i.indisunique AS is_unique,
    pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size
  FROM pg_index i
  JOIN pg_class c ON i.indrelid = c.oid
  WHERE c.relname = $1
\`, 'users';

// Get constraints
const constraints = await prisma.$queryRaw\`
  SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
  FROM pg_constraint
  WHERE conrelid = $1::regclass::oid
  ORDER BY contype, conname
\`, 'users';

// Get functions
const functions = await prisma.$queryRaw\`
  SELECT 
    proname AS function_name,
    pg_get_function_arguments(oid) AS arguments,
    pg_get_function_result(oid) AS return_type
  FROM pg_proc
  WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ORDER BY proname
\`;

// Get enum types
const enums = await prisma.$queryRaw\`
  SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  WHERE t.typtype = 'e'
  ORDER BY t.typname, e.enumsortorder
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use system catalogs</strong> - for metadata queries</li>
              <li><strong>Understand catalog structure</strong> - know what each catalog stores</li>
              <li><strong>Use information_schema</strong> - for standard SQL compatibility</li>
              <li><strong>Query efficiently</strong> - system catalogs can be large</li>
              <li><strong>Use regclass</strong> - for OID to name conversion</li>
              <li><strong>Filter by namespace</strong> - to get only user objects</li>
              <li><strong>Check permissions</strong> - some catalogs require superuser</li>
              <li><strong>Document queries</strong> - system catalog queries can be complex</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

