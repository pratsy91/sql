import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 18: Best Practices - Production Scenarios",
  description: "Production incidents from deploy order, missing indexes on foreign keys, and designs that do not survive real traffic",
};

export default function ScenarioM18Index() {
  return (
    <ModuleLessonIndex
      title="Module 18: Best Practices"
      intro="Phase 18 incidents: the design worked in review and failed when two versions of the app ran together."
      lessons={[
        {
          title: "Lesson 1: Deploy and Migration Order",
          href: "/lessons/most-asked-scenario-interview-questions/module-18-best-practices/lesson-01-deploy-and-migration-order",
          blurb: "Old and new app versions running against one schema.",
        },
        {
          title: "Lesson 2: Designs That Break in Production",
          href: "/lessons/most-asked-scenario-interview-questions/module-18-best-practices/lesson-02-designs-that-break",
          blurb: "Missing foreign-key indexes, a god JSONB column, and a job that queries in a loop.",
        }
      ]}
    />
  );
}
