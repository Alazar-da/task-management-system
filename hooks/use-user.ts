// hooks/use-user.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/types/user";

export function useUser() {
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);
    
  const supabase = createClient();

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(undefined);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email, role, avatar_url")
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setUser(undefined);
      } else {
        setUser(data);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(undefined);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    userRefetch: fetchUser,
  };
}