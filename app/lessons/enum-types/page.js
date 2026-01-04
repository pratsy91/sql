import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Enum Types - PostgreSQL Learning',
  description: 'Learn about PostgreSQL enum types',
};

export default function EnumTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Enum Types</h1>
        
        <CodeBlock
          title="SQL: Enum Types"
          language="sql"
          code={`-- Create enum type
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending');

-- Use enum in table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  status user_status
);

INSERT INTO users (username, status)
VALUES ('alice', 'active');`}
        />
        <CodeBlock
          title="Prisma: Enum Types"
          language="prisma"
          code={`// schema.prisma
enum UserStatus {
  active
  inactive
  pending
}

model User {
  id       Int        @id @default(autoincrement())
  username String     @db.VarChar(50)
  status   UserStatus
  
  @@map("users")
}`}
        />
      </div>
    </LessonLayout>
  );
}

