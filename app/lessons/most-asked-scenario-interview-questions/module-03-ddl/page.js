import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 3: DDL - Production Scenarios",
  description: "Production incidents from migrations, locks, invalid indexes, and dependent views, with fixes",
};

export default function ScenarioM03Index() {
  return (
    <ModuleLessonIndex
      title="Module 3: DDL"
      intro="Phase 3 incidents: a deploy hangs or a migration looks successful while the database is stuck."
      lessons={[
        {
          title: "Lesson 1: Migration Locks",
          href: "/lessons/most-asked-scenario-interview-questions/module-03-ddl/lesson-01-migration-locks",
          blurb: "Deploys that hang because ALTER TABLE is waiting on a lock.",
        },
        {
          title: "Lesson 2: Invalid Indexes and Dependencies",
          href: "/lessons/most-asked-scenario-interview-questions/module-03-ddl/lesson-02-invalid-indexes-and-dependencies",
          blurb: "CREATE INDEX CONCURRENTLY left an invalid index, or DROP failed because a view still uses the column.",
        }
      ]}
    />
  );
}
