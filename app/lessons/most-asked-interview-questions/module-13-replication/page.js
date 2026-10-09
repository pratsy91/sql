import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 13: Replication - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL replication interview questions split into lessons: replication basics and lag, streaming vs logical replication with slots, and high availability with failover.',
};

export default function Module13ReplicationIndex() {
  return (
    <ModuleLessonIndex
      title="Module 13: Replication"
      intro="Replication keeps a second copy of your database on another server, and these lessons cover the questions interviewers ask about it from junior to senior."
      lessons={[
        {
          title: 'Lesson 1: Replication Basics',
          href: '/lessons/most-asked-interview-questions/module-13-replication/lesson-01-replication-basics',
          blurb:
            'Primary vs replica, why read replicas exist, read-only standbys, hot standby, sync vs async, replication lag, and why a replica is not a backup.',
        },
        {
          title: 'Lesson 2: Streaming and Logical Replication',
          href: '/lessons/most-asked-interview-questions/module-13-replication/lesson-02-streaming-and-logical',
          blurb:
            'How streaming replication works, publications and subscriptions, physical vs logical, replication slots and retained WAL, missing DDL, and near-zero-downtime major upgrades.',
        },
        {
          title: 'Lesson 3: High Availability and Failover',
          href: '/lessons/most-asked-interview-questions/module-13-replication/lesson-03-ha-and-failover',
          blurb:
            'Failover and promotion, split brain and fencing, sync vs async in production, cascading replication, read-your-writes with Prisma, and connection routing.',
        },
      ]}
    />
  );
}
