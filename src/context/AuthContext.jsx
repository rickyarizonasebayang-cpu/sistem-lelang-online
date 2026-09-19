import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth State
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 1. Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      });

      // 2. Listen to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Demo Mode: load saved demo user from localStorage if any
      const savedUser = localStorage.getItem('lelang_demo_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed.user);
          setProfile(parsed.profile);
        } catch (e) {
          console.error('Failed to parse demo user', e);
        }
      } else {
        // Default demo user: Ahmad Fadillah (Role: user)
        const defaultDemo = {
          user: { id: 'user-demo-1', email: 'ahmad@example.com' },
          profile: { id: 'user-demo-1', email: 'ahmad@example.com', full_name: 'Ahmad Fadillah', role: 'user' }
        };
        setUser(defaultDemo.user);
        setProfile(defaultDemo.profile);
        localStorage.setItem('lelang_demo_user', JSON.stringify(defaultDemo));
      }
      setLoading(false);
    }
  }, []);

  // Fetch user profile from Supabase
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        setProfile(data);
      } else {
        // If profile row doesn't exist yet, construct basic profile
        const basicProfile = {
          id: userId,
          email: user?.email,
          full_name: user?.user_metadata?.full_name || 'Pengguna Lelang',
          role: user?.user_metadata?.role || 'user'
        };
        setProfile(basicProfile);
      }
    } catch (err) {
      console.error('Profile fetch exception:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sign In
  const signIn = async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } else {
      // Demo Mode Sign In
      const isAdmin = email.toLowerCase().includes('admin');
      const demoData = {
        user: { id: isAdmin ? 'admin-demo-1' : 'user-demo-1', email },
        profile: {
          id: isAdmin ? 'admin-demo-1' : 'user-demo-1',
          email,
          full_name: isAdmin ? 'Administrator Lelang' : (email.split('@')[0] || 'Ahmad Fadillah'),
          role: isAdmin ? 'admin' : 'user'
        }
      };
      setUser(demoData.user);
      setProfile(demoData.profile);
      localStorage.setItem('lelang_demo_user', JSON.stringify(demoData));
      return demoData;
    }
  };

  // Sign Up
  const signUp = async (email, password, fullName, requestedRole = 'user') => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: requestedRole,
          },
        },
      });
      if (error) throw error;

      // Upsert profile in case trigger hasn't fired
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          role: requestedRole,
        });
      }

      return data;
    } else {
      // Demo Mode Sign Up
      const demoData = {
        user: { id: 'user-' + Date.now(), email },
        profile: {
          id: 'user-' + Date.now(),
          email,
          full_name: fullName,
          role: requestedRole
        }
      };
      setUser(demoData.user);
      setProfile(demoData.profile);
      localStorage.setItem('lelang_demo_user', JSON.stringify(demoData));
      return demoData;
    }
  };

  // Sign Out
  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem('lelang_demo_user');
  };

  // Switch role for convenient testing in demo mode
  const switchDemoRole = (newRole) => {
    if (profile) {
      const updatedProfile = { ...profile, role: newRole };
      setProfile(updatedProfile);
      localStorage.setItem('lelang_demo_user', JSON.stringify({ user, profile: updatedProfile }));
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        signIn,
        signUp,
        signOut,
        fetchProfile,
        switchDemoRole,
        isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
