export default function InterviewQACard({ level = 'Mid', question, children }) {
  const levelStyles = {
    Junior: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    Mid: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Senior: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  };

  return (
    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4 border border-zinc-200 dark:border-zinc-700">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span
          className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${
            levelStyles[level] || levelStyles.Mid
          }`}
        >
          {level}
        </span>
      </div>
      <h3 className="font-semibold mb-2 text-zinc-900 dark:text-zinc-50">Q: {question}</h3>
      <div className="text-sm text-zinc-700 dark:text-zinc-300 space-y-2">{children}</div>
    </div>
  );
}
