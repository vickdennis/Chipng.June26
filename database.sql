-- ChipNG Database Schema Specification for Supabase (PostgreSQL)
-- This file contains the DDL, Triggers, and Row-Level Security (RLS) policies.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(255) UNIQUE NOT NULL,
    email TEXT,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    cover_image TEXT,
    theme JSONB DEFAULT '{"primaryColor": "#6366f1", "backgroundColor": "#0f172a", "cardStyle": "glassmorphism", "textColor": "#ffffff"}'::jsonb,
    icon_style TEXT,
    nfc_data JSONB DEFAULT '{"serialNumber": null, "activationStatus": "pending"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for username lookup
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(50) DEFAULT 'user' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and add policies for roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own role"
ON public.roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view and manage all roles"
ON public.roles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.roles r2 WHERE r2.user_id = auth.uid() AND r2.role = 'admin'
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.roles r2 WHERE r2.user_id = auth.uid() AND r2.role = 'admin'
    )
);

-- Blogs/Posts Table
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for blogs"
ON public.blogs FOR SELECT USING (true);

CREATE POLICY "Admins can manage blogs"
ON public.blogs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for products"
ON public.products FOR SELECT USING (true);

CREATE POLICY "Admins can manage products"
ON public.products FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Anyone can insert an appointment (book)
CREATE POLICY "Anyone can book an appointment"
ON public.appointments FOR INSERT
WITH CHECK (true);

-- Profile owners can view their appointments
CREATE POLICY "Profile owners can view appointments"
ON public.appointments FOR SELECT
USING (auth.uid() = profile_id);

-- Profile owners can delete their appointments
CREATE POLICY "Profile owners can delete appointments"
ON public.appointments FOR DELETE
USING (auth.uid() = profile_id);

-- 2. Table: links
CREATE TABLE IF NOT EXISTS public.links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT,
    order_index INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index on user_id and order_index for fast retrieval and sorting
CREATE INDEX IF NOT EXISTS links_user_id_order_idx ON public.links(user_id, order_index);

-- Enable Row-Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security (RLS) Policies

-- Profiles Table Policies:
-- Any guest or authenticated user can view public profiles.
CREATE POLICY "Public profiles are viewable by anyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can only update their own profile.
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Links Table Policies:
-- Anyone can view links that are active, and owners can view all of their own links (active or inactive)
CREATE POLICY "Links are viewable by anyone if active, or owner" 
ON public.links FOR SELECT 
USING (is_active = true OR auth.uid() = user_id);

-- Authenticated users can insert their own links.
CREATE POLICY "Users can insert their own links" 
ON public.links FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update or delete their own links.
CREATE POLICY "Users can update their own links" 
ON public.links FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links" 
ON public.links FOR DELETE 
USING (auth.uid() = user_id);


-- 4. Automated User Profile Creation Trigger
-- Whenever a new user signs up via Supabase Auth, automatically insert a record into public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_username TEXT;
    username_exists BOOLEAN;
BEGIN
    -- Derive username from user metadata if provided, otherwise from email
    IF new.raw_user_meta_data->>'username' IS NOT NULL AND (new.raw_user_meta_data->>'username') != '' THEN
        new_username := LOWER(new.raw_user_meta_data->>'username');
    ELSE
        new_username := LOWER(SPLIT_PART(new.email, '@', 1));
    END IF;
    
    -- Check if it already exists, if so append random characters
    LOOP
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE username = new_username) INTO username_exists;
        IF NOT username_exists THEN
            EXIT;
        END IF;
        new_username := LOWER(SPLIT_PART(new.email, '@', 1)) || '-' || substring(md5(random()::text) from 1 for 4);
    END LOOP;

    INSERT INTO public.profiles (id, username, display_name, bio, avatar_url, cover_image, icon_style)
    VALUES (
        new.id,
        new_username,
        COALESCE(new.raw_user_meta_data->>'display_name', SPLIT_PART(new.email, '@', 1)),
        'Hello, I am using ChipNG!',
        new.raw_user_meta_data->>'avatar_url',
        NULL,
        NULL
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on auth.users row creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Storage
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('covers', 'covers', true),
  ('backgrounds', 'backgrounds', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Cover images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Users can upload their own cover" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Background images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'backgrounds');
CREATE POLICY "Users can upload their own background" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own cover" ON storage.objects FOR UPDATE USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own cover" ON storage.objects FOR DELETE USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own background" ON storage.objects FOR UPDATE USING (bucket_id = 'backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own background" ON storage.objects FOR DELETE USING (bucket_id = 'backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Reload PostgREST schema cache to ensure the changes take effect
NOTIFY pgrst, 'reload schema';
