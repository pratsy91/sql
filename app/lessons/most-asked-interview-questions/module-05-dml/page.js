import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 5: DML - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL DML, split into lessons: INSERT and RETURNING, UPDATE and DELETE, UPSERT and MERGE, and bulk loads with COPY.',
};

export default function Module5DMLIndex() {
  return (
    <ModuleLessonIndex
      title="Module 5: DML"
      intro="DML is the SQL that changes data — insert, update, delete, and upsert — plus the patterns that keep those writes safe on a busy production database."
      lessons={[
        {
          title: 'Lesson 1: INSERT and RETURNING',
          href: '/lessons/most-asked-interview-questions/module-05-dml/lesson-01-insert-and-returning',
          blurb:
            'What DML means, INSERT ... RETURNING, getting the generated id, how DEFAULT behaves, multi-row inserts, INSERT ... SELECT, and Prisma create.',
        },
        {
          title: 'Lesson 2: UPDATE and DELETE',
          href: '/lessons/most-asked-interview-questions/module-05-dml/lesson-02-update-and-delete',
          blurb:
            'Safe writes, what happens when you forget WHERE, UPDATE ... FROM joins, DELETE ... RETURNING, soft vs hard delete, DELETE vs TRUNCATE vs DROP, and Prisma updateMany.',
        },
        {
          title: 'Lesson 3: UPSERT and MERGE',
          href: '/lessons/most-asked-interview-questions/module-05-dml/lesson-03-upsert-and-merge',
          blurb:
            'ON CONFLICT DO NOTHING vs DO UPDATE, what EXCLUDED means, removing duplicate rows keeping the lowest id, Prisma upsert, and MERGE in PostgreSQL 15+.',
        },
        {
          title: 'Lesson 4: Bulk Loads and COPY',
          href: '/lessons/most-asked-interview-questions/module-05-dml/lesson-04-bulk-loads-and-copy',
          blurb:
            'COPY vs INSERT speed, staging tables, batching huge deletes, why one giant transaction is risky, write concurrency at scale, and Prisma bulk write pitfalls.',
        },
      ]}
    />
  );
}
