import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 2: Data Types - Production Scenarios",
  description: "Production incidents caused by money types, integer overflow, time zones, JSONB, and ENUMs, with fixes",
};

export default function ScenarioM02Index() {
  return (
    <ModuleLessonIndex
      title="Module 2: Data Types"
      intro="Phase 2 incidents: the query runs, but the stored value is wrong, or a write starts failing after years of working."
      lessons={[
        {
          title: "Lesson 1: Money and Integer Incidents",
          href: "/lessons/most-asked-scenario-interview-questions/module-02-data-types/lesson-01-money-and-integer-incidents",
          blurb: "Totals that do not match invoices, and inserts that die with integer out of range.",
        },
        {
          title: "Lesson 2: Time, JSON, and ENUM Incidents",
          href: "/lessons/most-asked-scenario-interview-questions/module-02-data-types/lesson-02-time-json-enum-incidents",
          blurb: "Off-by-hours timestamps, JSONB updates that wipe fields, and enum migrations that fail in a transaction.",
        }
      ]}
    />
  );
}
