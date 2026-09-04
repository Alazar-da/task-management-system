// services/profileService.ts
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function createUserProfile(userId: string, email: string, username: string) {
  try {
    // First check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      return { success: true, message: 'Profile already exists' };
    }

    // Try to insert profile
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        username: username,
        avatar_url: null,
      });

    if (insertError) {
      // If insert fails, try upsert
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          username: username,
          avatar_url: null,
        }, { onConflict: 'id' });

      if (upsertError) {
        throw upsertError;
      }
    }

    return { success: true, message: 'Profile created successfully' };
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    throw error;
  }
}