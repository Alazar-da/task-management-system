// lib/query-keys.ts
export const queryKeys = {
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
  },
  users: {
    all: ['users'] as const,
  },
  profiles: {
    all: ['profiles'] as const,
    detail: (id: string) => [...queryKeys.profiles.all, id] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.tasks.lists(), { filters }] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
    byProject: (projectId: string) => [...queryKeys.tasks.all, 'project', projectId] as const,
  },
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.projects.all, id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
  },
};