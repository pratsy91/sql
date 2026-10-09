import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 11: Security - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL security interview questions split into lessons: roles and privileges, SQL injection, Row Level Security, and secrets and connection hardening.',
};

export default function MaiqModule11SecurityIndex() {
  return (
    <ModuleLessonIndex
      title="Module 11: Security"
      intro="Four lessons on the database security questions that come up most: who can do what, how injection really happens, how to isolate tenants, and how to protect credentials and connections."
      lessons={[
        {
          title: 'Lesson 1: Roles and Privileges',
          href: '/lessons/most-asked-interview-questions/module-11-security/lesson-01-roles-and-privileges',
          blurb:
            'Role vs user, GRANT and REVOKE, why SUPERUSER is dangerous, column privileges, group roles and inheritance, ALTER DEFAULT PRIVILEGES, read-only roles, and locking down the public schema.',
        },
        {
          title: 'Lesson 2: SQL Injection',
          href: '/lessons/most-asked-interview-questions/module-11-security/lesson-02-sql-injection',
          blurb:
            'What injection is, what a parameterized query really does, why concatenation is unsafe, Prisma raw helpers, why identifiers cannot be bound, and ORDER BY injection.',
        },
        {
          title: 'Lesson 3: Row Level Security',
          href: '/lessons/most-asked-interview-questions/module-11-security/lesson-03-row-level-security',
          blurb:
            'Enabling RLS, USING vs WITH CHECK, owner bypass and FORCE ROW LEVEL SECURITY, passing the tenant id with set_config, multi-tenant design, SECURITY DEFINER, and RLS performance cost.',
        },
        {
          title: 'Lesson 4: Secrets and Hardening',
          href: '/lessons/most-asked-interview-questions/module-11-security/lesson-04-secrets-and-hardening',
          blurb:
            'Handling connection secrets, never logging the connection string, sslmode options, encryption at rest vs in transit, pg_hba and SCRAM, credential rotation, and least-privilege Prisma migrations.',
        },
      ]}
    />
  );
}
