import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/modules/smartFramer/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AppRole = "farmer" | "consumer";

interface AuthContextType {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (data) setRole(data.role as AppRole);
    } catch (err) {
      console.error("Error fetching role:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        if (currentUser) {
          setUser(currentUser);
          fetchRole(currentUser.id);
        } else {
          // Fallback to AgroSmart AI user
          const agroUser = localStorage.getItem('user');
          if (agroUser) {
            try {
              const parsed = JSON.parse(agroUser);
              setUser({ id: parsed.id || 'agro-user', email: parsed.email || 'farmer@agrosmart.ai' } as any);
              setRole('farmer');
            } catch (e) {
              setUser(null);
              setRole(null);
            }
          } else {
            setUser(null);
            setRole(null);
          }
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        setUser(currentUser);
        fetchRole(currentUser.id);
      } else {
        // Fallback to AgroSmart AI user
        const agroUser = localStorage.getItem('user');
        if (agroUser) {
          try {
            const parsed = JSON.parse(agroUser);
            setUser({ id: parsed.id || 'agro-user', email: parsed.email || 'farmer@agrosmart.ai' } as any);
            setRole('farmer');
          } catch (e) {
            setUser(null);
            setRole(null);
          }
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
