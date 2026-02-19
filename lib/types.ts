export type UserRole = 'admin' | 'user'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'on_hold'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TaskCategory {
  id: string
  name: string
  description: string
  color_hex: string
  created_by: string | null
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  created_by: string
  assigned_to: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  category_id: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  is_deleted: boolean
  // Joined fields
  creator?: Profile
  assignee?: Profile
  category?: TaskCategory
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  comment_text: string
  created_at: string
  user?: Profile
}

export interface TaskHistory {
  id: string
  task_id: string
  changed_by: string
  field_name: string
  old_value: string | null
  new_value: string | null
  change_timestamp: string
  changer?: Profile
}

export interface DashboardStats {
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  overdue_tasks: number
  total_users: number
}
