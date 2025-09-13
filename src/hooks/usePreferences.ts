import { useState, useEffect } from 'react';
import { getUserPreferences, saveUserPreferences, deleteUserPreferences, type UserPreferences } from '@/services/preferences';
import { useToast } from '@/hooks/use-toast';

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const data = await getUserPreferences();
      setPreferences(data);
    } catch (error: any) {
      console.error('Failed to load preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load preferences',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (preferencesText: string) => {
    try {
      setIsSaving(true);
      const data = await saveUserPreferences(preferencesText);
      setPreferences(data);
      toast({
        title: 'Success',
        description: 'Preferences saved successfully'
      });
    } catch (error: any) {
      console.error('Failed to save preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive'
      });
      throw error; // Re-throw so caller can handle if needed
    } finally {
      setIsSaving(false);
    }
  };

  const deletePreferences = async () => {
    try {
      setIsSaving(true);
      await deleteUserPreferences();
      setPreferences(null);
      toast({
        title: 'Success',
        description: 'Preferences deleted successfully'
      });
    } catch (error: any) {
      console.error('Failed to delete preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete preferences',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    preferences,
    isLoading,
    isSaving,
    savePreferences,
    deletePreferences,
    loadPreferences
  };
}
