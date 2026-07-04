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

import { useBusiness } from "@/hooks/useBusiness";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "mama_duka_config_v1";

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
  mpesaConsumerKey: string;
  mpesaConsumerSecret: string;
  mpesaPasskey: string;
  isMpesaLive: boolean;
  paystackPublicKey: string;
  paystackSecretKey: string;
  isPaystackLive: boolean;
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
  mpesaConsumerKey: "",
  mpesaConsumerSecret: "",
  mpesaPasskey: "",
  isMpesaLive: false,
  paystackPublicKey: "",
  paystackSecretKey: "",
  isPaystackLive: false,
  defaultPayment: "cash",
  offlineMode: true,
  autoBackup: true,
  backupFrequency: "daily",
};

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { businessId, mpesaCredentials, paystackCredentials, businessName, refreshBusiness } = useBusiness();
  const [settings, setSettings] = useState<SettingsData>(defaults);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize settings once from context/localstorage
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    let initial = defaults;
    if (saved) {
      try {
        initial = { ...defaults, ...JSON.parse(saved) };
      } catch (err) {
        console.error("error loading settings", err);
      }
    }

    setSettings({
      ...initial,
      shopName: businessName || initial.shopName,
      mpesaNumber: mpesaCredentials?.shortcode || initial.mpesaNumber,
      // Secret credentials are never sent to the client; leave blank so
      // the user can enter a new value to update, or keep existing on save.
      mpesaConsumerKey: "",
      mpesaConsumerSecret: "",
      mpesaPasskey: "",
      isMpesaLive: mpesaCredentials?.isLive || initial.isMpesaLive,
      paystackPublicKey: paystackCredentials?.publicKey || initial.paystackPublicKey,
      paystackSecretKey: "",
      isPaystackLive: paystackCredentials?.isLive || initial.isPaystackLive,
    });
  }, [businessId, mpesaCredentials, paystackCredentials, businessName]);

  const handleChange = (field: string, val: any) => {
    setSettings(prev => ({
        ...prev,
        [field]: val
    }));
    setHasChanges(true);
  };

  const onSave = async () => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to save settings.", variant: "destructive" });
        return;
    }

    setSaving(true);

    try {
      // 1. Update or Insert into Supabase (Upsert)
      // Only include secret fields in the payload when the user actually
      // entered a new value — blank means "keep existing".
      const payload: Record<string, any> = {
        id: businessId || undefined,
        owner_id: user.id,
        business_name: settings.shopName,
        mpesa_shortcode: settings.mpesaNumber,
        is_mpesa_live: settings.isMpesaLive,
        paystack_public_key: settings.paystackPublicKey,
        is_paystack_live: settings.isPaystackLive,
      };
      if (settings.mpesaConsumerKey) payload.mpesa_consumer_key = settings.mpesaConsumerKey;
      if (settings.mpesaConsumerSecret) payload.mpesa_consumer_secret = settings.mpesaConsumerSecret;
      if (settings.mpesaPasskey) payload.mpesa_passkey = settings.mpesaPasskey;
      if (settings.paystackSecretKey) payload.paystack_secret_key = settings.paystackSecretKey;

      const { error } = await supabase
        .from("businesses")
        .upsert(payload, { onConflict: 'owner_id' });

      if (error) throw error;
      
      // Force refresh the context to update sidebar
      await refreshBusiness();

      // 2. Save UI preferences to localStorage
      localStorage.setItem(LS_KEY, JSON.stringify(settings));
      
      if (settings.language !== i18n.language) {
        await i18n.changeLanguage(settings.language);
      }
      
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (e: any) {
      console.error("Save error:", e);
      toast({
        title: "Error",
        description: e.message || "Something went wrong saving.",
        variant: "destructive",
      });
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-2">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>
        {hasChanges && (
          <div className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded-full text-sm font-medium">
            You have unsaved changes
          </div>
        )}
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 mb-6">
          <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">General</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">Notifications</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">Payments</TabsTrigger>
          <TabsTrigger value="system" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">System</TabsTrigger>
        </TabsList>

        <div className="mt-4">
            <TabsContent value="general" className="space-y-4 animate-in fade-in duration-300">
                <Card className="glass-card">
                    <CardHeader>
                    <CardTitle className="flex gap-2 items-center">
                        <Store size={20} className="text-primary" />
                        Store Details
                    </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Shop Name</Label>
                            <Input 
                                value={settings.shopName}
                                onChange={(e) => handleChange('shopName', e.target.value)}
                                className="bg-background/50"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Currency</Label>
                            <Select 
                                value={settings.currency} 
                                onValueChange={(val) => handleChange('currency', val)}
                            >
                                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
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
                                className="bg-background/50"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex gap-2 items-center">
                            <Globe size={20} className="text-primary" /> 
                            Localization
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                         <div className="grid gap-2">
                            <Label>Language</Label>
                            <Select 
                                value={settings.language} 
                                onValueChange={(val) => handleChange('language', val)}
                            >
                                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
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
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4 animate-in fade-in duration-300">
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex gap-2 items-center text-primary"><Bell size={20}/> Alerts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Enable Push Notifications</Label>
                                <p className="text-xs text-muted-foreground">Receive real-time alerts on your device</p>
                            </div>
                            <Switch 
                                checked={settings.notifications}
                                onCheckedChange={(checked) => handleChange('notifications', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Low Stock Alerts</Label>
                                <p className="text-xs text-muted-foreground">Notify me when products fall below threshold</p>
                            </div>
                            <Switch 
                                checked={settings.lowStockAlert}
                                onCheckedChange={(c) => handleChange('lowStockAlert', c)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4 animate-in fade-in duration-300">
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex gap-2 items-center text-primary"><Smartphone size={20}/> Paystack Integration (Recommended)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <div className="space-y-0.5">
                                <Label className="text-base">Environment</Label>
                                <p className="text-xs text-muted-foreground">Toggle between Test and Live Paystack API</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-bold ${!settings.isPaystackLive ? 'text-blue-500' : 'text-muted-foreground'}`}>TEST</span>
                                <Switch 
                                    checked={settings.isPaystackLive}
                                    onCheckedChange={(c) => handleChange('isPaystackLive', c)}
                                />
                                <span className={`text-xs font-bold ${settings.isPaystackLive ? 'text-green-500' : 'text-muted-foreground'}`}>LIVE</span>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Paystack Public Key</Label>
                                <Input 
                                    placeholder="pk_test_..."
                                    value={settings.paystackPublicKey}
                                    onChange={(e) => handleChange('paystackPublicKey', e.target.value)}
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Paystack Secret Key</Label>
                                <Input 
                                    type="password"
                                    placeholder="sk_test_..."
                                    value={settings.paystackSecretKey}
                                    onChange={(e) => handleChange('paystackSecretKey', e.target.value)}
                                    className="bg-background/50"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card opacity-60">
                    <CardHeader>
                        <CardTitle className="flex gap-2 items-center text-muted-foreground"><Smartphone size={20}/> Legacy M-Pesa Daraja Integration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-muted-foreground/10">
                            <div className="space-y-0.5">
                                <Label className="text-base">Environment</Label>
                                <p className="text-xs text-muted-foreground">Toggle between Sandbox and Live M-Pesa API</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-bold ${!settings.isMpesaLive ? 'text-blue-500' : 'text-muted-foreground'}`}>SANDBOX</span>
                                <Switch 
                                    checked={settings.isMpesaLive}
                                    onCheckedChange={(c) => handleChange('isMpesaLive', c)}
                                />
                                <span className={`text-xs font-bold ${settings.isMpesaLive ? 'text-green-500' : 'text-muted-foreground'}`}>LIVE</span>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>M-Pesa Shortcode (Till/Paybill)</Label>
                                <Input 
                                    placeholder="e.g. 174379"
                                    value={settings.mpesaNumber}
                                    onChange={(e) => handleChange('mpesaNumber', e.target.value)}
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Consumer Key</Label>
                                <Input 
                                    type="password"
                                    placeholder="Enter Daraja Consumer Key"
                                    value={settings.mpesaConsumerKey}
                                    onChange={(e) => handleChange('mpesaConsumerKey', e.target.value)}
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Consumer Secret</Label>
                                <Input 
                                    type="password"
                                    placeholder="Enter Daraja Consumer Secret"
                                    value={settings.mpesaConsumerSecret}
                                    onChange={(e) => handleChange('mpesaConsumerSecret', e.target.value)}
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Online Passkey (LNM)</Label>
                                <Input 
                                    type="password"
                                    placeholder="Enter Lipa Na M-Pesa Passkey"
                                    value={settings.mpesaPasskey}
                                    onChange={(e) => handleChange('mpesaPasskey', e.target.value)}
                                    className="bg-background/50"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="system" className="space-y-4 animate-in fade-in duration-300">
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex gap-2 items-center text-primary"><Shield size={20}/> Data & Backup</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
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

      <div className="flex justify-end pt-4 sticky bottom-0 bg-background/50 backdrop-blur-sm p-4 border-t z-10">
        <Button 
            onClick={onSave} 
            disabled={!hasChanges || saving}
            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-11 px-8"
        >
          {saving ? "Saving Changes..." : <><Save className="mr-2 h-4 w-4" /> Save Configuration</>}
        </Button>
      </div>
    </div>
  );
}
