import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 18: Best Practices and Patterns - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL and Prisma best-practice interview questions, split into lessons: naming and schema design, query practices, indexing strategy, migrations in CI/CD, and Prisma project structure.',
};

export default function Module18BestPracticesIndex() {
  return (
    <ModuleLessonIndex
      title="Module 18: Best Practices and Patterns"
      intro="These lessons cover the habits a reviewer looks for: names that survive, queries an index can use, indexes that earn their cost, migrations that never take the site down, and a Prisma codebase you can still navigate a year later."
      lessons={[
        {
          title: 'Lesson 1: Naming and Schema Design',
          href: '/lessons/most-asked-interview-questions/module-18-best-practices/lesson-01-naming-and-schema-design',
          blurb:
            'snake_case in the database and camelCase in Prisma, singular versus plural table names, @map and @@map, surrogate versus natural keys, text versus enum types, the schema smells interviewers expect you to name, and when denormalization is acceptable.',
        },
        {
          title: 'Lesson 2: Query Practices',
          href: '/lessons/most-asked-interview-questions/module-18-best-practices/lesson-02-query-practices',
          blurb:
            'Why SELECT * is bad, listing columns explicitly in INSERT too, parameterised queries instead of string concatenation, why functions on indexed columns kill the index, EXISTS versus the NOT IN NULL trap, offset versus cursor pagination, and why transactions must stay short.',
        },
        {
          title: 'Lesson 3: Indexing Strategy',
          href: '/lessons/most-asked-interview-questions/module-18-best-practices/lesson-03-indexing-strategy',
          blurb:
            'A sensible baseline, why PostgreSQL does not index foreign keys for you, how to order the columns of a composite index, measuring with EXPLAIN ANALYZE and pg_stat_statements before adding one, finding and safely dropping unused indexes, and reviewing indexes after an incident.',
        },
        {
          title: 'Lesson 4: Migrations and CI/CD',
          href: '/lessons/most-asked-interview-questions/module-18-best-practices/lesson-04-migrations-and-cicd',
          blurb:
            'Running prisma migrate deploy from a pipeline, why you never edit an applied migration, idempotent and restartable SQL, the expand and contract pattern, backward-compatible deploys, a migration review checklist, and changing a hot table without downtime.',
        },
        {
          title: 'Lesson 5: Prisma Project Structure',
          href: '/lessons/most-asked-interview-questions/module-18-best-practices/lesson-05-prisma-project-structure',
          blurb:
            'Multi-file Prisma schemas, the PrismaClient singleton in Next.js, when a repository or service layer is worth it, where shared select objects live, testing against a real database instead of mocks, and the patterns that keep large Prisma codebases maintainable.',
        },
      ]}
    />
  );
}
