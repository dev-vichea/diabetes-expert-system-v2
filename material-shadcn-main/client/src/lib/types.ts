export interface StatsCard {
  title: string;
  description: string;
  value?: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  lastUpdate: string;
  chartData: number[];
  chartLabels: string[];
}

export interface ProjectMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface ProjectData {
  id: string;
  name: string;
  company: string;
  icon: string;
  iconColor: string;
  members: ProjectMember[];
  budget: string;
  completion: number;
  status: 'working' | 'done' | 'cancelled';
}

export interface Author {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  department: string;
  status: 'online' | 'offline';
  employed: string;
}

export interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

export interface Message {
  id: string;
  sender: string;
  avatar: string;
  preview: string;
  time: string;
}

export interface SettingsState {
  emailOnFollow: boolean;
  emailOnReply: boolean;
  emailOnMention: boolean;
  newLaunches: boolean;
  monthlyUpdates: boolean;
  newsletter: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}
