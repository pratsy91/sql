const base = '/lessons/most-asked-scenario-interview-questions';

export const phase25Modules = [
  {
    id: 's-module-01-foundations',
    title: 'Module 1: Foundations & Setup',
    path: `${base}/module-01-foundations`,
    lessons: [
      { id: 's01-l01', title: 'Lesson 1: Connection Failures', path: `${base}/module-01-foundations/lesson-01-connection-failures` },
      { id: 's01-l02', title: 'Lesson 2: Auth, Pool, and search_path', path: `${base}/module-01-foundations/lesson-02-auth-pool-search-path` },
    ],
  },
  {
    id: 's-module-02-data-types',
    title: 'Module 2: Data Types',
    path: `${base}/module-02-data-types`,
    lessons: [
      { id: 's02-l01', title: 'Lesson 1: Money and Integer Incidents', path: `${base}/module-02-data-types/lesson-01-money-and-integer-incidents` },
      { id: 's02-l02', title: 'Lesson 2: Time, JSON, and ENUM Incidents', path: `${base}/module-02-data-types/lesson-02-time-json-enum-incidents` },
    ],
  },
  {
    id: 's-module-03-ddl',
    title: 'Module 3: DDL',
    path: `${base}/module-03-ddl`,
    lessons: [
      { id: 's03-l01', title: 'Lesson 1: Migration Locks', path: `${base}/module-03-ddl/lesson-01-migration-locks` },
      { id: 's03-l02', title: 'Lesson 2: Invalid Indexes and Dependencies', path: `${base}/module-03-ddl/lesson-02-invalid-indexes-and-dependencies` },
    ],
  },
  {
    id: 's-module-04-constraints',
    title: 'Module 4: Constraints',
    path: `${base}/module-04-constraints`,
    lessons: [
      { id: 's04-l01', title: 'Lesson 1: Foreign Key and Unique Violations', path: `${base}/module-04-constraints/lesson-01-fk-and-unique-violations` },
      { id: 's04-l02', title: 'Lesson 2: NOT NULL, CHECK, and Bad Data', path: `${base}/module-04-constraints/lesson-02-not-null-check-bad-data` },
    ],
  },
  {
    id: 's-module-05-dml',
    title: 'Module 5: DML',
    path: `${base}/module-05-dml`,
    lessons: [
      { id: 's05-l01', title: 'Lesson 1: Accidental Writes', path: `${base}/module-05-dml/lesson-01-accidental-writes` },
      { id: 's05-l02', title: 'Lesson 2: Upsert and Bulk Load Failures', path: `${base}/module-05-dml/lesson-02-upsert-and-bulk-load` },
    ],
  },
  {
    id: 's-module-06-dql',
    title: 'Module 6: DQL / SELECT',
    path: `${base}/module-06-dql`,
    lessons: [
      { id: 's06-l01', title: 'Lesson 1: Wrong Results', path: `${base}/module-06-dql/lesson-01-wrong-results` },
      { id: 's06-l02', title: 'Lesson 2: Pagination and Missing Rows', path: `${base}/module-06-dql/lesson-02-pagination-and-missing-rows` },
    ],
  },
  {
    id: 's-module-07-functions',
    title: 'Module 7: Functions & Operators',
    path: `${base}/module-07-functions`,
    lessons: [
      { id: 's07-l01', title: 'Lesson 1: Wrong Dates and NULL Filters', path: `${base}/module-07-functions/lesson-01-dates-and-null-filters` },
      { id: 's07-l02', title: 'Lesson 2: Functions That Kill Indexes', path: `${base}/module-07-functions/lesson-02-functions-that-kill-indexes` },
    ],
  },
  {
    id: 's-module-08-plpgsql',
    title: 'Module 8: PL/pgSQL',
    path: `${base}/module-08-plpgsql`,
    lessons: [
      { id: 's08-l01', title: 'Lesson 1: Trigger Incidents', path: `${base}/module-08-plpgsql/lesson-01-trigger-incidents` },
      { id: 's08-l02', title: 'Lesson 2: Hidden Errors and Unsafe Functions', path: `${base}/module-08-plpgsql/lesson-02-hidden-errors-and-unsafe-functions` },
    ],
  },
  {
    id: 's-module-09-transactions',
    title: 'Module 9: Transactions & Concurrency',
    path: `${base}/module-09-transactions`,
    lessons: [
      { id: 's09-l01', title: 'Lesson 1: Deadlocks and Lost Updates', path: `${base}/module-09-transactions/lesson-01-deadlocks-and-lost-updates` },
      { id: 's09-l02', title: 'Lesson 2: Idle Transactions and Bloat', path: `${base}/module-09-transactions/lesson-02-idle-transactions-and-bloat` },
    ],
  },
  {
    id: 's-module-10-performance',
    title: 'Module 10: Performance',
    path: `${base}/module-10-performance`,
    lessons: [
      { id: 's10-l01', title: 'Lesson 1: Slow Queries', path: `${base}/module-10-performance/lesson-01-slow-queries` },
      { id: 's10-l02', title: 'Lesson 2: Bloat, Vacuum, and Pool Timeouts', path: `${base}/module-10-performance/lesson-02-bloat-vacuum-pool` },
    ],
  },
  {
    id: 's-module-11-security',
    title: 'Module 11: Security',
    path: `${base}/module-11-security`,
    lessons: [
      { id: 's11-l01', title: 'Lesson 1: SQL Injection Incidents', path: `${base}/module-11-security/lesson-01-sql-injection-incidents` },
      { id: 's11-l02', title: 'Lesson 2: Over-Privileged Roles and RLS Gaps', path: `${base}/module-11-security/lesson-02-privileges-and-rls` },
    ],
  },
  {
    id: 's-module-12-backup',
    title: 'Module 12: Backup & Recovery',
    path: `${base}/module-12-backup`,
    lessons: [
      { id: 's12-l01', title: 'Lesson 1: Restore Failures', path: `${base}/module-12-backup/lesson-01-restore-failures` },
      { id: 's12-l02', title: 'Lesson 2: Disk Full and Untested Backups', path: `${base}/module-12-backup/lesson-02-disk-full-and-untested-backups` },
    ],
  },
  {
    id: 's-module-13-replication',
    title: 'Module 13: Replication',
    path: `${base}/module-13-replication`,
    lessons: [
      { id: 's13-l01', title: 'Lesson 1: Replica Lag and Conflicts', path: `${base}/module-13-replication/lesson-01-replica-lag-and-conflicts` },
      { id: 's13-l02', title: 'Lesson 2: Failover and Replication Slots', path: `${base}/module-13-replication/lesson-02-failover-and-slots` },
    ],
  },
  {
    id: 's-module-14-extensions',
    title: 'Module 14: Extensions',
    path: `${base}/module-14-extensions`,
    lessons: [
      { id: 's14-l01', title: 'Lesson 1: Missing Extensions', path: `${base}/module-14-extensions/lesson-01-missing-extensions` },
      { id: 's14-l02', title: 'Lesson 2: Search and Vector Incidents', path: `${base}/module-14-extensions/lesson-02-search-and-vector-incidents` },
    ],
  },
  {
    id: 's-module-15-advanced',
    title: 'Module 15: Advanced Features',
    path: `${base}/module-15-advanced`,
    lessons: [
      { id: 's15-l01', title: 'Lesson 1: Partition Incidents', path: `${base}/module-15-advanced/lesson-01-partition-incidents` },
      { id: 's15-l02', title: 'Lesson 2: Locks, NOTIFY, and FDW', path: `${base}/module-15-advanced/lesson-02-locks-notify-fdw` },
    ],
  },
  {
    id: 's-module-16-prisma',
    title: 'Module 16: Prisma ORM',
    path: `${base}/module-16-prisma`,
    lessons: [
      { id: 's16-l01', title: 'Lesson 1: Migration Drift and Failed Deploys', path: `${base}/module-16-prisma/lesson-01-migration-drift` },
      { id: 's16-l02', title: 'Lesson 2: Pool Timeouts, N+1, and Missing Rows', path: `${base}/module-16-prisma/lesson-02-pool-n-plus-one-missing-rows` },
    ],
  },
  {
    id: 's-module-17-monitoring',
    title: 'Module 17: Monitoring & Maintenance',
    path: `${base}/module-17-monitoring`,
    lessons: [
      { id: 's17-l01', title: 'Lesson 1: Finding the Bad Query and the Blocker', path: `${base}/module-17-monitoring/lesson-01-bad-query-and-blocker` },
      { id: 's17-l02', title: 'Lesson 2: Disk, Wraparound, and Connection Spikes', path: `${base}/module-17-monitoring/lesson-02-disk-wraparound-connections` },
    ],
  },
  {
    id: 's-module-18-best-practices',
    title: 'Module 18: Best Practices',
    path: `${base}/module-18-best-practices`,
    lessons: [
      { id: 's18-l01', title: 'Lesson 1: Deploy and Migration Order', path: `${base}/module-18-best-practices/lesson-01-deploy-and-migration-order` },
      { id: 's18-l02', title: 'Lesson 2: Designs That Break in Production', path: `${base}/module-18-best-practices/lesson-02-designs-that-break` },
    ],
  },
  {
    id: 's-module-19-relationships',
    title: 'Module 19: Relationships & Schema Design',
    path: `${base}/module-19-relationships`,
    lessons: [
      { id: 's19-l01', title: 'Lesson 1: Cascade Deletes and Orphans', path: `${base}/module-19-relationships/lesson-01-cascade-and-orphans` },
      { id: 's19-l02', title: 'Lesson 2: Junction Tables and Hierarchies', path: `${base}/module-19-relationships/lesson-02-junctions-and-hierarchies` },
    ],
  },
  {
    id: 's-module-20-general',
    title: 'Module 20: General Production Scenarios',
    path: `${base}/module-20-general-scenarios`,
    lessons: [
      { id: 's20-l01', title: 'Lesson 1: Writes Are Failing', path: `${base}/module-20-general-scenarios/lesson-01-writes-are-failing` },
      { id: 's20-l02', title: 'Lesson 2: The Site Is Slow', path: `${base}/module-20-general-scenarios/lesson-02-the-site-is-slow` },
      { id: 's20-l03', title: 'Lesson 3: Data Looks Wrong After a Release', path: `${base}/module-20-general-scenarios/lesson-03-data-looks-wrong` },
    ],
  },
];
