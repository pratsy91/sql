import Navigation from './Navigation';

export default function LessonLayout({ children }) {
  return (
    <div className="flex">
      <Navigation />
      <main className="flex-1 ml-64 p-8 max-w-5xl">
        {children}
      </main>
    </div>
  );
}

