import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 10: Performance Optimization - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL performance interview questions split into lessons: index basics, EXPLAIN and query plans, advanced index types, VACUUM and bloat, query optimization, ORM and pooling, and partitioning.',
};

export default function MaiqModule10PerformanceIndex() {
  return (
    <ModuleLessonIndex
      title="Module 10: Performance Optimization"
      intro="Seven lessons covering the performance questions interviewers actually ask, from what an index is to how you debug a slow production query."
      lessons={[
        {
          title: 'Lesson 1: Index Basics',
          href: '/lessons/most-asked-interview-questions/module-10-performance/lesson-01-indexes-basics',
          blurb:
            'What an index is, clustered vs non-clustered, B-tree, composite column order and the leftmost rule, indexes for ORDER BY, and why PostgreSQL sometimes ignores your index.',
        },
        {
          title: 'Lesson 2: EXPLAIN and Query Plans',
          href: '/lessons/most-asked-interview-questions/module-10-performance/lesson-02-explain-and-plans',
          blurb:
            'EXPLAIN vs EXPLAIN ANALYZE, sequential scan vs index scan, estimated vs actual rows, the three join types in plain words, BUFFERS, and index-only scans.',
        },
        {
          title: 'Lesson 3: Advanced Index Types',
          href: '/lessons/most-asked-interview-questions/module-10-performance/lesson-03-advanced-index-types',
          blurb:
            'GIN and GiST vs B-tree, covering indexes with INCLUDE, partial indexes, expression indexes such as lower(email), BRIN, and finding unused or duplicate indexes.',
        },
        {
          title: 'Lesson 4: VACUUM and Bloat',
          href: '/lessons/most-asked-interview-questions/module-10-performance/lesson-04-vacuum-and-bloat',
          blurb:
            'Dead tuples, VACUUM vs ANALYZE, autovacuum tuning, table bloat, why VACUUM FULL is dangerous, and transaction id wraparound.',
        },
        {
          title: 'Lesson 5: Query Optimization',
          href: '/lessons/most-asked-interview-questions/module-10-performance/lesson-05-query-optimization',
          blurb:
            'Avoiding SELECT *, why a function on a filtered column kills the index, rewriting OR as UNION ALL, LIMIT with a matching index, fresh statistics, and a full slow-query workflow.',
        },
        {
          title: 'Lesson 6: ORM Performance and Pooling',
          href: '/lessons/most-asked-interview-questions/module-10-performance/lesson-06-orm-and-pooling',
          blurb:
            'The N+1 problem, select vs include in Prisma, connection pooling, batching queries, Prisma query logging, and caching read-heavy endpoints.',
        },
        {
          title: 'Lesson 7: Partitioning Overview',
          href: '/lessons/most-asked-interview-questions/module-10-performance/lesson-07-partitioning-overview',
          blurb:
            'What partitioning is, partitioning vs just adding an index, partition pruning, choosing a partition key, and what gets harder once a table is partitioned.',
        },
      ]}
    />
  );
}
