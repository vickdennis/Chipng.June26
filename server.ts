import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "chipng_db.json");

// Middleware
app.use(express.json());

// Multi-user Mock database configuration representing the Supabase PostgreSQL structure
interface MockDB {
  users: Array<{ id: string; email: string; passwordHash: string; username: string }>;
  profiles: Array<{
    id: string;
    username: string;
    display_name: string;
    bio: string;
    avatar_url: string;
    theme: {
      primaryColor: string;
      backgroundColor: string;
      cardStyle: string;
      textColor: string;
    };
    nfc_data: {
      serialNumber: string | null;
      activationStatus: 'pending' | 'activated' | 'deactivated';
    };
    created_at: string;
  }>;
  links: Array<{
    id: string;
    user_id: string;
    title: string;
    url: string;
    icon: string;
    order_index: number;
    is_active: boolean;
    created_at: string;
  }>;
}

// Default Seed Data
const defaultDB: MockDB = {
  users: [
    { id: "demo-user-id", email: "demo@chipng.co", passwordHash: "demo123", username: "vickthor" }
  ],
  profiles: [
    {
      id: "demo-user-id",
      username: "vickthor",
      display_name: "Victor Dennis",
      bio: "Founder of ChipNG • Designer & NFC Evangelist. Tap your phone to connect instantly.",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      theme: {
        primaryColor: "#d4af37", // elegant Gold
        backgroundColor: "#09090b", // deep zinc black
        cardStyle: "gold-foil",
        textColor: "#ffffff"
      },
      nfc_data: {
        serialNumber: "NFC-8821-X9R",
        activationStatus: "activated"
      },
      created_at: new Date().toISOString()
    }
  ],
  links: [
    {
      id: "link-1",
      user_id: "demo-user-id",
      title: "Portfolio website",
      url: "https://vickthor.design",
      icon: "globe",
      order_index: 0,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: "link-2",
      user_id: "demo-user-id",
      title: "Follow on Twitter",
      url: "https://twitter.com/vickthor",
      icon: "twitter",
      order_index: 1,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: "link-3",
      user_id: "demo-user-id",
      title: "Connect on LinkedIn",
      url: "https://linkedin.com/in/vickthor",
      icon: "linkedin",
      order_index: 2,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: "link-4",
      user_id: "demo-user-id",
      title: "GitHub Repositories",
      url: "https://github.com/vickthor",
      icon: "github",
      order_index: 3,
      is_active: true,
      created_at: new Date().toISOString()
    }
  ]
};

// Database helper functions
function readDB(): MockDB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading database file, using fallback.", err);
  }
  return defaultDB;
}

function writeDB(data: MockDB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file", err);
  }
}

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  writeDB(defaultDB);
}

// API Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "active", database: "local_mock_sqlite" });
});

// Authentication Routes
app.post("/api/auth/register", (req, res) => {
  const { email, password, username, display_name } = req.body;
  if (!email || !password || !username) {
    return res.status(400).json({ error: "Missing required registration parameters." });
  }

  const db = readDB();
  const emailExists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  const usernameExists = db.profiles.some(p => p.username.toLowerCase() === username.toLowerCase());

  if (emailExists) {
    return res.status(400).json({ error: "Email is already registered." });
  }
  if (usernameExists) {
    return res.status(400).json({ error: "Username is already taken." });
  }

  const userId = "user-" + Math.random().toString(36).substring(2, 11);
  const user = { id: userId, email, passwordHash: password, username };
  
  const profile = {
    id: userId,
    username: username.toLowerCase().trim(),
    display_name: display_name || username,
    bio: "Tap your NFC card or click below to connect with me.",
    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
    theme: {
      primaryColor: "#6366f1",
      backgroundColor: "#0f172a",
      cardStyle: "glassmorphism",
      textColor: "#ffffff"
    },
    nfc_data: {
      serialNumber: null,
      activationStatus: "pending" as const
    },
    created_at: new Date().toISOString()
  };

  db.users.push(user);
  db.profiles.push(profile);
  writeDB(db);

  res.status(201).json({
    user: { id: userId, email, username },
    token: `mock-jwt-token-${userId}`
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password);

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  res.json({
    user: { id: user.id, email: user.email, username: user.username },
    token: `mock-jwt-token-${user.id}`
  });
});

// Profile & Username utilities
app.get("/api/profile/check-username", (req, res) => {
  const { username } = req.query;
  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "Username query param is required." });
  }

  const db = readDB();
  const taken = db.profiles.some(p => p.username.toLowerCase() === username.toLowerCase().trim());
  res.json({ available: !taken });
});

// Protected Profile Operations
// Using simple Authorization header: Bearer mock-jwt-token-[userId]
function getAuthUserId(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer mock-jwt-token-")) {
    return authHeader.replace("Bearer mock-jwt-token-", "");
  }
  return null;
}

app.get("/api/profile", (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized access: login required." });
  }

  const db = readDB();
  const profile = db.profiles.find(p => p.id === userId);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found." });
  }

  res.json(profile);
});

app.put("/api/profile", (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized access." });
  }

  const { display_name, bio, avatar_url, theme, nfc_data, username } = req.body;
  const db = readDB();
  const profileIndex = db.profiles.findIndex(p => p.id === userId);

  if (profileIndex === -1) {
    return res.status(404).json({ error: "Profile not found." });
  }

  const oldProfile = db.profiles[profileIndex];

  // If changing username, make sure it's unique
  if (username && username.toLowerCase().trim() !== oldProfile.username) {
    const cleanUsername = username.toLowerCase().trim();
    const usernameTaken = db.profiles.some(p => p.id !== userId && p.username === cleanUsername);
    if (usernameTaken) {
      return res.status(400).json({ error: "Username is already registered by another account." });
    }
    oldProfile.username = cleanUsername;
    
    // Also update in users table
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.username = cleanUsername;
    }
  }

  if (display_name !== undefined) oldProfile.display_name = display_name;
  if (bio !== undefined) oldProfile.bio = bio;
  if (avatar_url !== undefined) oldProfile.avatar_url = avatar_url;
  if (theme !== undefined) oldProfile.theme = { ...oldProfile.theme, ...theme };
  if (nfc_data !== undefined) oldProfile.nfc_data = { ...oldProfile.nfc_data, ...nfc_data };

  writeDB(db);
  res.json(oldProfile);
});

// Public profile retrieval
app.get("/api/profile/public/:username", (req, res) => {
  const { username } = req.params;
  const db = readDB();
  const profile = db.profiles.find(p => p.username.toLowerCase() === username.toLowerCase().trim());

  if (!profile) {
    return res.status(404).json({ error: "Profile not found." });
  }

  // Only return active links
  const links = db.links
    .filter(l => l.user_id === profile.id && l.is_active)
    .sort((a, b) => a.order_index - b.order_index);

  res.json({ profile, links });
});

// Links API Operations
app.get("/api/links", (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized access: login required." });
  }

  const db = readDB();
  const links = db.links
    .filter(l => l.user_id === userId)
    .sort((a, b) => a.order_index - b.order_index);

  res.json(links);
});

app.post("/api/links", (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized access." });
  }

  const { title, url, icon, is_active } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: "Title and URL are required." });
  }

  const db = readDB();
  const userLinks = db.links.filter(l => l.user_id === userId);
  const nextOrderIdx = userLinks.length > 0 ? Math.max(...userLinks.map(l => l.order_index)) + 1 : 0;

  const newLink = {
    id: "link-" + Math.random().toString(36).substring(2, 11),
    user_id: userId,
    title,
    url,
    icon: icon || "link",
    order_index: nextOrderIdx,
    is_active: is_active !== undefined ? is_active : true,
    created_at: new Date().toISOString()
  };

  db.links.push(newLink);
  writeDB(db);

  res.status(201).json(newLink);
});

app.put("/api/links/:id", (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized access." });
  }

  const { id } = req.params;
  const { title, url, icon, order_index, is_active } = req.body;

  const db = readDB();
  const link = db.links.find(l => l.id === id && l.user_id === userId);

  if (!link) {
    return res.status(404).json({ error: "Link not found or unauthorized editing access." });
  }

  if (title !== undefined) link.title = title;
  if (url !== undefined) link.url = url;
  if (icon !== undefined) link.icon = icon;
  if (order_index !== undefined) link.order_index = order_index;
  if (is_active !== undefined) link.is_active = is_active;

  // If order_index was changed, help client check arrays
  writeDB(db);
  res.json(link);
});

app.post("/api/links/reorder", (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized access." });
  }

  const { linkIds } = req.body; // array of IDs ordered
  if (!Array.isArray(linkIds)) {
    return res.status(400).json({ error: "linkIds must be an array of link IDs." });
  }

  const db = readDB();
  linkIds.forEach((id, index) => {
    const link = db.links.find(l => l.id === id && l.user_id === userId);
    if (link) {
      link.order_index = index;
    }
  });

  writeDB(db);
  res.json({ success: true, message: "Links reordered successfully." });
});

app.delete("/api/links/:id", (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized access." });
  }

  const { id } = req.params;
  const db = readDB();
  const linkIndex = db.links.findIndex(l => l.id === id && l.user_id === userId);

  if (linkIndex === -1) {
    return res.status(404).json({ error: "Link not found or unauthorized deletion access." });
  }

  db.links.splice(linkIndex, 1);
  writeDB(db);

  res.json({ success: true, message: "Link deleted successfully." });
});


// Vite Dev Server / Static Production Server Mounting
async function init() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite dev server in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted successfully.");
  } else {
    // Serve build static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving build production index.html files.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ChipNG SaaS full-stack container running perfectly on http://localhost:${PORT}`);
  });
}

init();
