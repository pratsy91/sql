import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 17: Monitoring and Maintenance - Production Scenarios",
  description: "Production incidents you debug from activity, locks, disk, and autovacuum warnings",
};

export default function ScenarioM17Index() {
  return (
    <ModuleLessonIndex
      title="Module 17: Monitoring and Maintenance"
      intro="Phase 17 is how you find the cause when the ticket only says the site is broken."
      lessons={[
        {
          title: "Lesson 1: Finding the Bad Query and the Blocker",
          href: "/lessons/most-asked-scenario-interview-questions/module-17-monitoring/lesson-01-bad-query-and-blocker",
          blurb: "Where to look when you do not yet know the SQL.",
        },
        {
          title: "Lesson 2: Disk, Wraparound, and Connection Spikes",
          href: "/lessons/most-asked-scenario-interview-questions/module-17-monitoring/lesson-02-disk-wraparound-connections",
          blurb: "The alerts that mean you are about to stop accepting writes.",
        }
      ]}
    />
  );
}
