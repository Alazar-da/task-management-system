"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  username: string | null;
  email: string | null;
  role: string | null;
};

export default function DashboardPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth/login";
        return;
      }

      console.log("User ID:", user);

      const { data, error } = await supabase
        .from("profiles")
        .select("username, email, role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
      }

      setProfile(data);
      setLoading(false);
    };

    getProfile();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();

    window.location.href = "/auth/login";
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>
        Welcome, {profile?.username}
      </h1>

      <p>
        Role: {profile?.role}
      </p>

      <button onClick={handleLogout}>
        Log Out
      </button>
    </div>
  );
}

