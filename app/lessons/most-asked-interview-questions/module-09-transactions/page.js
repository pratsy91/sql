import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 9: Transactions and Concurrency - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL transaction and concurrency interview questions, split into lessons: transaction basics, isolation levels, locks and deadlocks, MVCC and long transactions, and transactions with Prisma.',
};

export default function Module9TransactionsIndex() {
  return (
    <ModuleLessonIndex
      title="Module 9: Transactions and Concurrency"
      intro="These lessons build up from what a transaction is to what goes wrong when many of them run at once, and finish with how all of it behaves through Prisma."
      lessons={[
        {
          title: 'Lesson 1: Transaction Basics',
          href: '/lessons/most-asked-interview-questions/module-09-transactions/lesson-01-transaction-basics',
          blurb:
            'BEGIN, COMMIT and ROLLBACK, ACID explained, why a single statement is already atomic, what happens to the rest of a transaction after an error, SAVEPOINTs, and how to tell whether a transaction is open.',
        },
        {
          title: 'Lesson 2: Isolation Levels',
          href: '/lessons/most-asked-interview-questions/module-09-transactions/lesson-02-isolation-levels',
          blurb:
            'The default READ COMMITTED, dirty and non-repeatable and phantom reads, why PostgreSQL never allows a dirty read, comparing the three real levels, when SERIALIZABLE is worth it, and retrying on 40001.',
        },
        {
          title: 'Lesson 3: Locks and Deadlocks',
          href: '/lessons/most-asked-interview-questions/module-09-transactions/lesson-03-locks-and-deadlocks',
          blurb:
            'Row locks vs table locks, FOR UPDATE vs FOR SHARE, NOWAIT and SKIP LOCKED for job queues, what a deadlock is and how consistent lock ordering prevents it, finding what blocks a query, and advisory locks.',
        },
        {
          title: 'Lesson 4: MVCC and Long Transactions',
          href: '/lessons/most-asked-interview-questions/module-09-transactions/lesson-04-mvcc-and-long-transactions',
          blurb:
            'What MVCC is, whether a reader blocks a writer, how dead tuples create table bloat, why VACUUM is needed, the damage long transactions do, and why idle in transaction is so dangerous.',
        },
        {
          title: 'Lesson 5: Transactions with Prisma',
          href: '/lessons/most-asked-interview-questions/module-09-transactions/lesson-05-transactions-with-prisma',
          blurb:
            'The array form of $transaction vs an interactive callback, setting isolationLevel in Prisma 5+, why long interactive transactions exhaust the connection pool, retrying in application code, and idempotent transfers.',
        },
      ]}
    />
  );
}
