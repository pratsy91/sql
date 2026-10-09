import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 12: Backup and Recovery - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL backup and recovery interview questions split into lessons: logical backups with pg_dump, WAL and point-in-time recovery, and backup strategy including RPO, RTO, and the Prisma backup story.',
};

export default function MaiqModule12BackupIndex() {
  return (
    <ModuleLessonIndex
      title="Module 12: Backup and Recovery"
      intro="Three lessons that take you from running pg_dump to explaining a full production backup strategy with real recovery numbers."
      lessons={[
        {
          title: 'Lesson 1: Logical Backups',
          href: '/lessons/most-asked-interview-questions/module-12-backup/lesson-01-logical-backups',
          blurb:
            'Logical vs physical backups, pg_dump vs pg_dumpall, custom vs plain format, pg_restore, dumping a single table or schema, whether pg_dump blocks writes, parallel jobs, and production pitfalls.',
        },
        {
          title: 'Lesson 2: WAL and Point-in-Time Recovery',
          href: '/lessons/most-asked-interview-questions/module-12-backup/lesson-02-wal-and-pitr',
          blurb:
            'What WAL is in simple words, WAL archiving, base backups, continuous archiving vs a nightly dump, PITR step by step, and the checklist for restoring to an exact minute.',
        },
        {
          title: 'Lesson 3: Backup Strategy',
          href: '/lessons/most-asked-interview-questions/module-12-backup/lesson-03-backup-strategy',
          blurb:
            'RPO and RTO, the 3-2-1 rule, restore drills, retention and cost, whether a replica counts as a backup, large-database design, failover, and answering the Prisma backup question.',
        },
      ]}
    />
  );
}
