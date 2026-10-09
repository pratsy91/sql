import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 15: Advanced Features - Production Scenarios",
  description: "Production incidents from partitions, advisory locks, LISTEN/NOTIFY, and foreign data wrappers",
};

export default function ScenarioM15Index() {
  return (
    <ModuleLessonIndex
      title="Module 15: Advanced Features"
      intro="Phase 15 incidents: partitioning, notifications, and remote tables fail in ways a normal table does not."
      lessons={[
        {
          title: "Lesson 1: Partition Incidents",
          href: "/lessons/most-asked-scenario-interview-questions/module-15-advanced/lesson-01-partition-incidents",
          blurb: "Inserts with no partition, queries that scan every partition, and uniqueness that does not hold.",
        },
        {
          title: "Lesson 2: Locks, NOTIFY, and FDW",
          href: "/lessons/most-asked-scenario-interview-questions/module-15-advanced/lesson-02-locks-notify-fdw",
          blurb: "Advisory locks that never release, missed notifications, and a foreign table that hangs the request.",
        }
      ]}
    />
  );
}
