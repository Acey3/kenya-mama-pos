import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BusinessContextType {
  businessName: string;
  businessId: string | null;
  loading: boolean;
}

const BusinessContext = createContext<BusinessContextType>({
  businessName: "My Shop",
  businessId: null,
  loading: true,
});

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState("My Shop");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchBusiness = async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, business_name")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (data) {
        setBusinessName(data.business_name);
        setBusinessId(data.id);
      }
      setLoading(false);
    };

    fetchBusiness();

    // Listen for changes to business
    const channel = supabase
      .channel("business-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "businesses" }, () => {
        fetchBusiness();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <BusinessContext.Provider value={{ businessName, businessId, loading }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
