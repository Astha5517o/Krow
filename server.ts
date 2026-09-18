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
   - Assign appropriate category from: "मसाले", "खाद्य तेल व घी", "दाल व अनाज", "दूध व डेयरी", "बिस्कुट व नमकीन", "साबुन व डिटर्जेंट", "जनरल सामान".

5. CONFIDENCE METRICS:
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
      "unit": "unit e.g. किलो, 10kg बोरी, 500g पैकेट, टिन, पैकेट, etc.",
      "rate": 100,
      "total": 100,
      "category": "One of: मसाले, खाद्य तेल व घी, दाल व अनाज, दूध व डेयरी, बिस्कुट व नमकीन, साबुन व डिटर्जेंट, जनरल सामान",
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
