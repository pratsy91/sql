import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'COPY - PostgreSQL Learning',
  description: 'Learn about COPY command in PostgreSQL for bulk data operations including COPY FROM, COPY TO, CSV format, and binary format',
};

export default function Copy() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">COPY</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">COPY FROM</h2>

          <CodeBlock
            title="SQL: COPY FROM"
            language="sql"
            code={`-- COPY FROM file (server-side, requires superuser)
COPY users (username, email)
FROM '/path/to/users.csv'
WITH (FORMAT csv, HEADER true);

-- COPY FROM STDIN (client-side)
COPY users (username, email)
FROM STDIN
WITH (FORMAT csv);

-- Then paste data:
-- user1,user1@example.com
-- user2,user2@example.com
-- \\. (end of input)

-- COPY FROM with options
COPY products (name, price, stock)
FROM '/path/to/products.csv'
WITH (
  FORMAT csv,
  HEADER true,
  DELIMITER ',',
  QUOTE '"',
  ESCAPE '"',
  NULL ''
);

-- COPY FROM with column mapping
COPY users (username, email, created_at)
FROM '/path/to/users.csv'
WITH (FORMAT csv, HEADER true);`}
          />
          <CodeBlock
            title="Prisma: COPY FROM"
            language="prisma"
            code={`// Prisma doesn't have direct COPY support
// Use raw SQL or pg-copy-stream library

// Using raw SQL (requires file on server)
await prisma.$executeRaw\`
  COPY users (username, email)
  FROM '/path/to/users.csv'
  WITH (FORMAT csv, HEADER true)
\`;

// Using pg-copy-stream (Node.js library)
import { Client } from 'pg';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
await client.connect();

const stream = client.query(
  COPY users (username, email) FROM STDIN WITH (FORMAT csv, HEADER true)
);

const fileStream = createReadStream('./users.csv');
await pipeline(fileStream, stream);

// Or use Prisma's createMany for smaller datasets
const users = parseCSV('./users.csv');  // Your CSV parser
await prisma.user.createMany({
  data: users,
  skipDuplicates: true,
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">COPY TO</h2>

          <CodeBlock
            title="SQL: COPY TO"
            language="sql"
            code={`-- COPY TO file (server-side)
COPY users TO '/path/to/users.csv'
WITH (FORMAT csv, HEADER true);

-- COPY TO STDOUT (client-side)
COPY users TO STDOUT
WITH (FORMAT csv, HEADER true);

-- COPY specific columns
COPY users (username, email) TO '/path/to/users.csv'
WITH (FORMAT csv, HEADER true);

-- COPY with WHERE clause
COPY (
  SELECT username, email 
  FROM users 
  WHERE status = 'active'
) TO '/path/to/active_users.csv'
WITH (FORMAT csv, HEADER true);

-- COPY with query
COPY (
  SELECT u.username, u.email, COUNT(o.id) AS order_count
  FROM users u
  LEFT JOIN orders o ON u.id = o.user_id
  GROUP BY u.id, u.username, u.email
) TO '/path/to/user_stats.csv'
WITH (FORMAT csv, HEADER true);`}
          />
          <CodeBlock
            title="Prisma: COPY TO"
            language="prisma"
            code={`// Use raw SQL for COPY TO
const result = await prisma.$queryRaw\`
  COPY users TO STDOUT
  WITH (FORMAT csv, HEADER true)
\`;

// Or use pg-copy-stream
import { Client } from 'pg';
import { createWriteStream } from 'fs';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
await client.connect();

const stream = client.query(
  COPY users TO STDOUT WITH (FORMAT csv, HEADER true)
);

const fileStream = createWriteStream('./users.csv');
await pipeline(stream, fileStream);

// Or use Prisma queries and write CSV manually
const users = await prisma.user.findMany({
  select: {
    username: true,
    email: true,
  },
});

// Write to CSV file
import fs from 'fs';
const csv = users.map(u => \`\${u.username},\${u.email}\`).join('\\n');
fs.writeFileSync('./users.csv', 'username,email\\n' + csv);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">CSV Format</h2>

          <CodeBlock
            title="SQL: CSV Format Options"
            language="sql"
            code={`-- COPY with CSV format options
COPY products FROM '/path/to/products.csv'
WITH (
  FORMAT csv,
  HEADER true,           -- First line is header
  DELIMITER ',',         -- Field delimiter
  QUOTE '"',            -- Quote character
  ESCAPE '"',           -- Escape character
  NULL 'NULL',          -- NULL representation
  FORCE_QUOTE (name),   -- Force quotes for specific columns
  FORCE_NOT_NULL (id)   -- Treat empty as NOT NULL
);

-- Custom CSV format
COPY users FROM '/path/to/users.csv'
WITH (
  FORMAT csv,
  HEADER false,
  DELIMITER '|',
  QUOTE '''',
  ESCAPE '\\',
  NULL ''
);

-- Export to CSV
COPY users TO '/path/to/users.csv'
WITH (
  FORMAT csv,
  HEADER true,
  DELIMITER ',',
  QUOTE '"',
  ESCAPE '"'
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Binary Format</h2>

          <CodeBlock
            title="SQL: Binary Format"
            language="sql"
            code={`-- COPY with binary format (faster, but not human-readable)
COPY users FROM '/path/to/users.bin'
WITH (FORMAT binary);

-- Export to binary
COPY users TO '/path/to/users.bin'
WITH (FORMAT binary);

-- Binary format is more efficient for large datasets
-- Use CSV for human-readable data
-- Use binary for performance-critical operations`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use COPY</strong> for bulk data operations (much faster than INSERT)</li>
              <li><strong>CSV format</strong> for human-readable data exchange</li>
              <li><strong>Binary format</strong> for maximum performance with large datasets</li>
              <li><strong>COPY FROM STDIN/STDOUT</strong> for client-side operations</li>
              <li><strong>Use transactions</strong> when copying large amounts of data</li>
              <li><strong>Validate data</strong> before copying to avoid constraint violations</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

