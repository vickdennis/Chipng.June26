import { supabase, isSupabaseConfigured, supabaseUrl } from "../supabaseClient.js";
import { Profile, LinkItem, UserSession, ThemeConfig, NfcData } from "../types";

// Setup offline fallback memory/local state storage
const TOKEN_KEY = "chipng_token";
const USER_KEY = "chipng_user";

export const api = {
  // Check if we are running in full local sandbox mode or actual Supabase
  isUsingSupabase: () => isSupabaseConfigured,

  // General Auth Actions
  auth: {
    signUp: async (email: string, password: string, username: string, display_name: string): Promise<UserSession> => {
      if (isSupabaseConfigured && supabase) {
        // Sign up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name,
              username: username.toLowerCase().trim()
            }
          }
        });

        if (error) throw new Error(error.message);
        if (!data.user) throw new Error("Could not register user.");

        // Wait a slight fraction for the public.profiles database trigger to run
        return {
          user: {
            id: data.user.id,
            email: data.user.email || email,
            username: username.toLowerCase().trim()
          },
          token: data.session?.access_token || null
        };
      } else {
        // Local Sandbox Mode via Express/SQLite-mock
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, username, display_name })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to sign up.");
        }

        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data;
      }
    },

    signIn: async (email: string, password: string): Promise<UserSession> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw new Error(error.message);
        if (!data.user) throw new Error("No user returned.");

        // Query profile for username
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", data.user.id)
          .single();

        return {
          user: {
            id: data.user.id,
            email: data.user.email || email,
            username: profile?.username || email.split("@")[0]
          },
          token: data.session?.access_token || "supabase-auth"
        };
      } else {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to log in.");
        }

        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data;
      }
    },

    signInWithGoogle: async (): Promise<void> => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw new Error(error.message);
      } else {
        throw new Error("Google login is only available when connected to Supabase.");
      }
    },

    resetPasswordForEmail: async (email: string): Promise<void> => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}?reset_password=true`,
        });
        if (error) throw new Error(error.message);
      } else {
        throw new Error("Password reset is only available when connected to Supabase.");
      }
    },

    updatePassword: async (newPassword: string): Promise<void> => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        if (error) throw new Error(error.message);
      } else {
        throw new Error("Updating password is only available when connected to Supabase.");
      }
    },

    signOut: async (): Promise<void> => {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    },

    getCurrentUser: () => {
      if (isSupabaseConfigured && supabase) {
        // Return async check if we want, or simple session check
        const session = localStorage.getItem("sb-" + supabaseUrl + "-auth-token");
        if (session) {
          try {
            const parsed = JSON.parse(session);
            return {
              id: parsed.user?.id,
              email: parsed.user?.email,
              username: parsed.user?.user_metadata?.username || ""
            };
          } catch {
            return null;
          }
        }
        return null;
      } else {
        const userStr = localStorage.getItem(USER_KEY);
        if (!userStr) return null;
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    },

    getToken: () => {
      if (isSupabaseConfigured) {
        return "supabase-auth";
      }
      return localStorage.getItem(TOKEN_KEY);
    }
  },

  // Profile Actions
  profile: {
    checkUsername: async (username: string): Promise<boolean> => {
      const cleanUsername = username.toLowerCase().trim();
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", cleanUsername);

        if (error) return false;
        return data.length === 0;
      } else {
        const response = await fetch(`/api/profile/check-username?username=${encodeURIComponent(cleanUsername)}`);
        if (!response.ok) return false;
        const data = await response.json();
        return data.available;
      }
    },

    get: async (): Promise<Profile> => {
      if (isSupabaseConfigured && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthenticated");

        let attempts = 0;
        let lastErrorMsg = "";
        while (attempts < 5) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (data) {
            return {
              ...data,
              theme: data.theme || {
                primaryColor: "#6366f1",
                backgroundColor: "#0f172a",
                cardStyle: "glassmorphism",
                textColor: "#ffffff"
              },
              nfc_data: data.nfc_data || {
                serialNumber: null,
                activationStatus: "pending"
              }
            } as Profile;
          }
          if (error) {
            lastErrorMsg = error.message;
          }
          attempts++;
          if (attempts < 5) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        throw new Error(lastErrorMsg || "Profile record creation is taking longer than expected. Please refresh.");
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch("/api/profile", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to load profile.");
        }

        return await response.json();
      }
    },

    uploadImage: async (file: File, bucket: string): Promise<string> => {
      if (isSupabaseConfigured && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthenticated");

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
      } else {
        throw new Error("Image upload is only supported with Supabase configured.");
      }
    },

    update: async (updates: {
      display_name?: string;
      bio?: string;
      avatar_url?: string;
      cover_image?: string;
      theme?: Partial<ThemeConfig>;
      icon_style?: string;
      nfc_data?: Partial<NfcData>;
      username?: string;
    }): Promise<Profile> => {
      if (isSupabaseConfigured && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthenticated");

        const { data, error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data as Profile;
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to update profile.");
        }

        // update stored user username if customized
        if (updates.username) {
          const stored = localStorage.getItem(USER_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.username = updates.username.toLowerCase().trim();
            localStorage.setItem(USER_KEY, JSON.stringify(parsed));
          }
        }

        return await response.json();
      }
    },

    getPublicProfile: async (username: string): Promise<{ profile: Profile; links: LinkItem[] }> => {
      const cleanUsername = username.toLowerCase().trim();
      if (isSupabaseConfigured && supabase) {
        // Fetch public profile and associated active links
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", cleanUsername)
          .single();

        if (profileErr) throw new Error("Profile not found.");

        const robustProfile = {
          ...profile,
          theme: profile.theme || {
            primaryColor: "#6366f1",
            backgroundColor: "#0f172a",
            cardStyle: "glassmorphism",
            textColor: "#ffffff"
          },
          nfc_data: profile.nfc_data || {
            serialNumber: null,
            activationStatus: "pending"
          }
        };

        const { data: links, error: linksErr } = await supabase
          .from("links")
          .select("*")
          .eq("user_id", profile.id)
          .eq("is_active", true)
          .order("order_index", { ascending: true });

        if (linksErr) throw new Error("Failed to load associated card links.");

        return {
          profile: robustProfile as Profile,
          links: links as LinkItem[]
        };
      } else {
        const response = await fetch(`/api/profile/public/${encodeURIComponent(cleanUsername)}`);
        if (!response.ok) {
          throw new Error("Public profile not found.");
        }
        return await response.json();
      }
    }
  },

  // Links CRUD Actions
  links: {
    list: async (): Promise<LinkItem[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthenticated");

        const { data, error } = await supabase
          .from("links")
          .select("*")
          .eq("user_id", user.id)
          .order("order_index", { ascending: true });

        if (error) throw new Error(error.message);
        return data as LinkItem[];
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch("/api/links", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to load links.");
        return await response.json();
      }
    },

    create: async (link: { title: string; url: string; icon: string; is_active?: boolean }): Promise<LinkItem> => {
      if (isSupabaseConfigured && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthenticated");

        // Calculate next order index
        const { data: currentLinks } = await supabase
          .from("links")
          .select("order_index")
          .eq("user_id", user.id);
        
        const nextIdx = currentLinks && currentLinks.length > 0 
          ? Math.max(...currentLinks.map(l => l.order_index)) + 1 
          : 0;

        const { data, error } = await supabase
          .from("links")
          .insert({
            user_id: user.id,
            title: link.title,
            url: link.url,
            icon: link.icon,
            order_index: nextIdx,
            is_active: link.is_active !== undefined ? link.is_active : true
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data as LinkItem;
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch("/api/links", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(link)
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to create link.");
        }

        return await response.json();
      }
    },

    update: async (id: string, updates: { title?: string; url?: string; icon?: string; is_active?: boolean; order_index?: number }): Promise<LinkItem> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from("links")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data as LinkItem;
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch(`/api/links/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to update link.");
        }

        return await response.json();
      }
    },

    reorder: async (linkIds: string[]): Promise<void> => {
      if (isSupabaseConfigured && supabase) {
        // Run updates for each link sequentially
        const promises = linkIds.map((id, index) => {
          return supabase
            .from("links")
            .update({ order_index: index })
            .eq("id", id);
        });

        await Promise.all(promises);
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch("/api/links/reorder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ linkIds })
        });

        if (!response.ok) throw new Error("Failed to reorder links on the server.");
      }
    },

    delete: async (id: string): Promise<void> => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from("links")
          .delete()
          .eq("id", id);

        if (error) throw new Error(error.message);
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch(`/api/links/${id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to delete link.");
        }
      }
    }
  },

  // Appointments Actions
  appointments: {
    list: async (): Promise<any[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthenticated");

        const { data, error } = await supabase
          .from("appointments")
          .select("*")
          .eq("profile_id", user.id)
          .order("date", { ascending: true })
          .order("time", { ascending: true });

        if (error) throw new Error(error.message);
        return data || [];
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch("/api/appointments", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to load appointments.");
        return await response.json();
      }
    },

    book: async (profile_id: string, date: string, time: string, guest_name: string, guest_email: string): Promise<any> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from("appointments")
          .insert({
            profile_id,
            date,
            time,
            guest_name,
            guest_email
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      } else {
        const response = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile_id, date, time, guest_name, guest_email })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to book appointment.");
        }

        return await response.json();
      }
    },

    delete: async (id: string): Promise<void> => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from("appointments")
          .delete()
          .eq("id", id);

        if (error) throw new Error(error.message);
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch(`/api/appointments/${id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to delete appointment.");
        }
      }
    }
  },

  // Admin Actions
  admin: {
    checkIsAdmin: async (): Promise<boolean> => {
      if (isSupabaseConfigured && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        
        if (user.email === 'vickthor.dennis@gmail.com') return true;

        const { data } = await supabase
          .from("roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        
        return data?.role === "admin";
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return false;
        const decodedEmail = JSON.parse(atob(token.split('.')[1] || "e30=")).email;
        if (decodedEmail === 'vickthor.dennis@gmail.com') return true;
        
        // Use users endpoint to check if we can fetch users
        try {
          const res = await fetch("/api/admin/users", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          return res.ok;
        } catch {
          return false;
        }
      }
    },
    
    getUsers: async (): Promise<any[]> => {
      if (isSupabaseConfigured && supabase) {
        // Mocked or minimal representation. Supabase doesn't let standard users query auth.users easily unless we created a view or query profiles.
        const { data: profiles } = await supabase.from("profiles").select("*");
        const { data: roles } = await supabase.from("roles").select("*");
        
        return (profiles || []).map(p => {
          const r = (roles || []).find(r => r.user_id === p.id);
          return {
            id: p.id,
            username: p.username,
            display_name: p.display_name,
            role: r ? r.role : "user"
          };
        });
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        const res = await fetch("/api/admin/users", { headers: { "Authorization": `Bearer ${token}` } });
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      }
    },
    suspendUser: async (id: string): Promise<void> => {
      if (isSupabaseConfigured && supabase) {
        // usually handled via Edge functions or direct admin api
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        await fetch(`/api/admin/users/${id}/suspend`, { method: "POST", headers: { "Authorization": `Bearer ${token}` } });
      }
    },
    deleteUser: async (id: string): Promise<void> => {
      if (isSupabaseConfigured && supabase) {
         await supabase.from("profiles").delete().eq("id", id);
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        await fetch(`/api/admin/users/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      }
    },
    
    getAnalytics: async (): Promise<any> => {
      if (isSupabaseConfigured && supabase) {
        const [{ count: userCount }, { count: postCount }, { count: prodCount }] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('blogs').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true })
        ]);
        return {
          totalUsers: userCount || 0,
          totalPosts: postCount || 0,
          totalProducts: prodCount || 0
        };
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        const res = await fetch("/api/admin/analytics", { headers: { "Authorization": `Bearer ${token}` } });
        return res.json();
      }
    },

    getBlogs: async (): Promise<any[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from("blogs").select("*");
        return data || [];
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        const res = await fetch("/api/admin/blogs", { headers: { "Authorization": `Bearer ${token}` } });
        return res.json();
      }
    },
    createBlog: async (title: string, content: string): Promise<any> => {
      if (isSupabaseConfigured && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data } = await supabase.from("blogs").insert({ title, content, author_id: user?.id }).select().single();
        return data;
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        const res = await fetch("/api/admin/blogs", { 
          method: "POST", 
          body: JSON.stringify({ title, content }), 
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } 
        });
        return res.json();
      }
    },
    deleteBlog: async (id: string): Promise<void> => {
       if (isSupabaseConfigured && supabase) {
         await supabase.from("blogs").delete().eq("id", id);
       } else {
         const token = localStorage.getItem(TOKEN_KEY);
         await fetch(`/api/admin/blogs/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
       }
    },

    getProducts: async (): Promise<any[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from("products").select("*");
        return data || [];
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        const res = await fetch("/api/admin/products", { headers: { "Authorization": `Bearer ${token}` } });
        return res.json();
      }
    },
    createProduct: async (name: string, description: string, price: number): Promise<any> => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from("products").insert({ name, description, price }).select().single();
        return data;
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        const res = await fetch("/api/admin/products", { 
          method: "POST", 
          body: JSON.stringify({ name, description, price }), 
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } 
        });
        return res.json();
      }
    },
    deleteProduct: async (id: string): Promise<void> => {
       if (isSupabaseConfigured && supabase) {
         await supabase.from("products").delete().eq("id", id);
       } else {
         const token = localStorage.getItem(TOKEN_KEY);
         await fetch(`/api/admin/products/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
       }
    }
  }
};
