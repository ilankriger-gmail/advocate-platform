// Cores da marca
const primaryColor = '#8B5CF6'; // Roxo (primary-500)
const accentColor = '#F472B6'; // Rosa (accent-500)

export default {
  light: {
    text: '#111827', // gray-900
    textSecondary: '#6B7280', // gray-500
    background: '#F9FAFB', // gray-50
    card: '#FFFFFF',
    tint: primaryColor,
    tabIconDefault: '#9CA3AF', // gray-400
    tabIconSelected: primaryColor,
    border: '#E5E7EB', // gray-200
    primary: primaryColor,
    accent: accentColor,
    success: '#10B981', // emerald-500
    warning: '#F59E0B', // amber-500
    error: '#EF4444', // red-500
  },
  dark: {
    text: '#F9FAFB', // gray-50
    textSecondary: '#9CA3AF', // gray-400
    background: '#111827', // gray-900
    card: '#1F2937', // gray-800
    tint: primaryColor,
    tabIconDefault: '#6B7280', // gray-500
    tabIconSelected: primaryColor,
    border: '#374151', // gray-700
    primary: primaryColor,
    accent: accentColor,
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
};
