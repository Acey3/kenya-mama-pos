import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
// icons
import { Save, Store, Globe, Bell, Shield, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

const LS_KEY = "mama_duka_config_v1";

// TODO: Move these types to a separate types file later
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

const defaults: SettingsData = {
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

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<SettingsData>(defaults);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        setSettings({ ...defaults, ...JSON.parse(saved) });
      } catch (err) {
        console.error("error loading settings", err);
      }
    }
  }, []);

  // Simple handler for field updates
  // had to use 'any' here for the value because types were getting annoying with the Switch component
  const handleChange = (field: string, val: any) => {
    setSettings(prev => ({
        ...prev,
        [field]: val
    }));
    setHasChanges(true);
  };

  const onSave = async () => {
    setSaving(true);
    console.log("Saving settings...", settings); // remove this before deploy

    try {
      localStorage.setItem(LS_KEY, JSON.stringify(settings));
      
      // handle language switch
      if (settings.language !== i18n.language) {
        await i18n.changeLanguage(settings.language);
      }
      
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Something went wrong saving.",
        variant: "destructive",
      });
    }
    
    setSaving(false);
  };

  return (
    <div className="space-y-6 p-2">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>
        {/* Only show warning if there are unsaved changes */}
        {hasChanges && (
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm font-medium">
            You have unsaved changes
          </div>
        )}
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <div className="mt-4">
            <TabsContent value="general">
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                    <CardTitle className="flex gap-2 items-center">
                        <Store size={20} />
                        Store Details
                    </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Shop Name</Label>
                            <Input 
                                value={settings.shopName}
                                onChange={(e) => handleChange('shopName', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Currency</Label>
                            <Select 
                                value={settings.currency} 
                                onValueChange={(val) => handleChange('currency', val)}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="KSh">KES (Shilling)</SelectItem>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Address</Label>
                            <Input 
                                value={settings.address}
                                placeholder="Nairobi, Kenya..."
                                onChange={(e) => handleChange('address', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex gap-2 items-center">
                            <Globe size={20} /> 
                            Localization
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                         <div className="grid gap-2">
                            <Label>Language</Label>
                            <Select 
                                value={settings.language} 
                                onValueChange={(val) => handleChange('language', val)}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="sw">Kiswahili</SelectItem>
                                    <SelectItem value="ki">Gĩkũyũ</SelectItem>
                                    <SelectItem value="luo">Dholuo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>
            </TabsContent>

            <TabsContent value="notifications">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex gap-2 items-center"><Bell size={20}/> Alerts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Enable Push Notifications</Label>
                            <Switch 
                                checked={settings.notifications}
                                onCheckedChange={(checked) => handleChange('notifications', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Low Stock Alerts</Label>
                            <Switch 
                                checked={settings.lowStockAlert}
                                onCheckedChange={(c) => handleChange('lowStockAlert', c)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="payments">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex gap-2 items-center"><Smartphone size={20}/> Mobile Money</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>M-Pesa Till / Paybill</Label>
                            <Input 
                                placeholder="e.g. 543210"
                                value={settings.mpesaNumber}
                                onChange={(e) => handleChange('mpesaNumber', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Make sure this is a business number, personal numbers won't work with the API.</p>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            
            {/* System settings tab */}
            <TabsContent value="system">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex gap-2 items-center"><Shield size={20}/> Data & Backup</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label>Offline Mode</Label>
                                <p className="text-xs text-muted-foreground">Cache data locally when internet is down</p>
                            </div>
                            <Switch 
                                checked={settings.offlineMode}
                                onCheckedChange={(c) => handleChange('offlineMode', c)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </div>
      </Tabs>

      <div className="flex justify-end pt-4">
        <Button 
            onClick={onSave} 
            disabled={!hasChanges || saving}
            className="w-full md:w-auto"
        >
          {saving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
        </Button>
      </div>
    </div>
  );
}