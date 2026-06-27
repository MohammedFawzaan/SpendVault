// Default categories seeded on first launch (DATABASE_SCHEMA.md §Table 2)

export interface DefaultCategory {
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: 'Food',          icon: '🍽️', color: '#FF6B6B', type: 'expense' },
  { name: 'Transport',     icon: '🚗', color: '#4ECDC4', type: 'expense' },
  { name: 'Shopping',      icon: '🛍️', color: '#A855F7', type: 'expense' },
  { name: 'Bills',         icon: '💡', color: '#F59E0B', type: 'expense' },
  { name: 'Health',        icon: '🏥', color: '#EF4444', type: 'expense' },
  { name: 'Entertainment', icon: '🎬', color: '#EC4899', type: 'expense' },
  { name: 'Salary',        icon: '💰', color: '#4CAF82', type: 'income'  },
  { name: 'Freelance',     icon: '💻', color: '#3B82F6', type: 'income'  },
  { name: 'Cashback',      icon: '🎁', color: '#10B981', type: 'income'  },
  { name: 'Other',         icon: '📦', color: '#6B7280', type: 'both'    },
];
