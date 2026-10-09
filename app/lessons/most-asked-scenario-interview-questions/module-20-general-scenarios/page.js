import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 20: General Production Scenarios - Production Scenarios",
  description: "Cross-topic on-call scenarios: writes failing, a slow site, and data that looks wrong after a release",
};

export default function ScenarioM20Index() {
  return (
    <ModuleLessonIndex
      title="Module 20: General Production Scenarios"
      intro="These incidents do not belong to one chapter. You have to narrow the cause, then fix it."
      lessons={[
        {
          title: "Lesson 1: Writes Are Failing",
          href: "/lessons/most-asked-scenario-interview-questions/module-20-general-scenarios/lesson-01-writes-are-failing",
          blurb: "Reads work. Inserts and updates do not. A short on-call order.",
        },
        {
          title: "Lesson 2: The Site Is Slow",
          href: "/lessons/most-asked-scenario-interview-questions/module-20-general-scenarios/lesson-02-the-site-is-slow",
          blurb: "A checklist when the only symptom is latency.",
        },
        {
          title: "Lesson 3: Data Looks Wrong After a Release",
          href: "/lessons/most-asked-scenario-interview-questions/module-20-general-scenarios/lesson-03-data-looks-wrong",
          blurb: "The release succeeded. Customers say the numbers or the rows are wrong.",
        }
      ]}
    />
  );
}
