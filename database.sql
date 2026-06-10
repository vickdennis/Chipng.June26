-- ChipNG Database Schema Specification for Supabase (PostgreSQL)
-- This file contains the DDL, Triggers, and Row-Level Security (RLS) policies.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(255) UNIQUE NOT NULL,
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
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

