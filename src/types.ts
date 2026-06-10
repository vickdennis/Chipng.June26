export interface ThemeConfig {
  primaryColor: string;
  backgroundColor: string;
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
