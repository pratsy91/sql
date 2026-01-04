import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'System Information Functions - PostgreSQL Learning',
  description: 'Learn about PostgreSQL system information functions including version, current_database, current_user, and pg_typeof',
};

export default function SystemInformationFunctions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">System Information Functions</h1>
        
        <CodeBlock
          title="SQL: System Information"
          language="sql"
          code={`-- Version
SELECT VERSION() AS postgresql_version;

-- Current database
SELECT CURRENT_DATABASE() AS database_name;

-- Current user
SELECT CURRENT_USER AS current_user;
SELECT SESSION_USER AS session_user;
SELECT USER AS user_name;

-- Type information
SELECT PG_TYPEOF(price) FROM products LIMIT 1;

-- Connection info
SELECT INET_CLIENT_ADDR() AS client_ip;
SELECT INET_CLIENT_PORT() AS client_port;`}
        />
        <CodeBlock
          title="Prisma: System Information"
          language="prisma"
          code={`// Use raw SQL for system information
const version = await prisma.$queryRaw\`SELECT VERSION() AS version\`;
const dbName = await prisma.$queryRaw\`SELECT CURRENT_DATABASE() AS name\`;
const user = await prisma.$queryRaw\`SELECT CURRENT_USER AS user\`;`}
        />
      </div>
    </LessonLayout>
  );
}

