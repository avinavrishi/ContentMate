import { ContentSection } from '../components/ContentSection';
import { HOME_SECTIONS } from '../config/constants';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-emerald-600 to-rose-600 dark:from-purple-400 dark:via-emerald-400 dark:to-rose-400 bg-clip-text text-transparent mb-4">
          Welcome to ContentMate!
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">Choose a workflow or start with an empty file</p>
      </div>

      <div className="space-y-12">
        {HOME_SECTIONS.map((section) => (
          <ContentSection
            key={section.title}
            {...section}
          />
        ))}
      </div>
    </div>
  );
} 