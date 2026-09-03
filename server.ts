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

      if (!imageBase64) {
        return res.status(400).json({ error: "Image data is required" });
      }

      // Check Gemini API key
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured on the server. Please check your environment variables.",
        });
      }

      const ai = getGenAI();

      // Clean base64 string if it contains prefix
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, "");

      const systemInstruction = `
You are an expert Indian retail invoice, wholesaler bill, and handwritten parchi analyzer designed for small Indian family-run kirana (general stores) and stationery/uniform shops.

Your job is to read images of invoices/bills (which may be handwritten, messy, stamp-marked, carbon-copied, in Hindi, Punjabi, Hinglish, or English) and accurately extract the list of purchased inventory stock items.

CRITICAL EXTRACTION RULES:
1. Extract ONLY actual inventory items/products that the shopkeeper purchased for resale.
2. STRICTLY IGNORE AND SKIP non-item lines, such as:
   - "Total", "Grand Total", "Sub Total", "Net Amount"
   - "Discount", "Less", "Katori", "Round off"
   - "Bardana", "Pasti", "Bags", "Kata", "Packing Charges"
   - "Hamali", "Coolie", "Mazdoori", "Labour Charges"
   - "Freight", "Bhada", "Tempo", "Transport", "Cartage"
   - "GST", "CGST", "SGST", "Tax"
   - "Balance Due", "Previous Balance", "Old Baaki", "Cash Paid"
3. CAREFULLY DISTINGUISH PURCHASED QUANTITY FROM WEIGHT/SIZE IN THE ITEM NAME:
   - "500g Garam Masala – ₹130" -> Name: "500g Garam Masala", quantity: 1, unit: "packet", totalPrice: 130
   - "Tata Salt 1kg x 5 = 125" -> Name: "Tata Salt 1kg", quantity: 5, unit: "packet", totalPrice: 125
   - "Fortune Oil 1L x 10 @ 140 = 1400" -> Name: "Fortune Oil 1L", quantity: 10, unit: "pouch", totalPrice: 1400
   - "Classmate 6 No. Copy x 12 @ 40 = 480" -> Name: "Classmate 6 No. Notebook", quantity: 12, unit: "piece", totalPrice: 480
   - "Vimal Pan Masala 2 laddi @ 190 = 380" -> Name: "Vimal Pan Masala", quantity: 2, unit: "laddi", totalPrice: 380
   - "Aashirvaad Atta 10kg x 3 = 1260" -> Name: "Aashirvaad Atta 10kg", quantity: 3, unit: "bag", totalPrice: 1260
4. Compute or verify:
   - buyPrice = totalPrice / quantity (or unit rate given on bill)
   - suggestedSellPrice = default 10% to 20% markup typical of Indian retail margin
   - suggestedCategory based on the item and shop type:
     * General store categories: "tobacco_cigarettes", "cold_drinks", "chips_namkeen", "biscuits_snacks", "bread_bakery", "milk_dairy", "ration", "spices", "cleaning_supplies", "cleaning_tools"
     * Stationery categories: "stationery", "uniforms", "shoes", "first_aid", "ice_cream", "general_items"
5. If the bill text is in Hindi/Punjabi, preserve the recognizable product name in either Latin (Hinglish/English) or native script so the shopkeeper can easily identify it.
`;

      const promptText = `
Analyze this purchase bill image carefully.
Shop type: ${shopType}.
Language preference: ${language}.
Extract all inventory items into the structured schema. Skip non-item expenses. Keep item names clear and include weight/volume in the name when specified on the bill.
`;

      const imagePart = {
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: cleanBase64,
        },
      };

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          vendorName: {
            type: Type.STRING,
            description: "Name of distributor, agency, or wholesaler if visible on bill header",
          },
          invoiceNumber: {
            type: Type.STRING,
            description: "Invoice or parchi number if visible",
          },
          invoiceDate: {
            type: Type.STRING,
            description: "Date of bill if visible (YYYY-MM-DD or readable string)",
          },
          totalAmount: {
            type: Type.NUMBER,
            description: "Stated grand total on bill",
          },
          items: {
            type: Type.ARRAY,
            description: "List of valid inventory products purchased",
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "Item name, including package size/weight (e.g. '500g Garam Masala', 'Tata Salt 1kg')",
                },
                quantity: {
                  type: Type.NUMBER,
                  description: "Number of units/packets purchased (not the grams/kg inside the package)",
                },
                unit: {
                  type: Type.STRING,
                  description: "Custom spoken unit (e.g. packet, piece, laddi, kg, box, pouch, bottle, carton)",
                },
                buyPrice: {
                  type: Type.NUMBER,
                  description: "Purchase cost per unit (totalPrice / quantity)",
                },
                totalPrice: {
                  type: Type.NUMBER,
                  description: "Total purchase amount for this line item",
                },
                suggestedSellPrice: {
                  type: Type.NUMBER,
                  description: "Suggested selling retail price (approx 10-20% margin)",
                },
                suggestedCategory: {
                  type: Type.STRING,
                  description: "Category matching shop type",
                },
                spoilQuickly: {
                  type: Type.BOOLEAN,
                  description: "True if perishable like milk/bread/dairy/fresh sweets",
                },
                exchangeableOnSpoil: {
                  type: Type.BOOLEAN,
                  description: "True if distributor usually exchanges spoiled packs (like bread)",
                },
              },
              required: ["name", "quantity", "unit", "buyPrice", "totalPrice"],
            },
          },
        },
        required: ["items"],
      };

      // Multi-model resilience: Try fast and available models
      const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-flash-latest"];
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
              responseSchema,
            },
          });

          const responseText = response.text || "{}";
          parsedData = JSON.parse(responseText);
          break; // Succeeded!
        } catch (mErr: any) {
          console.warn(`Scan model ${modelName} failed, trying fallback:`, mErr?.message || mErr);
          lastError = mErr;
        }
      }

      if (!parsedData) {
        throw lastError || new Error("Unable to analyze bill with available AI models. Please try again.");
      }

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error("Scan bill error:", err);
      return res.status(500).json({
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
