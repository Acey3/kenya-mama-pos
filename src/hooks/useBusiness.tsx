import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BusinessContextType {
  businessName: string;
  businessId: string | null;
  loading: boolean;
  refreshBusiness: () => Promise<void>;
  mpesaCredentials: {
    shortcode: string;
    isLive: boolean;
    isConfigured: boolean;
  } | null;
  paystackCredentials: {
    publicKey: string;
    isLive: boolean;
    isConfigured: boolean;
  } | null;
}

const BusinessContext = createContext<BusinessContextType>({
  businessName: "My Shop",
  businessId: null,
  loading: true,
  refreshBusiness: async () => {},
  mpesaCredentials: null,
  paystackCredentials: null,
});

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState("My Shop");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [mpesaCredentials, setMpesaCredentials] = useState<BusinessContextType['mpesaCredentials']>(null);
  const [paystackCredentials, setPaystackCredentials] = useState<BusinessContextType['paystackCredentials']>(null);
  const [loading, setLoading] = useState(true);

  const fetchBusiness = async () => {
    if (!user) return;
    
    console.log("Fetching business for user:", user.id);
    const { data, error } = await supabase
      .from("businesses_safe" as any)
      .select("id, business_name, mpesa_shortcode, is_mpesa_live, is_mpesa_configured, paystack_public_key, is_paystack_live, is_paystack_configured")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching business:", error);
    } else if (data) {
      const b = data as any;
      console.log("Business data found:", b.business_name);
      setBusinessName(b.business_name || "My Shop");
      setBusinessId(b.id);
      setMpesaCredentials({
        shortcode: b.mpesa_shortcode || "",
        isLive: b.is_mpesa_live || false,
        isConfigured: !!b.is_mpesa_configured,
      });
      setPaystackCredentials({
        publicKey: b.paystack_public_key || "",
        isLive: b.is_paystack_live || false,
        isConfigured: !!b.is_paystack_configured,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchBusiness();

    // Listen for changes
    const channel = supabase
      .channel("business-changes")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "businesses",
        filter: `owner_id=eq.${user.id}`
      }, () => {
        fetchBusiness();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <BusinessContext.Provider value={{ businessName, businessId, loading, mpesaCredentials, paystackCredentials, refreshBusiness: fetchBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
