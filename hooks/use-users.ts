// hooks/use-users.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";

const supabase = createClient();

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email, avatar_url")
        .order("username");

      if (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}