import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 13: Replication - Production Scenarios",
  description: "Production incidents from replica lag, hot-standby conflicts, failover, and replication slots",
};

export default function ScenarioM13Index() {
  return (
    <ModuleLessonIndex
      title="Module 13: Replication"
      intro="Phase 13 incidents: the copy of the database is behind, or the disk fills because a slot will not move."
      lessons={[
        {
          title: "Lesson 1: Replica Lag and Conflicts",
          href: "/lessons/most-asked-scenario-interview-questions/module-13-replication/lesson-01-replica-lag-and-conflicts",
          blurb: "Reads that miss new rows, and queries on the replica that get canceled.",
        },
        {
          title: "Lesson 2: Failover and Replication Slots",
          href: "/lessons/most-asked-scenario-interview-questions/module-13-replication/lesson-02-failover-and-slots",
          blurb: "Apps still writing to the old primary, and a slot that fills the disk.",
        }
      ]}
    />
  );
}
