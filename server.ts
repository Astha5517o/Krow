import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Resolve safe database directory (fallback to /tmp if cwd is read-only in serverless/container deployment)
let DATA_DIR = process.env.VERCEL ? path.join("/tmp", "krow_data") : path.join(process.cwd(), "data");
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch {
  DATA_DIR = path.join("/tmp", "krow_data");
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn("Could not create /tmp/krow_data directory:", e);
    }
  }
}
const DB_FILE = path.join(DATA_DIR, "shops.json");

// Database helper
interface ShopRecord {
  id: string;
  identifier: string; // phone or email (normalized)
  password: string;
  shopName: string;
  shopType: "general_store" | "stationery";
  language: "hi" | "pa" | "en";
  onboarded: boolean;
  items: any[];
  customers: any[];
  sales: any[];
  nightCounts: any[];
  createdAt: string;
  updatedAt: string;
}

function getDatabase(): Record<string, ShopRecord> {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database:", err);
    return {};
  }
}

function saveDatabase(db: Record<string, ShopRecord>) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database:", err);
  }
}

// Gemini AI client initialization
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const key = process.env.GEMINI_API_KEY;
    genAIClient = new GoogleGenAI({
      apiKey: key || "dummy_key",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

const app = express();

// CORS support for all deployed origins, previews, and iframes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Middleware
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Health check
app.get(["/api/health", "/health"], (_req, res) => {
  res.json({ status: "ok", service: "Krow Kirana Backend", time: new Date().toISOString() });
});

  // Auth: Signup
  app.post(["/api/auth/signup", "/auth/signup", "/api/auth/signup/", "/auth/signup/"], (req, res) => {
    try {
      const { identifier, password, shopName, shopType, language } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({ error: "Email or phone number and password are required" });
      }

      const cleanId = String(identifier).trim().toLowerCase();
      const db = getDatabase();

      // Check if user already exists
      const existingKey = Object.keys(db).find((k) => db[k].identifier === cleanId);
      if (existingKey) {
        return res.status(409).json({ error: "An account with this email or phone number already exists." });
      }

      const newShopId = "shop_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
      const newShop: ShopRecord = {
        id: newShopId,
        identifier: cleanId,
        password: String(password),
        shopName: shopName || "Meri Dukan",
        shopType: shopType || "general_store",
        language: language || "hi",
        onboarded: false,
        items: [],
        customers: [],
        sales: [],
        nightCounts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db[newShopId] = newShop;
      saveDatabase(db);

      // Return token & shop profile (hide password)
      const { password: _, ...safeShop } = newShop;
      return res.json({ token: newShopId, shop: safeShop });
    } catch (err: any) {
      console.error("Signup error:", err);
      return res.status(500).json({ error: "Server error during registration" });
    }
  });

  // Auth: Login
  app.post(["/api/auth/login", "/api/auth/login/"], (req, res) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({ error: "Email/phone and password are required" });
      }

      const cleanId = String(identifier).trim().toLowerCase();
      const db = getDatabase();

      const shopKey = Object.keys(db).find(
        (k) => db[k].identifier === cleanId && db[k].password === String(password)
      );

      if (!shopKey) {
        return res.status(401).json({ error: "Incorrect email/phone number or password." });
      }

      const shop = db[shopKey];
      const { password: _, ...safeShop } = shop;
      return res.json({ token: shop.id, shop: safeShop });
    } catch (err: any) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Server error during login" });
    }
  });

  // Auth: Forgot Password
  app.post(["/api/auth/forgot-password", "/api/auth/forgot-password/"], (req, res) => {
    try {
      const { identifier } = req.body;
      if (!identifier) {
        return res.status(400).json({ error: "Phone number or email is required." });
      }
      const cleanId = String(identifier).trim().toLowerCase();
      const db = getDatabase();
      const found = Object.values(db).find((s) => s.identifier === cleanId);

      // In production/kirana context, generate a simple 4-digit OTP for instant reset
      return res.json({
        success: true,
        message: found
          ? "Reset code sent! For this demo verification, use OTP: 5544"
          : "Account located. For demo verification, use OTP: 5544",
        demoCode: "5544",
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to process forgot password" });
    }
  });

  // Auth: Reset Password
  app.post(["/api/auth/reset-password", "/api/auth/reset-password/"], (req, res) => {
    try {
      const { identifier, code, newPassword } = req.body;
      if (!identifier || !newPassword) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      if (code !== "5544") {
        return res.status(400).json({ error: "Invalid OTP verification code. Please enter 5544." });
      }

      const cleanId = String(identifier).trim().toLowerCase();
      const db = getDatabase();
      const shopKey = Object.keys(db).find((k) => db[k].identifier === cleanId);

      if (!shopKey) {
        return res.status(404).json({ error: "Account not found." });
      }

      db[shopKey].password = String(newPassword);
      db[shopKey].updatedAt = new Date().toISOString();
      saveDatabase(db);

      return res.json({ success: true, message: "Password successfully updated! You can now log in." });
    } catch (err) {
      return res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Shop Data: Get
  app.get(["/api/shop/data", "/api/shop/data/"], (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "") || (req.query.token as string);

      if (!token) {
        return res.status(401).json({ error: "Unauthorized: Missing authentication token" });
      }

      const db = getDatabase();
      const shop = db[token];
      if (!shop) {
        return res.status(404).json({ error: "Shop account not found" });
      }

      const { password: _, ...safeShop } = shop;
      return res.json({ shop: safeShop });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch shop data" });
    }
  });

  // Shop Data: Sync/Save
  app.post(["/api/shop/sync", "/shop/sync", "/api/shop/sync/", "/shop/sync/"], (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "") || (req.body.token as string);

      if (!token) {
        return res.status(401).json({ error: "Unauthorized: Missing authentication token" });
      }

      const db = getDatabase();
      if (!db[token]) {
        // If it was created on client or session, initialize
        db[token] = {
          id: token,
          identifier: req.body.identifier || "shopkeeper",
          password: "saved",
          shopName: req.body.shopName || "Meri Dukan",
          shopType: req.body.shopType || "general_store",
          language: req.body.language || "hi",
          onboarded: Boolean(req.body.onboarded),
          items: req.body.items || [],
          customers: req.body.customers || [],
          sales: req.body.sales || [],
          nightCounts: req.body.nightCounts || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Update existing
        const prev = db[token];
        db[token] = {
          ...prev,
          shopName: req.body.shopName !== undefined ? req.body.shopName : prev.shopName,
          shopType: req.body.shopType !== undefined ? req.body.shopType : prev.shopType,
          language: req.body.language !== undefined ? req.body.language : prev.language,
          onboarded: req.body.onboarded !== undefined ? req.body.onboarded : prev.onboarded,
          items: req.body.items !== undefined ? req.body.items : prev.items,
          customers: req.body.customers !== undefined ? req.body.customers : prev.customers,
          sales: req.body.sales !== undefined ? req.body.sales : prev.sales,
          nightCounts: req.body.nightCounts !== undefined ? req.body.nightCounts : prev.nightCounts,
          updatedAt: new Date().toISOString(),
        };
      }

      saveDatabase(db);
      return res.json({ success: true, updatedAt: db[token].updatedAt });
    } catch (err) {
      console.error("Sync error:", err);
      return res.status(500).json({ error: "Failed to sync shop data" });
    }
  });

  // AI-Powered Bill Scanning with Gemini (with multi-model automatic resilience)
  app.post(["/api/scan-bill", "/scan-bill", "/api/scan-bill/", "/scan-bill/"], async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg", shopType = "general_store", language = "hi" } = req.body;

      if (!imageBase64 || typeof imageBase64 !== "string") {
        return res.status(400).json({ error: "Image data is required" });
      }

      // Check Gemini API key
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured on the server. Please check your environment variables.",
        });
      }

      // Clean base64 data and safely detect mime type
      let cleanBase64 = String(imageBase64).trim();
      let detectedMime = mimeType || "image/jpeg";

      const dataUrlMatch = cleanBase64.match(/^data:([a-zA-Z0-9/+-]+)(?:;[a-zA-Z0-9=-]+)*;base64,(.+)$/s);
      if (dataUrlMatch) {
        detectedMime = dataUrlMatch[1];
        cleanBase64 = dataUrlMatch[2];
      } else if (cleanBase64.includes(";base64,")) {
        const parts = cleanBase64.split(";base64,");
        cleanBase64 = parts[1];
        const prefixMatch = parts[0].match(/data:([a-zA-Z0-9/+-]+)/);
        if (prefixMatch) detectedMime = prefixMatch[1];
      }
      // Remove any internal spaces or newlines that can corrupt base64 decoding
      cleanBase64 = cleanBase64.replace(/\s+/g, "");

      if (!cleanBase64 || cleanBase64.length < 50) {
        return res.status(400).json({ error: "Invalid or empty image data received." });
      }

      const ai = getGenAI();

      const systemInstruction = `
You are an expert Indian retail invoice, wholesaler bill, and handwritten parchi analyzer designed for small Indian family-run kirana (general stores) and stationery/uniform shops.

Your job is to read images of invoices, wholesale slips, and handwritten parchis (which are often handwritten in messy pen or pencil on lined paper, in Hindi, Punjabi, Hinglish, or English) and extract the list of purchased inventory stock items.

CRITICAL EXTRACTION RULES:
1. Extract ONLY actual inventory items/products that the shopkeeper purchased for resale in their shop.
2. STRICTLY IGNORE AND SKIP ALL non-inventory lines. NEVER include these as items:
   - "Total", "Grand Total", "Sub Total", "Net Amount", "Kul", "Yog", "कुल", "टोटल", "योग", "ਕੁੱਲ"
   - "Bags", "Kata", "Katta", "Bardana", "Pasti", "Bori", "Packing Charges", "बैग", "कट्टा", "बारदाना", "बोरी", "थैला"
   - "Hamali", "Coolie", "Mazdoori", "Labour Charges"
   - "Freight", "Bhada", "Tempo", "Transport", "Cartage"
   - "Discount", "Less", "Katori", "Round off"
   - "GST", "CGST", "SGST", "Tax"
   - "Balance Due", "Previous Balance", "Old Baaki", "Cash Paid"
3. CAREFULLY DISTINGUISH PURCHASE COUNT FROM WEIGHT/SIZE DESCRIPTION:
   - Each handwritten line is roughly: <quantity/weight><item name> — <total price for that line>. There is usually NO separate "unit price" written down — it must be calculated as total ÷ quantity.
   - Distinguish an actual purchase COUNT from a WEIGHT DESCRIPTION.
     * "4x10kg Atta — 1280" or "4 x 10kg Atta" means 4 units of 10kg atta, total ₹1280 (buy price ₹320/unit, name: "10kg Atta").
     * "500 Garam Masala — 130" means ONE packet that weighs 500g, costing ₹130 — NOT 500 units!
     * Only treat a number as a purchase count when it's an explicit multiplier ("4x", "12 x", "2 x") or a bare count with no unit glued to it.
     * A number glued or associated directly to a weight/volume unit (500g, 500, 5kg, 1L, 250g) describes the item/packet size, NOT how many were bought. For example:
       - "500 Garam Masala — 130" -> Name: "Garam Masala 500g", quantity: 1, packetSize: "500g", unit: "packet", buyPrice: 130, totalPrice: 130
       - "500 Haldi — 95" -> Name: "Haldi 500g", quantity: 1, packetSize: "500g", unit: "packet", buyPrice: 95, totalPrice: 95
       - "500 Lal Mirch — 145" -> Name: "Lal Mirch 500g", quantity: 1, packetSize: "500g", unit: "packet", buyPrice: 145, totalPrice: 145
       - "White Chana 2kg — 240" -> Name: "White Chana", quantity: 1, packetSize: "2kg", unit: "packet", buyPrice: 240, totalPrice: 240
       - "Toor Dal Peeled 3kg — 380" -> Name: "Toor Dal Peeled", quantity: 1, packetSize: "3kg", unit: "packet", buyPrice: 380, totalPrice: 380
       - "4 x 10kg Atta — 1280" -> Name: "10kg Atta", quantity: 4, packetSize: "10kg", unit: "bag", buyPrice: 320, totalPrice: 1280
4. Compute:
   - buyPrice = totalPrice / quantity (or unit rate if given)
   - suggestedSellPrice = markup of 10% to 20% typical of Indian retail margin
   - suggestedCategory based on the item:
     * "ration" for atta, rice, dal, chana, sugar, oil, ghee
     * "spices" for masala, haldi, mirch, jeera, dhaniya
     * "biscuits_snacks" for biscuits, chips, namkeen
     * "stationery" for notebook, copy, pen, pencil, eraser
     * "general_items" for other general kirana goods
5. UNCERTAINTY HANDLING FOR MESSY HANDWRITING:
   - Handwriting may be messy, faded, or smudged.
   - When a specific number (price, quantity) or item name is genuinely unreadable or ambiguous, set "isUncertain": true and specify "uncertainField" ("buyPrice", "quantity", or "name"). DO NOT invent or guess silently, because this affects real shopkeeper money.

Return strictly valid JSON:
{
  "vendorName": "Wholesale vendor name or store name from header if present",
  "invoiceNumber": "Bill/parchi number if visible, else null",
  "invoiceDate": "YYYY-MM-DD or null",
  "totalAmount": 2290,
  "items": [
    {
      "name": "10kg Atta",
      "quantity": 4,
      "unit": "bag",
      "buyPrice": 320,
      "totalPrice": 1280,
      "suggestedSellPrice": 350,
      "suggestedCategory": "ration",
      "packetSize": "10kg",
      "isUncertain": false,
      "uncertainField": null
    }
  ]
}
`;

      const promptText = `
Analyze this purchase bill / wholesale parchi photo.
Shop type: ${shopType}.
Language preference: ${language}.
Extract all inventory items into clean JSON format according to the rules. Strictly skip non-item lines like Total and Bags.
`;

      const imagePart = {
        inlineData: {
          mimeType: detectedMime,
          data: cleanBase64,
        },
      };

      // Fast, high-availability multimodal models with graceful fallback across versions
      const candidateModels = [
        "gemini-3.1-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-3.5-flash-lite",
        "gemini-flash-latest",
        "gemini-3.7-flash",
      ];
      let lastError: any = null;
      let parsedData: any = null;

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [imagePart, { text: promptText }],
            },
            config: {
              systemInstruction,
              responseMimeType: "application/json",
            },
          });

          const rawText = response.text || "{}";
          let cleaned = rawText.trim();
          if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
          }
          try {
            parsedData = JSON.parse(cleaned);
          } catch {
            const m = cleaned.match(/\{[\s\S]*\}/);
            if (m) {
              parsedData = JSON.parse(m[0]);
            }
          }

          if (parsedData && Array.isArray(parsedData.items) && parsedData.items.length > 0) {
            break; // Successfully got items!
          }
        } catch (mErr: any) {
          console.warn(`Scan model ${modelName} failed, trying next candidate:`, mErr?.message || mErr);
          lastError = mErr;
        }
      }

      // Check if valid items were extracted - NEVER return fake placeholder data
      if (!parsedData || !Array.isArray(parsedData.items) || parsedData.items.length === 0) {
        let cleanErrorMessage = "Could not extract items from the bill photo. Please ensure the handwriting and numbers are clearly visible, then try again.";
        const rawErrMsg = lastError?.message || "";
        if (rawErrMsg.includes("503") || rawErrMsg.includes("high demand") || rawErrMsg.includes("UNAVAILABLE")) {
          cleanErrorMessage = "AI vision service is experiencing brief high demand. Please try again in a moment.";
        } else if (rawErrMsg.includes("429") || rawErrMsg.includes("quota")) {
          cleanErrorMessage = "AI request limit reached. Please wait a moment and try again.";
        } else if (rawErrMsg.includes("API key")) {
          cleanErrorMessage = "Gemini API key is not configured. Please check server settings.";
        }

        console.warn("AI models could not extract items:", cleanErrorMessage);
        return res.status(422).json({
          success: false,
          error: cleanErrorMessage,
        });
      }

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error("Scan bill error:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to scan bill. Please ensure the photo is clear and try again.",
      });
    }
  });

// Export app for serverless platforms like Vercel
export default app;
export { app };

// Vite middleware for development vs static production serving (only when running standalone server)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Krow server running on http://0.0.0.0:${PORT}`);
  });
}

// Only launch standalone listener if not in serverless environment
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
