import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'UUID Type - PostgreSQL Learning',
  description: 'Learn about PostgreSQL UUID type and generation functions',
};

export default function UUIDType() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">UUID Type</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">UUID Overview</h2>
          <p className="mb-4">
            UUID (Universally Unique Identifier) stores 128-bit identifiers that are unique across space and time.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">UUID Type Usage</h2>

          <CodeBlock
            title="SQL: UUID Type"
            language="sql"
            code={`-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table with UUID
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50),
  email VARCHAR(100)
);

-- Insert with auto-generated UUID
INSERT INTO users (username, email)
VALUES ('alice', 'alice@example.com');

-- Insert with explicit UUID
INSERT INTO users (id, username, email)
VALUES (uuid_generate_v4(), 'bob', 'bob@example.com');

-- UUID generation functions
SELECT 
  uuid_generate_v1() AS v1_uuid,        -- Time-based
  uuid_generate_v4() AS v4_uuid,       -- Random (most common)
  uuid_generate_v1mc() AS v1mc_uuid;    -- MAC address based

-- UUID from string
SELECT '550e8400-e29b-41d4-a716-446655440000'::UUID;

-- UUID comparison
SELECT * FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440000'::UUID;`}
          />
          <CodeBlock
            title="Prisma: UUID Type"
            language="prisma"
            code={`// schema.prisma
model User {
  id       String   @id @default(uuid()) @db.Uuid
  username String   @db.VarChar(50)
  email    String   @db.VarChar(100)
  
  @@map("users")
}

// Usage
const user = await prisma.user.create({
  data: {
    username: 'alice',
    email: 'alice@example.com',
    // id is auto-generated
  },
});

// Query by UUID
const user = await prisma.user.findUnique({
  where: {
    id: '550e8400-e29b-41d4-a716-446655440000',
  },
});

// Generate UUID in application
import { randomUUID } from 'crypto';

const user = await prisma.user.create({
  data: {
    id: randomUUID(),
    username: 'bob',
    email: 'bob@example.com',
  },
});`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}

