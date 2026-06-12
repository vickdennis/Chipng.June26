export interface ThemeConfig {
  primaryColor: string;
  backgroundColor: string;
  backgroundImage?: string;
  fontFamily?: string;
  cardStyle: 'glassmorphism' | 'modern' | 'cyberpunk' | 'neo-brutalism' | 'gold-foil';
  textColor: string;
}

export interface NfcData {
  serialNumber: string | null;
  activationStatus: 'pending' | 'activated' | 'deactivated';
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_image: string | null;
  email: string | null;
  phone: string | null;
  appointments_url: string | null;
  social_twitter: string | null;
  social_linkedin: string | null;
  social_instagram: string | null;
  social_github: string | null;
  theme: ThemeConfig;
  icon_style: string | null;
  nfc_data: NfcData;
  created_at: string;
}

export interface LinkItem {
  id: string;
  user_id: string;
  title: string;
  url: string;
  icon: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface UserSession {
  user: {
    id: string;
    email: string;
    username: string;
  } | null;
  token: string | null;
}
