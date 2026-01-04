import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Table Inheritance - PostgreSQL Learning',
  description: 'Learn about PostgreSQL table inheritance including CREATE TABLE ... INHERITS and querying inherited tables',
};

export default function TableInheritance() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Table Inheritance</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is Table Inheritance?</h2>
          <p className="mb-4">
            PostgreSQL supports table inheritance, where child tables inherit columns and constraints 
            from parent tables. This allows for data organization and can be used for partitioning-like 
            functionality. Queries on parent tables automatically include child tables.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">CREATE TABLE ... INHERITS</h2>

          <CodeBlock
            title="SQL: Table Inheritance"
            language="sql"
            code={`-- Create parent table
CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create child table that inherits
CREATE TABLE cars (
  doors INTEGER,
  fuel_type TEXT
) INHERITS (vehicles);

-- Create another child table
CREATE TABLE trucks (
  cargo_capacity NUMERIC,
  towing_capacity NUMERIC
) INHERITS (vehicles);

-- Insert into child table
INSERT INTO cars (make, model, year, doors, fuel_type)
VALUES ('Toyota', 'Camry', 2024, 4, 'gasoline');
-- Data stored in cars table

-- Insert into parent table
INSERT INTO vehicles (make, model, year)
VALUES ('Generic', 'Vehicle', 2024);
-- Data stored in vehicles table

-- Query parent table (includes all children)
SELECT * FROM vehicles;
-- Returns rows from vehicles, cars, and trucks

-- Query only parent table
SELECT * FROM ONLY vehicles;
-- Returns only rows from vehicles table

-- Query child table
SELECT * FROM cars;
-- Returns only rows from cars table

-- Child tables inherit columns
SELECT id, make, model, doors, fuel_type FROM cars;
-- Can access both inherited and child-specific columns`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Querying Inherited Tables</h2>

          <CodeBlock
            title="SQL: Querying Inheritance Hierarchy"
            language="sql"
            code={`-- Query parent (includes all children)
SELECT * FROM vehicles WHERE year > 2020;
-- Searches vehicles, cars, and trucks

-- Query with ONLY (excludes children)
SELECT * FROM ONLY vehicles WHERE year > 2020;
-- Only searches vehicles table

-- Query specific child
SELECT * FROM cars WHERE fuel_type = 'electric';
-- Only searches cars table

-- Join with inheritance
SELECT v.make, v.model, c.doors
FROM vehicles v
LEFT JOIN cars c ON v.id = c.id
WHERE v.year > 2020;

-- Filter by table type
SELECT 
  make,
  model,
  CASE 
    WHEN tableoid::regclass::text = 'vehicles' THEN 'Vehicle'
    WHEN tableoid::regclass::text = 'cars' THEN 'Car'
    WHEN tableoid::regclass::text = 'trucks' THEN 'Truck'
  END AS vehicle_type
FROM vehicles;

-- Count by table type
SELECT 
  tableoid::regclass::text AS table_name,
  COUNT(*) AS count
FROM vehicles
GROUP BY tableoid::regclass::text;

-- Check inheritance hierarchy
SELECT 
  c.relname AS child_table,
  p.relname AS parent_table
FROM pg_inherits i
JOIN pg_class c ON i.inhrelid = c.oid
JOIN pg_class p ON i.inhparent = p.oid
ORDER BY c.relname;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Constraints and Inheritance</h2>

          <CodeBlock
            title="SQL: Constraints in Inheritance"
            language="sql"
            code={`-- Parent table constraints
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC CHECK (price > 0),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Child inherits constraints
CREATE TABLE electronics (
  warranty_months INTEGER
) INHERITS (products);
-- Inherits: PRIMARY KEY, NOT NULL, CHECK, DEFAULT

-- Add constraint to child
ALTER TABLE electronics 
ADD CONSTRAINT electronics_warranty_check 
CHECK (warranty_months > 0);

-- Unique constraints work per table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE
);

CREATE TABLE admins (
  admin_level INTEGER
) INHERITS (users);
-- Each table has separate unique constraint
-- Can have same email in users and admins

-- Foreign keys
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT,
  category_id INTEGER REFERENCES categories(id)
);

CREATE TABLE electronics (
  specs JSONB
) INHERITS (products);
-- Inherits foreign key constraint

-- Check inherited constraints
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE conrelid = 'electronics'::regclass;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Indexes and Inheritance</h2>

          <CodeBlock
            title="SQL: Indexes with Inheritance"
            language="sql"
            code={`-- Index on parent table
CREATE INDEX idx_vehicles_year ON vehicles(year);
-- Only applies to vehicles table, not children

-- Index on child table
CREATE INDEX idx_cars_fuel_type ON cars(fuel_type);
-- Only applies to cars table

-- Index on all tables (must create separately)
CREATE INDEX idx_vehicles_year ON vehicles(year);
CREATE INDEX idx_cars_year ON cars(year);
CREATE INDEX idx_trucks_year ON trucks(year);

-- Query uses appropriate index
EXPLAIN SELECT * FROM vehicles WHERE year = 2024;
-- May use index on each table

-- Unique indexes work per table
CREATE UNIQUE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE UNIQUE INDEX idx_cars_vin ON cars(vin);
-- Separate unique constraints per table

-- View indexes on inherited tables
SELECT 
  t.relname AS table_name,
  i.relname AS index_name,
  pg_get_indexdef(i.oid) AS index_def
FROM pg_index idx
JOIN pg_class i ON i.oid = idx.indexrelid
JOIN pg_class t ON t.oid = idx.indrelid
WHERE t.relname IN ('vehicles', 'cars', 'trucks')
ORDER BY t.relname, i.relname;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">ALTER TABLE and Inheritance</h2>

          <CodeBlock
            title="SQL: Modifying Inherited Tables"
            language="sql"
            code={`-- Add column to parent
ALTER TABLE vehicles ADD COLUMN color TEXT;
-- Automatically added to all child tables

-- Add column to child only
ALTER TABLE cars ADD COLUMN sunroof BOOLEAN;
-- Only added to cars table

-- Drop column from parent
ALTER TABLE vehicles DROP COLUMN color;
-- Removed from parent and all children

-- Drop column from child
ALTER TABLE cars DROP COLUMN sunroof;
-- Only removed from cars table

-- Rename parent table
ALTER TABLE vehicles RENAME TO transportation;
-- Children still inherit

-- Rename child table
ALTER TABLE cars RENAME TO automobiles;
-- Still inherits from parent

-- No INHERIT (remove inheritance)
ALTER TABLE cars NO INHERIT vehicles;
-- cars no longer inherits from vehicles
-- Existing data remains in cars table

-- Add INHERIT (add inheritance)
ALTER TABLE motorcycles INHERIT vehicles;
-- motorcycles now inherits from vehicles

-- Check inheritance
SELECT 
  c.relname AS child,
  p.relname AS parent
FROM pg_inherits i
JOIN pg_class c ON i.inhrelid = c.oid
JOIN pg_class p ON i.inhparent = p.oid;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Inheritance vs Partitioning</h2>

          <CodeBlock
            title="SQL: Inheritance vs Partitioning"
            language="sql"
            code={`-- Inheritance: Manual routing, flexible
CREATE TABLE orders_2024_q1 (
  CHECK (created_at >= '2024-01-01' AND created_at < '2024-04-01')
) INHERITS (orders);
-- Must use triggers or application logic to route inserts

-- Partitioning: Automatic routing, better performance
CREATE TABLE orders (
  ...
) PARTITION BY RANGE (created_at);
CREATE TABLE orders_2024_q1 PARTITION OF orders
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
-- Automatic routing, partition pruning

-- Inheritance use cases:
-- 1. Polymorphic data (different types with common base)
-- 2. Legacy systems
-- 3. When you need per-table constraints

-- Partitioning use cases:
-- 1. Large tables (millions of rows)
-- 2. Time-series data
-- 3. When you need automatic routing
-- 4. When you need partition pruning

-- Inheritance example: Different vehicle types
CREATE TABLE vehicles (...);
CREATE TABLE cars (...) INHERITS (vehicles);
CREATE TABLE trucks (...) INHERITS (vehicles);
-- Each type has different attributes

-- Partitioning example: Time-based data
CREATE TABLE orders (...) PARTITION BY RANGE (created_at);
-- Same structure, different time ranges`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Table Inheritance</h2>

          <CodeBlock
            title="Prisma: Working with Inheritance"
            language="prisma"
            code={`// Prisma doesn't have native inheritance support
// Use raw SQL for inheritance setup

// Create parent table
await prisma.$executeRaw\`
  CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  )
\`;

// Create child table
await prisma.$executeRaw\`
  CREATE TABLE cars (
    doors INTEGER,
    fuel_type TEXT
  ) INHERITS (vehicles)
\`;

// Insert into child table
await prisma.$executeRaw\`
  INSERT INTO cars (make, model, year, doors, fuel_type)
  VALUES ($1, $2, $3, $4, $5)
\`, 'Toyota', 'Camry', 2024, 4, 'gasoline';

// Query parent (includes children)
const vehicles = await prisma.$queryRaw\`
  SELECT * FROM vehicles WHERE year > 2020
\`;

// Query only parent
const parentOnly = await prisma.$queryRaw\`
  SELECT * FROM ONLY vehicles WHERE year > 2020
\`;

// Query child
const cars = await prisma.$queryRaw\`
  SELECT * FROM cars WHERE fuel_type = $1
\`, 'electric';

// Check inheritance hierarchy
const hierarchy = await prisma.$queryRaw\`
  SELECT 
    c.relname AS child_table,
    p.relname AS parent_table
  FROM pg_inherits i
  JOIN pg_class c ON i.inhrelid = c.oid
  JOIN pg_class p ON i.inhparent = p.oid
  ORDER BY c.relname
\`;

// Note: Prisma schema doesn't support inheritance
// Use raw SQL for inheritance operations
// Prisma queries work normally on inherited tables`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use inheritance</strong> for polymorphic data models</li>
              <li><strong>Use partitioning</strong> for large time-series tables</li>
              <li><strong>Understand ONLY keyword</strong> - limits queries to specific table</li>
              <li><strong>Create indexes</strong> on each table in hierarchy</li>
              <li><strong>Use tableoid</strong> to identify source table</li>
              <li><strong>Be aware of constraint behavior</strong> - unique constraints are per-table</li>
              <li><strong>Consider performance</strong> - queries on parent scan all children</li>
              <li><strong>Use triggers</strong> for automatic routing if needed</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

