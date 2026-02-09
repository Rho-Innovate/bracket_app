export const AppTheme = {
  colors: {
    primary: '#2F622A',
    primaryDark: '#274B0D',
    secondary: '#013D5A',
    accent: '#4CAF50',
    error: '#d32f2f',
    background: '#ffffff',
    surface: '#f9f9f9',
    surfaceVariant: '#f5f5f5',
    text: '#1a1a1a',
    textSecondary: '#666666',
    textMuted: '#999999',
    border: '#cccccc',
    divider: '#e5e5e5',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 28,
  },
};

// Skill level colors for consistency across the app
export const skillLevelColors: Record<string, string> = {
  Beginner: '#FFE0B2',
  Intermediate: '#C8E6C9',
  Advanced: '#BBDEFB',
};

// Game state colors
export const gameStateColors: Record<string, string> = {
  scheduled: '#2196F3',
  in_progress: '#4CAF50',
  awaiting_results: '#FF9800',
  disputed: '#f44336',
  completed: '#9E9E9E',
  cancelled: '#757575',
};

// Game state labels
export const gameStateLabels: Record<string, string> = {
  scheduled: 'Scheduled',
  in_progress: 'Live',
  awaiting_results: 'Results',
  disputed: 'Disputed',
  completed: 'Done',
  cancelled: 'Cancelled',
};
