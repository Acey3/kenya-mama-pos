import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function OnlineStatusIndicator() {
  const { isOnline, pendingCount, isSyncing, syncPendingData } = useOnlineStatus();
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      {/* Online/Offline Status */}
      <div
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
          isOnline
            ? 'bg-success/10 text-success'
            : 'bg-destructive/10 text-destructive'
        )}
      >
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3" />
            <span className="hidden sm:inline">{t('common.online')}</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span className="hidden sm:inline">{t('common.offline')}</span>
          </>
        )}
      </div>

      {/* Pending Sync Badge */}
      {pendingCount > 0 && (
        <Badge variant="secondary" className="gap-1">
          <CloudOff className="h-3 w-3" />
          <span>{pendingCount}</span>
          <span className="hidden sm:inline">{t('common.syncPending')}</span>
        </Badge>
      )}

      {/* Manual Sync Button */}
      {isOnline && pendingCount > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={syncPendingData}
          disabled={isSyncing}
          className="h-7 px-2"
        >
          <RefreshCw className={cn('h-3 w-3', isSyncing && 'animate-spin')} />
        </Button>
      )}
    </div>
  );
}
