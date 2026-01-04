import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Popular Extensions - PostgreSQL Learning',
  description: 'Learn about popular PostgreSQL extensions including PostGIS, pg_trgm, hstore, uuid-ossp, and pgcrypto',
};

export default function PopularExtensions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Popular Extensions</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What are Extensions?</h2>
          <p className="mb-4">
            PostgreSQL extensions add functionality to the database. They can provide new data types, 
            functions, operators, and more. Extensions are installed using CREATE EXTENSION and can 
            be easily enabled or disabled.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">PostGIS (Geospatial)</h2>

          <CodeBlock
            title="SQL: PostGIS Extension"
            language="sql"
            code={`-- Install PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Install additional PostGIS components
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS postgis_raster;

-- Check PostGIS version
SELECT PostGIS_Version();
SELECT PostGIS_Full_Version();

-- Create table with geometry column
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name TEXT,
  location GEOMETRY(POINT, 4326)
);

-- Insert point data
INSERT INTO locations (name, location)
VALUES (
  'New York',
  ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)
);

-- Query with spatial functions
SELECT 
  name,
  ST_AsText(location) AS coordinates,
  ST_X(location) AS longitude,
  ST_Y(location) AS latitude
FROM locations;

-- Calculate distance
SELECT 
  a.name AS location1,
  b.name AS location2,
  ST_Distance(a.location, b.location) AS distance_meters
FROM locations a, locations b
WHERE a.id < b.id;

-- Find points within radius
SELECT name
FROM locations
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326),
  10000  -- 10km in meters
);

-- Create spatial index
CREATE INDEX idx_locations_location ON locations USING GIST (location);

-- View installed PostGIS functions
SELECT 
  proname,
  proargnames
FROM pg_proc
WHERE proname LIKE 'ST_%'
ORDER BY proname
LIMIT 20;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">pg_trgm (Trigram Matching)</h2>

          <CodeBlock
            title="SQL: pg_trgm Extension"
            language="sql"
            code={`-- Install pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Check extension version
SELECT extversion FROM pg_extension WHERE extname = 'pg_trgm';

-- Create table with text data
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT,
  description TEXT
);

-- Insert sample data
INSERT INTO products (name, description)
VALUES 
  ('Laptop Computer', 'High-performance laptop'),
  ('Desktop Computer', 'Powerful desktop PC'),
  ('Tablet Device', 'Portable tablet');

-- Similarity search
SELECT 
  name,
  similarity(name, 'Computer') AS sim_score
FROM products
WHERE similarity(name, 'Computer') > 0.3
ORDER BY sim_score DESC;

-- Using % operator (similarity threshold)
SELECT name
FROM products
WHERE name % 'Computer';  -- Similarity > 0.3

-- Word similarity
SELECT 
  name,
  word_similarity('Computer', name) AS word_sim
FROM products
WHERE 'Computer' % name
ORDER BY word_sim DESC;

-- Create GIN index for fast similarity search
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_description_trgm ON products USING GIN (description gin_trgm_ops);

-- Fast similarity search with index
SELECT name, description
FROM products
WHERE name % 'Laptop'
ORDER BY similarity(name, 'Laptop') DESC;

-- Show trigrams
SELECT show_trgm('PostgreSQL');
-- Returns: {"  p"," po","ost","res","sql","stq","tgr","tql"}

-- Distance function
SELECT 
  name,
  name <-> 'Computer' AS distance
FROM products
ORDER BY distance
LIMIT 5;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">hstore (Key-Value Store)</h2>

          <CodeBlock
            title="SQL: hstore Extension"
            language="sql"
            code={`-- Install hstore extension
CREATE EXTENSION IF NOT EXISTS hstore;

-- Create table with hstore column
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT,
  attributes HSTORE
);

-- Insert data with key-value pairs
INSERT INTO products (name, attributes)
VALUES (
  'Laptop',
  'color => "black", brand => "Dell", ram => "16GB", storage => "512GB"'
);

-- Insert using hstore() function
INSERT INTO products (name, attributes)
VALUES (
  'Desktop',
  hstore(ARRAY['color', 'brand', 'ram'], ARRAY['white', 'HP', '32GB'])
);

-- Query by key
SELECT name, attributes->'brand' AS brand
FROM products
WHERE attributes ? 'brand';

-- Query by key-value pair
SELECT name
FROM products
WHERE attributes @> 'brand => Dell';

-- Query with multiple conditions
SELECT name
FROM products
WHERE attributes @> 'brand => Dell' AND attributes->'ram' = '16GB';

-- Add/update key-value
UPDATE products
SET attributes = attributes || 'price => "999.99"'
WHERE id = 1;

-- Delete key
UPDATE products
SET attributes = delete(attributes, 'price')
WHERE id = 1;

-- Get all keys
SELECT akeys(attributes) AS keys
FROM products
WHERE id = 1;

-- Get all values
SELECT avals(attributes) AS values
FROM products
WHERE id = 1;

-- Convert to JSON
SELECT 
  name,
  hstore_to_json(attributes) AS attributes_json
FROM products;

-- Create GIN index for hstore
CREATE INDEX idx_products_attributes ON products USING GIN (attributes);

-- Fast search with index
SELECT name
FROM products
WHERE attributes @> 'brand => Dell';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">uuid-ossp (UUID Generation)</h2>

          <CodeBlock
            title="SQL: uuid-ossp Extension"
            language="sql"
            code={`-- Install uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check extension
SELECT extversion FROM pg_extension WHERE extname = 'uuid-ossp';

-- Generate UUID v1 (time-based)
SELECT uuid_generate_v1();
-- Example: 550e8400-e29b-41d4-a716-446655440000

-- Generate UUID v4 (random)
SELECT uuid_generate_v4();
-- Example: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11

-- Generate UUID v1mc (MAC address-based)
SELECT uuid_generate_v1mc();

-- Use UUID as primary key
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT
);

-- Insert with auto-generated UUID
INSERT INTO users (name, email)
VALUES ('John Doe', 'john@example.com');
-- id is automatically generated

-- Insert with explicit UUID
INSERT INTO users (id, name, email)
VALUES (uuid_generate_v4(), 'Jane Doe', 'jane@example.com');

-- Generate UUID in application
SELECT uuid_generate_v4() AS new_id;

-- Compare UUIDs
SELECT *
FROM users
WHERE id = '550e8400-e29b-41d4-a716-446655440000'::UUID;

-- UUID functions
SELECT 
  uuid_generate_v1() AS v1,
  uuid_generate_v4() AS v4,
  uuid_nil() AS nil_uuid,
  uuid_ns_dns() AS dns_namespace,
  uuid_ns_url() AS url_namespace;

-- Note: PostgreSQL also has built-in gen_random_uuid() (pgcrypto)
-- No extension needed for gen_random_uuid()`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">pgcrypto (Encryption)</h2>

          <CodeBlock
            title="SQL: pgcrypto Extension"
            language="sql"
            code={`-- Install pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Password hashing (bcrypt)
SELECT crypt('my_password', gen_salt('bf', 10)) AS hashed_password;

-- Verify password
SELECT 
  crypt('my_password', '$2a$10$...') = '$2a$10$...' AS password_match;

-- Use in table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT
);

INSERT INTO users (email, password_hash)
VALUES (
  'user@example.com',
  crypt('user_password', gen_salt('bf', 12))
);

-- Verify on login
SELECT id, email
FROM users
WHERE email = 'user@example.com'
  AND password_hash = crypt('user_password', password_hash);

-- Symmetric encryption (AES)
SELECT pgp_sym_encrypt('sensitive_data', 'encryption_key') AS encrypted;

-- Decrypt
SELECT pgp_sym_decrypt(encrypted_data, 'encryption_key') AS decrypted;

-- Hash functions
SELECT 
  encode(digest('text', 'md5'), 'hex') AS md5_hash,
  encode(digest('text', 'sha1'), 'hex') AS sha1_hash,
  encode(digest('text', 'sha256'), 'hex') AS sha256_hash,
  encode(digest('text', 'sha512'), 'hex') AS sha512_hash;

-- HMAC
SELECT encode(hmac('message', 'secret_key', 'sha256'), 'hex') AS hmac_value;

-- Random data
SELECT gen_random_bytes(32) AS random_bytes;
SELECT encode(gen_random_bytes(16), 'hex') AS random_hex;

-- Generate random UUID (no extension needed, but pgcrypto provides it)
SELECT gen_random_uuid() AS random_uuid;

-- Salt generation
SELECT 
  gen_salt('bf') AS bcrypt_salt,
  gen_salt('md5') AS md5_salt,
  gen_salt('des') AS des_salt;

-- Use in application
CREATE TABLE sensitive_data (
  id SERIAL PRIMARY KEY,
  encrypted_field BYTEA
);

INSERT INTO sensitive_data (encrypted_field)
VALUES (pgp_sym_encrypt('secret_value', 'my_key'));

SELECT pgp_sym_decrypt(encrypted_field, 'my_key') AS decrypted
FROM sensitive_data;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Other Popular Extensions</h2>

          <CodeBlock
            title="SQL: Additional Extensions"
            language="sql"
            code={`-- pg_stat_statements (query statistics)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View query statistics
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- pg_buffercache (buffer cache inspection)
CREATE EXTENSION IF NOT EXISTS pg_buffercache;

-- View buffer cache
SELECT 
  c.relname,
  count(*) AS buffers
FROM pg_buffercache b
JOIN pg_class c ON b.relfilenode = pg_relation_filenode(c.oid)
GROUP BY c.relname
ORDER BY count(*) DESC;

-- citext (case-insensitive text)
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email CITEXT UNIQUE
);

INSERT INTO users (email) VALUES ('Test@Example.com');
SELECT * FROM users WHERE email = 'test@example.com';  -- Matches!

-- btree_gin (GIN index for standard types)
CREATE EXTENSION IF NOT EXISTS btree_gin;

CREATE INDEX idx_users_email_gin ON users USING GIN (email);

-- btree_gist (GiST index for standard types)
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE INDEX idx_users_created_gist ON users USING GIST (created_at);

-- pg_prewarm (preload data into cache)
CREATE EXTENSION IF NOT EXISTS pg_prewarm;

SELECT pg_prewarm('users');
SELECT pg_prewarm('users', 'buffer', 'main');

-- View all installed extensions
SELECT 
  extname,
  extversion,
  nspname AS schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
ORDER BY extname;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Popular Extensions</h2>

          <CodeBlock
            title="Prisma: Using Extensions"
            language="prisma"
            code={`// Prisma doesn't have direct extension management
// Use raw SQL for extension operations

// Install PostGIS
await prisma.$executeRaw\`CREATE EXTENSION IF NOT EXISTS postgis\`;

// Install pg_trgm
await prisma.$executeRaw\`CREATE EXTENSION IF NOT EXISTS pg_trgm\`;

// Install hstore
await prisma.$executeRaw\`CREATE EXTENSION IF NOT EXISTS hstore\`;

// Install uuid-ossp
await prisma.$executeRaw\`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"\`;

// Install pgcrypto
await prisma.$executeRaw\`CREATE EXTENSION IF NOT EXISTS pgcrypto\`;

// Use PostGIS in Prisma schema
// Note: Prisma doesn't support GEOMETRY type directly
// Use raw SQL for PostGIS operations

const locations = await prisma.$queryRaw\`
  SELECT 
    id,
    name,
    ST_AsText(location) AS coordinates
  FROM locations
  WHERE ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint($1, $2), 4326),
    $3
  )
\`, -74.0060, 40.7128, 10000;

// Use pg_trgm for similarity search
const products = await prisma.$queryRaw\`
  SELECT 
    name,
    similarity(name, $1) AS score
  FROM products
  WHERE name % $1
  ORDER BY similarity(name, $1) DESC
\`, 'Computer';

// Use hstore
const products = await prisma.$queryRaw\`
  SELECT 
    id,
    name,
    attributes->'brand' AS brand
  FROM products
  WHERE attributes ? 'brand'
\`;

// Use UUID generation
const newId = await prisma.$queryRaw\`
  SELECT uuid_generate_v4() AS id
\`;

// Use pgcrypto for password hashing
const hashedPassword = await prisma.$queryRaw\`
  SELECT crypt($1, gen_salt('bf', 12)) AS hash
\`, 'user_password';

// Verify password
const user = await prisma.$queryRaw\`
  SELECT id, email
  FROM users
  WHERE email = $1
    AND password_hash = crypt($2, password_hash)
\`, 'user@example.com', 'user_password';

// View installed extensions
const extensions = await prisma.$queryRaw\`
  SELECT 
    extname,
    extversion
  FROM pg_extension
  ORDER BY extname
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Install extensions</strong> as needed for your use case</li>
              <li><strong>Check extension versions</strong> - keep them updated</li>
              <li><strong>Use appropriate indexes</strong> - GIN for pg_trgm, GiST for PostGIS</li>
              <li><strong>Document extension usage</strong> - track which extensions are used</li>
              <li><strong>Test extension functionality</strong> - verify they work as expected</li>
              <li><strong>Monitor extension performance</strong> - some extensions add overhead</li>
              <li><strong>Use IF NOT EXISTS</strong> - prevent errors if already installed</li>
              <li><strong>Review extension documentation</strong> - understand features and limitations</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

