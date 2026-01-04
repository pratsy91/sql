export default function CodeBlock({ title, language, code }) {
  return (
    <div className="mb-6">
      {title && (
        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
          {title}
        </h4>
      )}
      <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}

