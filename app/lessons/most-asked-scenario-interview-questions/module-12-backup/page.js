import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 12: Backup and Recovery - Production Scenarios",
  description: "Production incidents from restores that fail, disk full from WAL, and backups that were never tested",
};

export default function ScenarioM12Index() {
  return (
    <ModuleLessonIndex
      title="Module 12: Backup and Recovery"
      intro="Phase 12 incidents: you need the data back, and the backup is missing, old, or unrestorable."
      lessons={[
        {
          title: "Lesson 1: Restore Failures",
          href: "/lessons/most-asked-scenario-interview-questions/module-12-backup/lesson-01-restore-failures",
          blurb: "pg_restore errors, missing extensions, and point-in-time recovery that lands on the wrong moment.",
        },
        {
          title: "Lesson 2: Disk Full and Untested Backups",
          href: "/lessons/most-asked-scenario-interview-questions/module-12-backup/lesson-02-disk-full-and-untested-backups",
          blurb: "WAL filling the disk, and a green backup job whose file cannot be restored.",
        }
      ]}
    />
  );
}
