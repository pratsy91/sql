import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 1: Foundations & Setup - Most Asked Interview Questions',
  description:
    'Lesson-by-lesson interview questions on PostgreSQL foundations and setup covering junior to senior — RDBMS, ACID, transactions, connections, auth, SSL, pooling, and Prisma',
};

export default function MaiqModule01FoundationsIndex() {
  return (
    <ModuleLessonIndex
      title="Module 1: Foundations and Setup"
      intro="Start here: what PostgreSQL is, the core database ideas behind it, and how apps connect and log in."
      lessons={[
        {
          title: 'Lesson 1: PostgreSQL Overview',
          href: '/lessons/most-asked-interview-questions/module-01-foundations/lesson-01-postgresql-overview',
          blurb: 'What Postgres is, SQL vs PostgreSQL, open source licensing, ORDBMS, RDBMS vs NoSQL, and PostgreSQL vs MySQL.',
        },
        {
          title: 'Lesson 2: Database Fundamentals',
          href: '/lessons/most-asked-interview-questions/module-01-foundations/lesson-02-database-fundamentals',
          blurb: 'Transactions, ACID, primary keys, table vs view, the cluster to table hierarchy, client-server design, WAL, and MVCC.',
        },
        {
          title: 'Lesson 3: Connections and Authentication',
          href: '/lessons/most-asked-interview-questions/module-01-foundations/lesson-03-connection-authentication',
          blurb: 'Port 5432, connection strings, psql commands, roles, pg_hba.conf, SSL, search_path, Prisma URLs, pooling, and max_connections.',
        },
      ]}
    />
  );
}
