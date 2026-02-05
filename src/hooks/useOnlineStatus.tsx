import { useState, useEffect, useCallback } from 'react';
import { getPendingSyncCount, getPendingSync, removePendingSync } from '@/lib/offlineDb';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Matches the PendingSync type from offlineDb.ts
interface PendingSyncItem {
  id: string;
  type: 'sale' | 'stock' | 'customer';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export function useOnlineStatus() {
  // defaulting to true to avoid hydration mismatch flickering in Next.js
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // simple event listeners for network status
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Connection Restored',
        description: 'Syncing data...',
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'You are offline',
        description: 'Changes will be saved locally.',
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

  // Check for unsynced items every few seconds
  // TODO: Maybe move this to React Query later? Polling is kinda expensive.
  useEffect(() => {
    const checkPending = async () => {
      try {
        const count = await getPendingSyncCount();
        setPendingCount(count);
      } catch (e) {
        // quiet fail is fine here
        console.warn("Error checking pending syncs", e);
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 5000); 

    return () => clearInterval(interval);
  }, []);

  const syncPendingData = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    console.log("Starting sync...");

    try {
      // cast this to our interface so TS doesn't yell at us
      const pendingItems = (await getPendingSync()) as PendingSyncItem[];
      
      if (pendingItems.length === 0) {
        setIsSyncing(false);
        return;
      }

      // loop through local items and push to supabase
      for (const item of pendingItems) {
        try {
            const { type, action, data } = item;
            
            // Map type to table name
            const tableMap: Record<string, string> = {
              sale: 'sales',
              stock: 'products', 
              customer: 'profiles'
            };
            const tableName = tableMap[type] || type;

            if (action === 'create') {
                const { error } = await supabase.from(tableName as 'sales').insert(data);
                if (error) throw error;
            } else if (action === 'update') {
                const { error } = await supabase.from(tableName as 'sales').update(data).eq('id', data.id);
                if (error) throw error;
            } else if (action === 'delete') {
                const { error } = await supabase.from(tableName as 'sales').delete().eq('id', data.id);
                if (error) throw error;
            } else {
                console.warn("Unknown sync action:", action);
            }
          
            // cleanup local db after success
            await removePendingSync(item.id);

        } catch (err) {
          console.error('Failed to sync item:', item.id, err);
          // continue to next item even if one fails
        }
      }

      // update the badge count
      const newCount = await getPendingSyncCount();
      setPendingCount(newCount);

      toast({
        title: 'Sync Complete',
        description: `Uploaded ${pendingItems.length} items.`,
      });

    } catch (error) {
      console.error('CRITICAL: Sync failed completely:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, toast]);

  // Auto-trigger sync when we come back online
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