import FormSwitch from '../components/FormSwitch';
import { ORDER_CARD_CLASS } from '../styles/pageClasses';
import { useTheme } from './ThemeProvider';

export function ThemeSettingsSection() {
  const { theme, setTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={ORDER_CARD_CLASS}>
      <FormSwitch
        layout="embedded"
        label="Світла тема"
        checked={isLight}
        onChange={(next) => setTheme(next ? 'light' : 'dark')}
        description="Змінює фон інтерфейсу."
      />
    </div>
  );
}
