import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing large photo payloads
  app.use(express.json({ limit: "25mb" }));

  // Health check API
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // AI & OpenFoodFacts Barcode Product Auto-Lookup Endpoint
  app.post("/api/lookup-barcode", async (req, res) => {
    try {
      const { barcode } = req.body;
      if (!barcode || typeof barcode !== "string") {
        return res.status(400).json({ success: false, error: "Invalid barcode" });
      }
      const cleanCode = barcode.trim();
      if (!cleanCode) {
        return res.status(400).json({ success: false, error: "Empty barcode" });
      }

      // 1. Try OpenFoodFacts API first with quick timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const offUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json`;
        const offResp = await fetch(offUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (offResp.ok) {
          const offData = await offResp.json();
          if (offData.status === 1 && offData.product && (offData.product.product_name || offData.product.product_name_en)) {
            const prod = offData.product;
            const nameEn = prod.product_name_en || prod.product_name || "Product " + cleanCode;
            const brand = prod.brands || "";
            const quantity = prod.quantity || "";
            const fullName = brand && !nameEn.toLowerCase().includes(brand.toLowerCase())
              ? `${brand} ${nameEn}`
              : nameEn;

            let sellPrice = 20;
            if (typeof prod.price === "number" && prod.price > 0) {
              sellPrice = Math.round(prod.price);
            }
            const buyPrice = Math.round(sellPrice * 0.85);

            let category = "पैकेज्ड फूड";
            const catStr = (prod.categories || "").toLowerCase();
            if (catStr.includes("biscuit") || catStr.includes("cookie") || catStr.includes("snack") || catStr.includes("crisp")) {
              category = "बिस्कुट व नमकीन";
            } else if (catStr.includes("beverage") || catStr.includes("drink") || catStr.includes("tea") || catStr.includes("coffee") || catStr.includes("juice")) {
              category = "चाय व पेय";
            } else if (catStr.includes("dairy") || catStr.includes("milk") || catStr.includes("cheese") || catStr.includes("butter") || catStr.includes("yogurt")) {
              category = "दूध व डेयरी";
            } else if (catStr.includes("oil") || catStr.includes("ghee") || catStr.includes("fat")) {
              category = "खाद्य तेल व घी";
            } else if (catStr.includes("spice") || catStr.includes("seasoning") || catStr.includes("salt") || catStr.includes("pepper")) {
              category = "मसाले";
            } else if (catStr.includes("cereal") || catStr.includes("grain") || catStr.includes("rice") || catStr.includes("flour") || catStr.includes("pulse")) {
              category = "दाल व अनाज";
            } else if (catStr.includes("soap") || catStr.includes("shampoo") || catStr.includes("hygiene") || catStr.includes("cosmetic") || catStr.includes("cream")) {
              category = "पर्सनल केयर";
            } else if (catStr.includes("clean") || catStr.includes("detergent") || catStr.includes("wash") || catStr.includes("dish")) {
              category = "साबुन व डिटर्जेंट";
            }

            return res.json({
              success: true,
              product: {
                barcode: cleanCode,
                name: fullName + (quantity ? ` (${quantity})` : ""),
                nameEn: fullName + (quantity ? ` (${quantity})` : ""),
                category,
                unit: "पैकेट",
                sellPrice,
                buyPrice,
                brand,
                source: "openfoodfacts",
              },
            });
          }
        }
      } catch {
        // OpenFoodFacts timed out or was unavailable; proceed to Gemini
      }

      // 2. Query Gemini for authoritative retail product identification
      const ai = getGeminiClient();
      const prompt = `Identify the FMCG/supermarket/packaged retail product with barcode number: "${cleanCode}".
Context: This barcode is scanned in an Indian retail Kirana, supermarket, or general store.
Return strictly a valid JSON object with no markdown formatting:
{
  "name": "Product name in Hindi (or English name transliterated to Hindi, e.g. पारले-जी बिस्कुट 100g, डिटॉल साबुन, लेज़ मैजिक मसाला)",
  "nameEn": "Product name in English (e.g. Parle-G Biscuit 100g, Dettol Soap, Lays Magic Masala)",
  "brand": "Brand name (e.g. Parle, Dettol, Nestlé, Britannia, Amul, ITC, HUL)",
  "category": "One of: बिस्कुट व नमकीन, दाल व अनाज, मसाले, खाद्य तेल व घी, चाय व पेय, दूध व डेयरी, पैकेज्ड फूड, पर्सनल केयर, साबुन व डिटर्जेंट, सफाई सामान, स्टेशनरी सामान, जनरल सामान",
  "unit": "Appropriate packaging unit: पैकेट, बोतल, पीस, टिन, जार, किलो",
  "sellPrice": typical standard retail MRP in INR (number, e.g. 10, 20, 35, 50, etc.),
  "buyPrice": estimated wholesale buy price in INR (number, ~85% of sellPrice)
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          temperature: 0.1,
        },
      });

      const text = response.text?.trim() || "";
      if (text) {
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch {
          // If wrapped in code block
          const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
          parsed = JSON.parse(clean);
        }
        if (parsed && (parsed.name || parsed.nameEn)) {
          const sellPrice = Number(parsed.sellPrice) || 20;
          const buyPrice = Number(parsed.buyPrice) || Math.round(sellPrice * 0.85);
          return res.json({
            success: true,
            product: {
              barcode: cleanCode,
              name: parsed.name || parsed.nameEn,
              nameEn: parsed.nameEn || parsed.name,
              brand: parsed.brand || "",
              category: parsed.category || "पैकेज्ड फूड",
              unit: parsed.unit || "पैकेट",
              sellPrice,
              buyPrice,
              source: "gemini",
            },
          });
        }
      }

      return res.json({ success: false, error: "Product not recognized" });
    } catch (err) {
      console.error("[Lookup Barcode Error]:", err);
      return res.json({ success: false, error: "Lookup failed" });
    }
  });

  // AI Bill Scanning Endpoint using Gemini
  app.post("/api/scan-bill", async (req, res) => {
    const reqStart = Date.now();
    try {
      const { imageBase64, mimeType = "image/jpeg" } = req.body;
      if (!imageBase64) {
        return res.status(400).json({
          success: false,
          error: "couldn't read this photo, try again or add manually",
        });
      }

      // Clean base64 if data URI prefix was passed
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
      console.log(`[ScanBill] Received request: mime=${mimeType}, length=${cleanBase64.length}`);

      const ai = getGeminiClient();

      const prompt = `You are an expert Indian retail shopkeeper's assistant analyzing an Indian wholesale / distributor purchase bill or handwritten slip/invoice (पर्चा / चालान / बिल).
Analyze the handwritten or printed bill carefully and extract all purchased stock inventory line items into structured JSON.

CRITICAL WORKED EXAMPLES & PARSING RULES:
1. DISTINGUISH COUNT FROM WEIGHT / PACK SIZE:
   - "4x10 kG Atta - 1280" or "4x10kg ATTA - 1280":
     This means 4 bags of 10kg Atta. Total ₹1280 (₹320 per bag).
     → name: "आटा (10kg)", quantity: 4, unit: "10kg बोरी", rate: 320, total: 1280, category: "दाल व अनाज"
   - "500 Garam Masala - 130" or "500 Haldi - 110" or "500 Lal Mirch - 130" or "500 Ajwain - 100":
     In Indian wholesale slips, numbers like 500, 250, 100 before spice/grocery items with small prices (₹50-₹200) mean GRAMS pack size, NOT 500 items!
     → quantity: 1, unit: "500g पैकेट", rate: 130, total: 130, category: "मसाले"
   - "5 kG White Chane - 420" or "5 kg Chhole":
     5 kilograms at total ₹420 (₹84 per kg).
     → name: "सफेद चना", quantity: 5, unit: "किलो", rate: 84, total: 420, category: "दाल व अनाज"
   - "1 Tin Refind - 2190" or "1 Tin Refined Oil":
     1 Tin container of Refined edible oil.
     → name: "रिफाइंड तेल (टिन)", quantity: 1, unit: "टिन", rate: 2190, total: 2190, category: "खाद्य तेल व घी"
   - "5 kG Maida - 170":
     5 kilograms of Maida at total ₹170 (₹34 per kg).
     → name: "मैदा", quantity: 5, unit: "किलो", rate: 34, total: 170, category: "दाल व अनाज"

2. NON-INVENTORY & SUMMARY LINES - NEVER ADD AS INVENTORY ITEMS:
   - Look at the bottom of bills for lines like:
     "Total - 4530" → This is the bill sum (billTotal: 4530). DO NOT include in items!
     "Bq - 1200" or "Baki - 1200" → "Bq" / "Baki" / "Baqi" means previous dues/arrears (previousBalanceBaqi: 1200). DO NOT include in items!
     "Total - 5730" → Grand total including previous dues (grandTotal: 5730). DO NOT include in items!
   - Skip all summary words: Total, Grand Total, Bq, Baki, Baqi, Subtotal, कुल, योग, Hamali, Coolie, Bardana, Freight, Delivery, Packing, GST, Round off.

3. VENDOR NAME & DATES:
   - Check top header or paper watermark (e.g. "Taufiq Shah Spices", "Gupta Traders") for vendorName. If not found, use empty string.
   - Extract billDate and billNumber if present.

4. ACCURATE CATEGORY FOR EACH ITEM:
   - Assign appropriate category from: "दाल व अनाज", "मसाले", "खाद्य तेल व घी", "चाय व पेय", "दूध व डेयरी", "बिस्कुट व नमकीन", "पैकेज्ड फूड", "पर्सनल केयर", "साबुन व डिटर्जेंट", "सफाई सामान", "जनरल सामान".

5. COMPREHENSIVE KARYANA MASTER INVENTORY REFERENCE & UNIT VOCABULARY:
   Use this exhaustive Indian Kirana store dictionary to decipher abbreviations, shorthand, and faint handwriting:
   - 🌾 Grains, Flours & Loose Staples ("दाल व अनाज"):
     * Atta (Wheat Flour): Ashirvaad / Fortune Branded Atta [1kg, 5kg, 10kg], Khulla Atta (खुला आटा) [per kg]
     * Maida [500g, 1kg], Besan (Rajdhani/Fortune) [500g, 1kg], Suji / Rava [500g], Rice Flour [500g], Makki Atta [1kg], Sattu [500g]
     * Rice (चावल): Basmati (Premium/Long Grain), Regular Parmal, Kolam / Sona Masoori, Tukda / Khichdi, Poha, Murmura, Sabudana
     * Pulses & Lentils (दाल): Toor / Arhar, Chana Dal, Moong (Dhuli, Chilka, Sabut), Masoor (Malkha, Sabut Kali), Urad (Dhuli, Chilka, Sabut Mah), Kabuli Chana (सफेद चना / छोले), Kala Chana, Rajma (Chitra, Jammu), Lobia, Matar (White/Green), Dalia
   - 🧂 Whole & Ground Spices ("मसाले"):
     * Whole Spices: Jeera (जीरा), Rai / Sarson, Saunf (सौंफ), Methi Dana, Sabut Dhania, Chhoti/Badi Elaichi, Laung, Dalchini, Tejpatta, Kali Mirch, Ajwain, Sabut Lal Mirch, Kasuri Methi, Jaiphal, Hing (MDH/Ramdev/Bandhani)
     * Ground Spices: Haldi (हल्दी), Lal Mirch, Dhania Powder, Deggi Mirch, Amchur, Black Salt (काला नमक), Sendha Namak
     * Blended Masalas: Garam Masala, Sabzi Masala, Chhole Masala, Pav Bhaji, Chaat, Sambhar, Kitchen King, Maggi Masala-e-Magic (₹5)
   - 🍳 Cooking Oils, Ghee & Bulk Seasoning ("खाद्य तेल व घी"):
     * Mustard Oil (सरसों तेल): Fortune, Engine, Dhara, P-Mark [1L pouch, 5L jar, 15L tin]
     * Refined Oil: Fortune, Saffola, Gemini [1L pouch, 5L jar], Dalda / Vanaspati Ghee
     * Desi Ghee: Amul, Mother Dairy, Patanjali [500ml, 1L]
     * Seasoning: Tata Salt (1kg), Sugar / Cheeni (1kg loose/bag), Gur / Jaggery, Shakkar, Baking Soda/Powder, Vinegar
   - ☕ Packaged Tea, Coffee & Beverages ("चाय व पेय"):
     * Tea: Tata Tea Premium/Gold/Agni, Red Label, Taj Mahal, Wagh Bakri, Loose Tea Leaves (खुली चाय पत्ती)
     * Coffee: Nescafe Classic [₹2, ₹10, 50g], BRU Instant; Bournvita, Horlicks, Boost, Glucon-D, Rooh Afza
     * Drinks: Sting Energy [₹20], Coca-Cola, Thums Up, Sprite, Frooti, Maaza, Bisleri / Water
   - 🥛 Dairy, Bread & Fresh Essentials ("दूध व डेयरी"):
     * Milk: Amul Taaza (Blue), Amul Gold (Red), Mother Dairy [500ml, 1L pouch]
     * Dahi [200g, 400g], Chaas / Buttermilk [₹10], Lassi, Amul Butter [100g, 500g], Paneer [200g/loose], Cheese, Bread, Rusk, Eggs
   - 🍫 Biscuits, Snacks & Impulse Buys ("बिस्कुट व नमकीन"):
     * Biscuits: Parle-G [₹5, ₹10], Marie Gold, Good Day, Monaco, 50-50, Bourbon, Hide & Seek, Oreo
     * Namkeen: Haldiram / Bikaji Aloo Bhujia, Sev, Moong Dal, Navrattan [₹5, ₹10, ₹50]
     * Chips: Lay's [₹5, ₹10, ₹20], Kurkure [₹5, ₹10, ₹20], Uncle Chipps, Tedhe Medhe
     * Candies/Chocolates: Dairy Milk [₹5, ₹10, ₹20], 5 Star, Munch, KitKat, Gems, Pulse Candy [₹1], Mango Bite, Center Fresh
   - 🥫 Instant & Packaged Convenience Foods ("पैकेज्ड फूड"):
     * Noodles & Pasta: Maggi 2-Minute Noodles [Single ₹14, 4-pack, ₹10], Yippee, Hakka Noodles, Macaroni, Seviyan (Bambino)
     * Ketchup (Kissan pouch ₹10, 500g), Jam, Corn Flakes, Oats, Lijjat Papad
   - 🧼 Personal Care & Sachet Grooming ("पर्सनल केयर"):
     * Bathing Soaps: Dettol, Lifebuoy, Lux, Dove, Santoor, Godrej No.1 [₹10, multi-packs]
     * Sachets: Clinic Plus [₹1, ₹2], Sunsilk [₹1, ₹2], Head & Shoulders [₹2, ₹3], Pantene
     * Hair Oil: Parachute [₹10, 100ml], Dabur Amla, Bajaj Almond Drops, Navratna Cool Oil
     * Oral: Colgate Strong Teeth [₹10, 100g], Close-Up, Toothbrushes; Fair & Lovely [₹10], Boroplus, Vaseline, Presto Razor [₹10/₹15], Whisper, Band-Aid, Vicks, Eno [₹10]
   - 🧽 Laundry & Cleaning ("साबुन व डिटर्जेंट" / "सफाई सामान"):
     * Detergent: Ghadi Powder [₹10, 500g, 1kg], Surf Excel, Tide Plus; Rin Bar [₹10, ₹20], Wheel Bar, Ujala [₹10]
     * Dishwashing: Vim Bar [₹5, ₹10, ₹20], Vim Liquid [₹10, 250ml], Exo Bar, Scotch-Brite, Steel Scrubber [₹5, ₹10]
     * Cleaning: Harpic Blue [200ml, 500ml], Lizol, Phenyl, All Out / Good Knight Refill, Baygon, Laxman Rekha, Matchboxes [₹1], Agarbatti, Kapoor, Batteries

6. CONFIDENCE METRICS:
   - If handwriting is slightly faint or ambiguous, set isUncertain: true and specify field confidence ("high" | "medium" | "low").

OUTPUT FORMAT:
Return a strictly valid JSON object with this exact shape:
{
  "vendorName": "Vendor or distributor name if visible, else empty string",
  "billDate": "DD/MM/YYYY or empty string",
  "billNumber": "bill number or empty string",
  "previousBalanceBaqi": 0,
  "billTotal": 0,
  "grandTotal": 0,
  "items": [
    {
      "name": "Item name in Hindi or English",
      "quantity": 1,
      "unit": "unit e.g. किलो, 10kg बोरी, 500g पैकेट, टिन, पैकेट, पीस, etc.",
      "rate": 100,
      "total": 100,
      "category": "One of: दाल व अनाज, मसाले, खाद्य तेल व घी, चाय व पेय, दूध व डेयरी, बिस्कुट व नमकीन, पैकेज्ड फूड, पर्सनल केयर, साबुन व डिटर्जेंट, सफाई सामान, जनरल सामान",
      "isUncertain": false,
      "nameConfidence": "high",
      "qtyConfidence": "high",
      "rateConfidence": "high"
    }
  ]
}
If no items are identifiable or the picture is empty, return { "items": [] }.`;

      // High-performance multimodal model cascade with minimal latency:
      // gemini-3.5-flash-lite provides sub-2-second vision extraction with high accuracy
      const modelsToTry: { name: string; thinkingLevel: ThinkingLevel }[] = [
        { name: "gemini-3.5-flash-lite", thinkingLevel: ThinkingLevel.MINIMAL },
        { name: "gemini-3.5-flash", thinkingLevel: ThinkingLevel.LOW },
        { name: "gemini-3.6-flash", thinkingLevel: ThinkingLevel.LOW },
      ];

      let responseText = "";
      let lastModelError: unknown = null;
      let parsed: any = null;

      for (const modelCfg of modelsToTry) {
        const tModel = Date.now();
        try {
          console.log(`[ScanBill] Querying ${modelCfg.name}...`);
          const response = await ai.models.generateContent({
            model: modelCfg.name,
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: cleanBase64,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            config: {
              responseMimeType: "application/json",
              thinkingConfig: { thinkingLevel: modelCfg.thinkingLevel },
              temperature: 0.1,
            },
          });

          responseText = response.text?.trim() || "";
          console.log(`[ScanBill] ${modelCfg.name} returned in ${Date.now() - tModel}ms (len: ${responseText.length})`);
          if (responseText) {
            try {
              let candidate = JSON.parse(responseText);
              if (Array.isArray(candidate) && candidate.length > 0) {
                candidate = candidate[0];
              }
              if (candidate && Array.isArray(candidate.items) && candidate.items.length > 0) {
                parsed = candidate;
                console.log(`[ScanBill] Successfully parsed ${candidate.items.length} items from ${modelCfg.name}`);
                break; // Found items successfully, return immediately!
              } else if (candidate) {
                parsed = candidate;
                break; // Clean response with 0 items, break loop
              }
            } catch (pErr) {
              console.warn(`[ScanBill] JSON parse failed on ${modelCfg.name}:`, pErr);
            }
          }
        } catch (modelErr) {
          lastModelError = modelErr;
          console.warn(`[ScanBill] ${modelCfg.name} failed (${Date.now() - tModel}ms):`, modelErr);
        }
      }

      // If initial pass returned 0 items, run one ultra-fast high-recall scan with gemini-3.5-flash-lite
      if (!parsed || !parsed.items || parsed.items.length === 0) {
        const retryPrompt = `Inspect this Indian wholesale slip / invoice (पर्चा / चालान) very carefully. Even if the handwriting is faint, tilted, or has informal shorthand (e.g. 'Atta', 'Chane', 'Refined', 'Masala', numbers with kg/g/tin/box), extract all stock purchase line items into JSON:
{
  "vendorName": "",
  "billDate": "",
  "billNumber": "",
  "previousBalanceBaqi": 0,
  "billTotal": 0,
  "grandTotal": 0,
  "items": [
    {
      "name": "Item Name",
      "quantity": 1,
      "unit": "पैकेट",
      "rate": 100,
      "total": 100,
      "category": "जनरल सामान",
      "isUncertain": false,
      "nameConfidence": "high",
      "qtyConfidence": "high",
      "rateConfidence": "high"
    }
  ]
}`;

        try {
          const retryResponse = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: cleanBase64,
                    },
                  },
                  {
                    text: retryPrompt,
                  },
                ],
              },
            ],
            config: {
              responseMimeType: "application/json",
              thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
              temperature: 0.1,
            },
          });

          const retryText = retryResponse.text?.trim() || "";
          if (retryText) {
            let retryParsed = JSON.parse(retryText);
            if (Array.isArray(retryParsed) && retryParsed.length > 0) {
              retryParsed = retryParsed[0];
            }
            if (retryParsed && retryParsed.items && retryParsed.items.length > 0) {
              parsed = retryParsed;
            }
          }
        } catch (rErr) {
          console.warn("[ScanBill] High-recall pass error:", rErr);
        }
      }

      if (!parsed || !parsed.items || parsed.items.length === 0) {
        return res.status(200).json({
          success: false,
          error: "couldn't read this photo, try again or add manually",
        });
      }

      return res.status(200).json({
        success: true,
        data: parsed,
      });
    } catch (err: unknown) {
      // Log technical details privately on server only, never show to client
      console.error("[Scan Bill Error Private Log]:", err);
      return res.status(200).json({
        success: false,
        error: "couldn't read this photo, try again or add manually",
      });
    }
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
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

startServer();
