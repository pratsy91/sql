import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 16: Prisma ORM - Most Asked Interview Questions',
  description:
    'Lesson-by-lesson Prisma interview questions from junior to senior — schema and client basics, relations, CRUD, bulk writes and transactions, raw SQL and JSON, migrations, pooling, and production patterns',
};

export default function MaiqModule16PrismaIndex() {
  return (
    <ModuleLessonIndex
      title="Module 16: Prisma ORM"
      intro="The biggest module: how Prisma describes your tables, how you read and write data with it, and how teams run it safely in production."
      lessons={[
        {
          title: 'Lesson 1: Prisma Basics',
          href: '/lessons/most-asked-interview-questions/module-16-prisma/lesson-01-prisma-basics',
          blurb: 'What an ORM is, Client vs Migrate vs Studio, schema.prisma attributes, prisma generate, where the generated client lives, and Prisma vs raw SQL.',
        },
        {
          title: 'Lesson 2: Relations in Prisma',
          href: '/lessons/most-asked-interview-questions/module-16-prisma/lesson-02-relations-in-prisma',
          blurb: 'One-to-one, one-to-many, implicit and explicit many-to-many, relation scalar fields, optional relations, connect vs create vs connectOrCreate, and referential actions.',
        },
        {
          title: 'Lesson 3: CRUD and Queries',
          href: '/lessons/most-asked-interview-questions/module-16-prisma/lesson-03-crud-queries',
          blurb: 'findUnique vs findFirst, filter operators, include vs select, counting with _count, offset vs cursor pagination, and ordering by relation count.',
        },
        {
          title: 'Lesson 4: Bulk Writes and Transactions',
          href: '/lessons/most-asked-interview-questions/module-16-prisma/lesson-04-bulk-and-transactions',
          blurb: 'createMany, updateMany, deleteMany, skipDuplicates, createManyAndReturn, array vs interactive $transaction, nested write atomicity, and long transaction risk.',
        },
        {
          title: 'Lesson 5: Raw Queries and JSON',
          href: '/lessons/most-asked-interview-questions/module-16-prisma/lesson-05-raw-queries-and-json',
          blurb: '$queryRaw and $executeRaw, SQL injection safety, typing raw results, JSON and JSONB filtering, GIN indexes, and TypedSQL.',
        },
        {
          title: 'Lesson 6: Migrations and Seeding',
          href: '/lessons/most-asked-interview-questions/module-16-prisma/lesson-06-migrations-and-seeding',
          blurb: 'migrate dev vs migrate deploy vs db push, seeding, the _prisma_migrations table, editing migration SQL, the shadow database, and fixing a failed migration.',
        },
        {
          title: 'Lesson 7: Client Setup and Connection Pooling',
          href: '/lessons/most-asked-interview-questions/module-16-prisma/lesson-07-client-setup-and-pooling',
          blurb: 'The PrismaClient singleton, why a client per request breaks, connection_limit, directUrl, PgBouncer and serverless, driver adapters, relationMode, Accelerate, and Pulse.',
        },
        {
          title: 'Lesson 8: Patterns and Error Handling',
          href: '/lessons/most-asked-interview-questions/module-16-prisma/lesson-08-patterns-and-errors',
          blurb: 'N+1 queries, soft deletes, error codes P2002 P2025 P2003 P2034, safe retries, client extensions, schema drift, ORM tradeoffs, and production-safe design.',
        },
      ]}
    />
  );
}
