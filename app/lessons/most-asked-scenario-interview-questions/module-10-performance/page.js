import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 10: Performance - Production Scenarios",
  description: "Production incidents from sequential scans, bad indexes, bloat, and pool timeouts, with fixes",
};

export default function ScenarioM10Index() {
  return (
    <ModuleLessonIndex
      title="Module 10: Performance"
      intro="Phase 10 incidents: the query is correct and the site is still slow."
      lessons={[
        {
          title: "Lesson 1: Slow Queries",
          href: "/lessons/most-asked-scenario-interview-questions/module-10-performance/lesson-01-slow-queries",
          blurb: "A page that used to be fast now scans a whole table.",
        },
        {
          title: "Lesson 2: Bloat, Vacuum, and Pool Timeouts",
          href: "/lessons/most-asked-scenario-interview-questions/module-10-performance/lesson-02-bloat-vacuum-pool",
          blurb: "Tables that stay huge, autovacuum falling behind, and apps waiting for a connection.",
        }
      ]}
    />
  );
}
