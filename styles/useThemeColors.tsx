import { useTheme } from '../context/ThemeContext';

export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme;
};