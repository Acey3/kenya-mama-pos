import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Save, Store, Globe, Bell, Shield, Smartphone, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

// Settings storage key
const SETTINGS_KEY = "mama_duka_settings";

interface SettingsData {
  shopName: string;
  currency: string;
  language: string;
  address: string;
  timezone: string;
  notifications: boolean;
  lowStockAlert: boolean;
  dailySummary: boolean;
  paymentConfirmations: boolean;
  mpesaNumber: string;
  defaultPayment: string;
  offlineMode: boolean;
  autoBackup: boolean;
  backupFrequency: string;
}

const defaultSettings: SettingsData = {
  shopName: "My Shop",
  currency: "KSh",
  language: "en",
  address: "",
  timezone: "EAT",
  notifications: true,
  lowStockAlert: true,
  dailySummary: true,
  paymentConfirmations: true,
  mpesaNumber: "",
  defaultPayment: "cash",
  offlineMode: true,
  autoBackup: true,
  backupFrequency: "daily",
};

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Track changes
  const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Save to localStorage
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      
      // Apply language change if needed
      if (settings.language !== i18n.language) {
        await i18n.changeLanguage(settings.language);
      }
      
      setHasChanges(false);
      toast({
        title: t('settings.saved'),
        description: t('settings.savedDescription'),
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast({
      title: "Settings Reset",
      description: "Settings have been reset to defaults. Click Save to apply.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>
        {hasChanges && (
          <span className="text-sm text-warning">Unsaved changes</span>
        )}
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">{t('settings.general')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('settings.notifications')}</TabsTrigger>
          <TabsTrigger value="payments">{t('settings.payments')}</TabsTrigger>
          <TabsTrigger value="system">{t('settings.system')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="mr-2 h-5 w-5" />
                {t('settings.shopInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shopName">{t('settings.shopName')}</Label>
                  <Input
                    id="shopName"
                    value={settings.shopName}
                    onChange={(e) => updateSetting('shopName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('settings.currency')}</Label>
                  <Select value={settings.currency} onValueChange={(v) => updateSetting('currency', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KSh">Kenyan Shilling (KSh)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t('settings.shopAddress')}</Label>
                <Input 
                  id="address" 
                  placeholder="Enter your shop address"
                  value={settings.address}
                  onChange={(e) => updateSetting('address', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                {t('settings.language')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">{t('settings.interfaceLanguage')}</Label>
                <Select value={settings.language} onValueChange={(v) => updateSetting('language', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sw">Kiswahili</SelectItem>
                    <SelectItem value="ki">Gĩkũyũ</SelectItem>
                    <SelectItem value="luo">Dholuo</SelectItem>
                    <SelectItem value="kln">Kalenjin</SelectItem>
                    <SelectItem value="kam">Kĩkamba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">{t('settings.timezone')}</Label>
                <Select value={settings.timezone} onValueChange={(v) => updateSetting('timezone', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EAT">East Africa Time (EAT)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="GMT">GMT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                {t('settings.notificationPrefs')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.pushNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.pushNotificationsDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(v) => updateSetting('notifications', v)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.lowStockAlerts')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.lowStockAlertsDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.lowStockAlert}
                  onCheckedChange={(v) => updateSetting('lowStockAlert', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.dailySummary')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.dailySummaryDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.dailySummary}
                  onCheckedChange={(v) => updateSetting('dailySummary', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.paymentConfirmations')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.paymentConfirmationsDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.paymentConfirmations}
                  onCheckedChange={(v) => updateSetting('paymentConfirmations', v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="mr-2 h-5 w-5" />
                {t('settings.mobileMoneyIntegration')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('settings.mpesaNumber')}</Label>
                <Input 
                  placeholder="Enter your M-Pesa till/paybill number"
                  value={settings.mpesaNumber}
                  onChange={(e) => updateSetting('mpesaNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('settings.defaultPayment')}</Label>
                <Select value={settings.defaultPayment} onValueChange={(v) => updateSetting('defaultPayment', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> M-Pesa integration is configured in sandbox mode for testing.
                  Contact support to enable live payments.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                {t('settings.systemSettings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.offlineMode')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.offlineModeDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.offlineMode}
                  onCheckedChange={(v) => updateSetting('offlineMode', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.autoBackup')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.autoBackupDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(v) => updateSetting('autoBackup', v)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('settings.backupFrequency')}</Label>
                <Select value={settings.backupFrequency} onValueChange={(v) => updateSetting('backupFrequency', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Every Hour</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" onClick={handleResetSettings}>
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSaveSettings} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t('settings.saveSettings')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
