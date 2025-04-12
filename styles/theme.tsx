export const lightTheme = {
  // Base colors
  background: '#ffffff',
  text: '#000000',
  textSecondary: '#666666',
  
  // Brand colors
  primary: '#006a4d',
  secondary: '#236538',
  
  // Component colors
  card: '#ffffff',
  cardBorder: '#e0e0e0',
  input: '#ffffff',
  inputBorder: '#e0e0e0',
  
  // Status colors
  success: '#4CAF50',
  error: '#f44336',
  warning: '#ff9800',
  
  // UI elements
  shadow: 'rgba(0, 0, 0, 0.1)',
  divider: '#e0e0e0',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const darkTheme = {
  // Base colors
  background: '#121212',
  text: '#ffffff',
  textSecondary: '#b3b3b3',
  
  // Brand colors
  primary: '#00ab7a',
  secondary: '#3d8c5f',
  
  // Component colors
  card: '#1e1e1e',
  cardBorder: '#333333',
  input: '#2d2d2d',
  inputBorder: '#404040',
  
  // Status colors
  success: '#81c784',
  error: '#e57373',
  warning: '#ffb74d',
  
  // UI elements
  shadow: 'rgba(0, 0, 0, 0.3)',
  divider: '#333333',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export type Theme = typeof lightTheme;