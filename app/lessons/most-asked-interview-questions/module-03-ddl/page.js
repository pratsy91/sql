import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 3: DDL - Most Asked Interview Questions',
  description:
    'Lesson-by-lesson interview questions on PostgreSQL DDL covering junior to senior — CREATE/ALTER/DROP, sequences and identity, indexes, views, and safe production migrations',
};

export default function MaiqModule03DdlIndex() {
  return (
    <ModuleLessonIndex
      title="Module 3: DDL"
      intro="The SQL that defines and changes your schema, from a first CREATE TABLE to a zero-downtime migration."
      lessons={[
        {
          title: 'Lesson 1: CREATE, ALTER, DROP',
          href: '/lessons/most-asked-interview-questions/module-03-ddl/lesson-01-create-alter-drop',
          blurb: 'What DDL is, the table lifecycle, IF EXISTS, renames, adding columns with defaults, DELETE vs TRUNCATE vs DROP, and CASCADE danger.',
        },
        {
          title: 'Lesson 2: Sequences and Identity',
          href: '/lessons/most-asked-interview-questions/module-03-ddl/lesson-02-sequences-and-identity',
          blurb: 'SERIAL vs IDENTITY, what a sequence is, why ids have gaps, resetting with setval, and ALWAYS vs BY DEFAULT.',
        },
        {
          title: 'Lesson 3: Indexes and Views',
          href: '/lessons/most-asked-interview-questions/module-03-ddl/lesson-03-indexes-and-views',
          blurb: 'Index types, when to use a view, updatable views, REFRESH MATERIALIZED VIEW CONCURRENTLY, and unique index vs unique constraint.',
        },
        {
          title: 'Lesson 4: Migrations and Production DDL',
          href: '/lessons/most-asked-interview-questions/module-03-ddl/lesson-04-migrations-and-production-ddl',
          blurb: 'Prisma migrate vs db push, CREATE INDEX CONCURRENTLY, which ALTER statements lock hard, expand-contract, and transactional DDL.',
        },
      ]}
    />
  );
}
