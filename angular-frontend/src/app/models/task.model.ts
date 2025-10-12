export interface Task {
    id?: number;
    title: string;
    description?: string;
    user_id?: number;
    status?: 'pending' | 'completed';
  }
  