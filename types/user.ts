export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  role: "user" | "admin";
  created_at?: string;
}