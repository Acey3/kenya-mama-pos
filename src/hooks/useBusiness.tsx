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
    consumerKey: string;
    consumerSecret: string;
    passkey: string;
    isLive: boolean;
  } | null;
  paystackCredentials: {
    publicKey: string;
    secretKey: string;
    isLive: boolean;
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
      .from("businesses")
      .select("id, business_name, mpesa_shortcode, mpesa_consumer_key, mpesa_consumer_secret, mpesa_passkey, is_mpesa_live, paystack_public_key, paystack_secret_key, is_paystack_live")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching business:", error);
    } else if (data) {
      console.log("Business data found:", data.business_name);
      setBusinessName(data.business_name || "My Shop");
      setBusinessId(data.id);
      setMpesaCredentials({
        shortcode: data.mpesa_shortcode || "",
        consumerKey: data.mpesa_consumer_key || "",
        consumerSecret: data.mpesa_consumer_secret || "",
        passkey: data.mpesa_passkey || "",
        isLive: data.is_mpesa_live || false,
      });
      setPaystackCredentials({
        publicKey: data.paystack_public_key || "",
        secretKey: data.paystack_secret_key || "",
        isLive: data.is_paystack_live || false,
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
