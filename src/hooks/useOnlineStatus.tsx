import { useState, useEffect, useCallback } from 'react';
import { getPendingSyncCount, getPendingSync, removePendingSync } from '@/lib/offlineDb';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Back Online',
        description: 'Your connection has been restored',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'Offline Mode',
        description: 'You are now working offline. Changes will sync when connected.',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Update pending count periodically
  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await getPendingSyncCount();
      setPendingCount(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    return () => clearInterval(interval);
  }, []);

  const syncPendingData = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const pendingItems = await getPendingSync();
      
      for (const item of pendingItems) {
        try {
          // Process based on type and action
          // This is a placeholder - actual implementation depends on your tables
          console.log('Syncing item:', item);
          
          // After successful sync, remove from pending
          await removePendingSync(item.id);
        } catch (error) {
          console.error('Failed to sync item:', item.id, error);
        }
      }

      const newCount = await getPendingSyncCount();
      setPendingCount(newCount);

      if (pendingItems.length > 0) {
        toast({
          title: 'Sync Complete',
          description: `${pendingItems.length} items synced successfully`,
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, toast]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncPendingData();
    }
  }, [isOnline, pendingCount, syncPendingData]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncPendingData,
  };
}
