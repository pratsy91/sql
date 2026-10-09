import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 15: Advanced Features - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL advanced-feature interview questions split into lessons: partitioning, advanced JSONB, full-text search, LISTEN/NOTIFY and advisory locks, FDW and generated columns, and Prisma escape hatches.',
};

export default function Module15AdvancedIndex() {
  return (
    <ModuleLessonIndex
      title="Module 15: Advanced Features"
      intro="These are the PostgreSQL features that go beyond everyday CRUD, and the lessons cover how interviewers ask about each one from junior to senior."
      lessons={[
        {
          title: 'Lesson 1: Partitioning',
          href: '/lessons/most-asked-interview-questions/module-15-advanced/lesson-01-partitioning',
          blurb:
            'Why partition, RANGE and LIST and HASH, partition pruning, attach and detach, partitioning vs indexing, keys on partitioned tables, and managing partitions over time.',
        },
        {
          title: 'Lesson 2: Advanced JSONB',
          href: '/lessons/most-asked-interview-questions/module-15-advanced/lesson-02-advanced-json',
          blurb:
            'Updating a single key, effective GIN and expression indexing, jsonb_ops vs jsonb_path_ops, when a generated column wins, and SQL/JSON path queries.',
        },
        {
          title: 'Lesson 3: Full-Text Search',
          href: '/lessons/most-asked-interview-questions/module-15-advanced/lesson-03-full-text-search',
          blurb:
            'tsvector and tsquery, a stored tsvector with GIN, to_tsquery vs plainto_tsquery vs websearch_to_tsquery, ranking with ts_rank, field weighting, and when to move to Elasticsearch.',
        },
        {
          title: 'Lesson 4: LISTEN/NOTIFY and Advisory Locks',
          href: '/lessons/most-asked-interview-questions/module-15-advanced/lesson-04-notify-and-advisory-locks',
          blurb:
            'LISTEN and NOTIFY, payload limits and commit delivery, advisory locks, session vs transaction scope, a queue table with SKIP LOCKED, and NOTIFY vs a queue table vs Kafka.',
        },
        {
          title: 'Lesson 5: FDW and Generated Columns',
          href: '/lessons/most-asked-interview-questions/module-15-advanced/lesson-05-fdw-and-generated-columns',
          blurb:
            'Foreign Data Wrappers, postgres_fdw vs ETL, predicate pushdown and consistency limits, generated columns, STORED vs VIRTUAL, and indexing a generated column.',
        },
        {
          title: 'Lesson 6: Advanced PostgreSQL with Prisma',
          href: '/lessons/most-asked-interview-questions/module-15-advanced/lesson-06-advanced-with-prisma',
          blurb:
            'What Prisma cannot model, the raw query escape hatch, Unsupported() types, extension SQL inside migrations, keeping raw SQL testable, and the overall architecture.',
        },
      ]}
    />
  );
}
