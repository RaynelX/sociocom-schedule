import { useState } from 'react';
import type { StudentSettings } from './SettingsProvider';

interface Props {
  onComplete: (settings: StudentSettings) => void;
}

export function SettingsSetup({ onComplete }: Props) {
  const [subgroup, setSubgroup] = useState<'a' | 'b' | null>(null);
  const [language, setLanguage] = useState<'en' | 'de' | null>(null);

  const canSubmit = subgroup !== null && language !== null;

  const handleSubmit = () => {
    if (subgroup && language) {
      onComplete({ subgroup, language });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-black">
      <div className="w-full max-w-sm space-y-8">
        {/* Заголовок */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Student Hub</h1>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-2">
            Выберите подгруппу и язык для отображения расписания
          </p>
        </div>

        {/* Подгруппа */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-gray-700 dark:text-neutral-300">Подгруппа</legend>
          <div className="grid grid-cols-2 gap-3">
            <OptionButton
              selected={subgroup === 'a'}
              onClick={() => setSubgroup('a')}
            >
              Подгруппа А
            </OptionButton>
            <OptionButton
              selected={subgroup === 'b'}
              onClick={() => setSubgroup('b')}
            >
              Подгруппа Б
            </OptionButton>
          </div>
        </fieldset>

        {/* Язык */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-gray-700">
            Иностранный язык
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <OptionButton
              selected={language === 'en'}
              onClick={() => setLanguage('en')}
            >
              Английский
            </OptionButton>
            <OptionButton
              selected={language === 'de'}
              onClick={() => setLanguage('de')}
            >
              Немецкий
            </OptionButton>
          </div>
        </fieldset>

        {/* Кнопка */}
        <button
          disabled={!canSubmit}
          onClick={handleSubmit}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
            canSubmit
              ? 'bg-blue-600 text-white active:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Продолжить
        </button>
      </div>
    </div>
  );
}

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
        selected
          ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 active:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}