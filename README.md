# TaskFlow - Task Management System

A modern, full-featured task management application built with Next.js, Supabase, and Tailwind CSS. TaskFlow helps teams and individuals organize projects, track tasks, and boost productivity with an intuitive interface.

🔗 **Live Demo**: [https://my-task-management-system.vercel.app/](https://my-task-management-system.vercel.app/)

## ✨ Features

### Core Functionality
- **Authentication**: Secure login with email/password and Google OAuth
- **Projects**: Create, edit, delete, and manage projects with custom colors and status tracking
- **Tasks**: Full CRUD operations with Kanban board and list views
- **Task Board**: Drag-and-drop interface with columns for To Do, In Progress, Review, and Done
- **Task Details**: Rich task view with subtasks, comments, file attachments, and activity logs
- **Calendar**: Visualize tasks by due date with month and week views
- **Dashboard**: Comprehensive overview with statistics cards, progress charts, and recent activity
- **Reports**: Detailed analytics with task trends, project distribution, and productivity metrics
- **File Management**: Upload, download, and delete task attachments
- **Profile Management**: Update profile, change password, and manage avatar
- **Real-time Updates**: Instant task status updates across the application

### User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode**: System-aware and manual theme switching
- **Keyboard Shortcuts**: ⌘K for quick search
- **Loading States**: Skeleton loaders and spinners for better UX
- **Toast Notifications**: Instant feedback for all actions

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query) (React Query)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

### Backend
- **BaaS**: [Supabase](https://supabase.com/)
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Storage**: Supabase Storage for file attachments and avatars
- **Realtime**: Supabase Realtime for live updates

### DevOps
- **Hosting**: [Vercel](https://vercel.com/)
- **Database**: [Supabase Cloud](https://supabase.com/)
- **Version Control**: Git + GitHub

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Supabase account (free tier works)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Alazar-da/task-management-system.git
   cd task-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql`
   - Set up storage buckets for `profiles` and `task-attachments`
   - Configure authentication providers (email + Google OAuth)

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Test Credentials
```
Email: user1@gmail.com
Password: User1234#
```
*Note: These credentials are for testing the live demo. For local development, create your own account.*

## 📁 Project Structure

```
task-management-system/
├── app/
│   ├── auth/                 # Authentication pages
│   │   ├── callback/         # OAuth callback handler
│   │   ├── forgot-password/  # Forgot password page
│   │   ├── login/            # Login/Registration page
│   │   └── reset-password/   # Password reset page
│   ├── activity/             # Activity feed page
│   ├── calendar/             # Calendar page
│   ├── dashboard/            # Dashboard page
│   ├── file/                 # File management page
│   ├── profile/              # User profile page
│   ├── projects/             # Project management
│   │   ├── [projectId]/      # Project detail page
│   │   └── page.tsx          # Projects list page
│   ├── reports/              # Reports & analytics page
│   └── tasks/                # Task management
│       ├── [taskId]/         # Task detail page
│       └── page.tsx          # Tasks page
├── components/
│   ├── projects/             # Project components
│   ├── tasks/                # Task components
│   └── ui/                   # shadcn/ui components
├── hooks/                    # Custom React hooks
├── lib/                      # Utilities and configurations
│   ├── providers/            # Context providers
│   └── supabase/             # Supabase client
├── services/                 # API service layer
├── types/                    # TypeScript type definitions
└── public/                   # Static assets
    └── icons/                # Favicon and app icons
```

## 🗄️ Database Schema

### Core Tables
- **profiles**: User profiles with avatar and username
- **projects**: Project management with status and color
- **project_members**: User-project associations with roles
- **tasks**: Task management with status, priority, and assignee
- **subtasks**: Task breakdown with completion tracking
- **task_comments**: User comments on tasks
- **task_attachments**: File attachments for tasks
- **activity_logs**: Audit trail of all actions

### Row Level Security (RLS)
All tables have RLS policies to ensure:
- Users can only access their own projects and tasks
- Project members have appropriate permissions
- Task assignees are automatically added as project members
- Secure file storage access

## 🔐 Authentication Flow

1. **Login**: Email/password or Google OAuth
2. **Registration**: New user accounts with email verification
3. **Password Reset**: 
   - User requests reset via `/auth/forgot-password`
   - Email sent with reset link
   - User sets new password via `/auth/reset-password`
4. **Session Management**: Automatic token refresh
5. **Protected Routes**: Redirect unauthenticated users to login

## 🎨 UI Features

### Color System
- **Priority Colors**: Low (Blue), Medium (Yellow), High (Orange), Urgent (Red)
- **Status Colors**: To Do (Gray), In Progress (Blue), Review (Purple), Done (Green)
- **Project Colors**: 10 preset colors with custom picker

### Responsive Breakpoints
- **Mobile**: < 768px - Collapsible sidebar, compact cards
- **Tablet**: 768px - 1024px - Two-column layouts
- **Desktop**: > 1024px - Full layouts with sidebars

## 🔒 Security Features

- **Authentication**: JWT-based with Supabase Auth
- **Authorization**: RLS policies at database level
- **Password Reset**: Secure email-based password reset flow
- **Session Management**: Automatic token refresh
- **File Security**: Storage policies for user-specific files

## 📊 Performance Optimizations

- **Code Splitting**: Next.js dynamic imports
- **Image Optimization**: Next.js Image component
- **Data Caching**: TanStack Query with stale-while-revalidate
- **Debounced Search**: Reduced API calls
- **Virtualized Lists**: For large task lists (planned)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React Framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [shadcn/ui](https://ui.shadcn.com/) - UI Component Library
- [Vercel](https://vercel.com/) - Hosting Platform
- All open-source contributors whose libraries made this possible

## 📧 Contact

- **Project Link**: [https://github.com/Alazar-da/task-management-system](https://github.com/Alazar-da/task-management-system)
- **Live Demo**: [https://my-task-management-system.vercel.app/](https://my-task-management-system.vercel.app/)

---

Made with ❤️ by [Alazar Damena Girma] - TaskFlow Team