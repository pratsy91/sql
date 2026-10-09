import Link from 'next/link';
import LessonLayout from './LessonLayout';

export default function ModuleLessonIndex({ title, intro, lessons }) {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">{title}</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">{intro}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
          {lessons.map((lesson) => (
            <Link
              key={lesson.href}
              href={lesson.href}
              className="block p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-1">{lesson.title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{lesson.blurb}</p>
            </Link>
          ))}
        </div>
      </div>
    </LessonLayout>
  );
}
