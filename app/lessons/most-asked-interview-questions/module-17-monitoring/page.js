import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 17: Monitoring and Maintenance - Most Asked Interview Questions',
  description:
    'Lesson-by-lesson PostgreSQL monitoring interview questions from junior to senior — pg_stat_activity, locks, pg_stat_statements, sizes and index usage, vacuum, and Prisma application monitoring',
};

export default function MaiqModule17MonitoringIndex() {
  return (
    <ModuleLessonIndex
      title="Module 17: Monitoring and Maintenance"
      intro="How you tell whether a running database is healthy, and what you look at first when it is not."
      lessons={[
        {
          title: 'Lesson 1: Activity and Locks',
          href: '/lessons/most-asked-interview-questions/module-17-monitoring/lesson-01-activity-and-locks',
          blurb: 'pg_stat_activity, the longest running query, idle in transaction, blocking locks, pg_cancel_backend vs pg_terminate_backend, and a migration stuck behind a lock.',
        },
        {
          title: 'Lesson 2: Query Statistics',
          href: '/lessons/most-asked-interview-questions/module-17-monitoring/lesson-02-query-stats',
          blurb: 'The slow query log, pg_stat_statements, total time vs mean time, why queries show placeholders, log_min_duration_statement, and EXPLAIN as ongoing practice.',
        },
        {
          title: 'Lesson 3: Sizes, Cache and Index Usage',
          href: '/lessons/most-asked-interview-questions/module-17-monitoring/lesson-03-sizes-and-index-usage',
          blurb: 'Table and index sizes, pg_relation_size vs pg_total_relation_size, the biggest tables, cache hit ratio, unused indexes, and estimating bloat.',
        },
        {
          title: 'Lesson 4: Vacuum Monitoring',
          href: '/lessons/most-asked-interview-questions/module-17-monitoring/lesson-04-vacuum-monitoring',
          blurb: 'What VACUUM is for, dead tuple counts, last_autovacuum and last_autoanalyze, wraparound age, and tuning autovacuum for a hot table.',
        },
        {
          title: 'Lesson 5: Application and Prisma Monitoring',
          href: '/lessons/most-asked-interview-questions/module-17-monitoring/lesson-05-app-and-prisma-monitoring',
          blurb: 'Connection limits, health checks, Prisma pool error codes, tracing a slow request to SQL, diagnosing pool exhaustion, a production checklist, and alerts that matter.',
        },
      ]}
    />
  );
}
