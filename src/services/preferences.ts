import { supabase } from "@/lib/supabase";

export interface UserPreferences {
  id: string;
  user_id: string;
  preferences_text: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get user preferences for the current authenticated user
 */
export async function getUserPreferences(): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - user has no preferences yet
      return null;
    }
    console.error('Error fetching user preferences:', error);
    throw new Error(`Failed to fetch user preferences: ${error.message} (Code: ${error.code})`);
  }

  return data;
}

/**
 * Create or update user preferences
 */
export async function saveUserPreferences(preferencesText: string): Promise<UserPreferences> {
  // First try to update existing preferences
  const { data: existingData, error: selectError } = await supabase
    .from('user_preferences')
    .select('id')
    .single();

  if (selectError && selectError.code !== 'PGRST116') {
    console.error('Error checking existing preferences:', selectError);
    throw new Error(`Failed to check existing preferences: ${selectError.message} (Code: ${selectError.code})`);
  }

  if (existingData) {
    // Update existing preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .update({ preferences_text: preferencesText })
      .select('*')
      .single();

    if (error) {
      console.error('Error updating user preferences:', error);
      throw new Error(`Failed to update user preferences: ${error.message} (Code: ${error.code})`);
    }

    return data;
  } else {
    // Create new preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .insert({ preferences_text: preferencesText })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating user preferences:', error);
      throw new Error(`Failed to create user preferences: ${error.message} (Code: ${error.code})`);
    }

    return data;
  }
}

/**
 * Delete user preferences
 */
export async function deleteUserPreferences(): Promise<void> {
  const { error } = await supabase
    .from('user_preferences')
    .delete();

  if (error) {
    throw new Error(`Failed to delete user preferences: ${error.message}`);
  }
}
