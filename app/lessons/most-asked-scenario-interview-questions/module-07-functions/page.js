import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 7: Functions and Operators - Production Scenarios",
  description: "Production incidents from date functions, NULL filters, and expressions that stop indexes being used",
};

export default function ScenarioM07Index() {
  return (
    <ModuleLessonIndex
      title="Module 7: Functions and Operators"
      intro="Phase 7 incidents: a function changes the answer or makes a fast query slow."
      lessons={[
        {
          title: "Lesson 1: Wrong Dates and NULL Filters",
          href: "/lessons/most-asked-scenario-interview-questions/module-07-functions/lesson-01-dates-and-null-filters",
          blurb: "Reports bucketed on the wrong day, and COALESCE that hides bad data.",
        },
        {
          title: "Lesson 2: Functions That Kill Indexes",
          href: "/lessons/most-asked-scenario-interview-questions/module-07-functions/lesson-02-functions-that-kill-indexes",
          blurb: "A filter that used to be fast becomes a sequential scan after a \"small\" SQL change.",
        }
      ]}
    />
  );
}
