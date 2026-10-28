export interface User {
  id: string;
  name: string;
  email: string;
  role: 'AICTE_ADMIN' | 'FINANCE_OFFICER' | 'INSTITUTION_USER' | 'BANK_NODAL';
  avatarUrl?: string;
}

export interface ApiResponseEnvelope<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  errors?: unknown[];
  errorCode?: string;
  timestamp: string;
}

export interface MetricCardData {
  title: string;
  value: string | number;
  subtext?: string;
  change?: string;
  isPositive?: boolean;
  iconName: string;
  colorScheme: 'violet' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'sky';
}

export interface ProjectTaskItem {
  id: string;
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  dueDate: string;
  assignee: {
    name: string;
    avatar: string;
  };
  tags?: string[];
}

export interface ProjectCardData {
  id: string;
  title: string;
  description: string;
  progress: number;
  tasksCount: number;
  status: 'active' | 'completed' | 'archived';
  members: { name: string; avatar: string }[];
  color: string;
}
