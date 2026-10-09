import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 16: Prisma ORM - Production Scenarios",
  description: "Production incidents from Prisma migration drift, pool timeouts, N+1 queries, and missing rows",
};

export default function ScenarioM16Index() {
  return (
    <ModuleLessonIndex
      title="Module 16: Prisma ORM"
      intro="Phase 16 incidents: Prisma and the database disagree, or the client uses the database in a way that only fails under load."
      lessons={[
        {
          title: "Lesson 1: Migration Drift and Failed Deploys",
          href: "/lessons/most-asked-scenario-interview-questions/module-16-prisma/lesson-01-migration-drift",
          blurb: "Drift detected, a migration that failed halfway, and a shadow database missing an extension.",
        },
        {
          title: "Lesson 2: Pool Timeouts, N+1, and Missing Rows",
          href: "/lessons/most-asked-scenario-interview-questions/module-16-prisma/lesson-02-pool-n-plus-one-missing-rows",
          blurb: "P2024 pool timeouts, N+1 includes, and P2025 record not found.",
        }
      ]}
    />
  );
}
