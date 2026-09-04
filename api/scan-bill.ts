import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { imageBase64, mimeType = "image/jpeg", shopType = "general_store", language = "hi" } = req.body || {};

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "Image data is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
    }

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
    cleanBase64 = cleanBase64.replace(/\s+/g, "");

    if (!cleanBase64 || cleanBase64.length < 50) {
      return res.status(400).json({ error: "Invalid image data received" });
    }

    const ai = new GoogleGenAI({ apiKey });

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

    const promptText = `Analyze this purchase bill / wholesale parchi photo for shop type: ${shopType}, language: ${language}. Strictly skip non-item lines like Total and Bags. Return JSON.`;

    const candidateModels = [
      "gemini-3.1-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.5-flash-lite",
      "gemini-flash-latest",
      "gemini-3.7-flash",
    ];
    let parsedData: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              { inlineData: { mimeType: detectedMime, data: cleanBase64 } },
              { text: promptText },
            ],
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
          if (m) parsedData = JSON.parse(m[0]);
        }

        if (parsedData && Array.isArray(parsedData.items) && parsedData.items.length > 0) {
          break;
        }
      } catch (err: any) {
        console.warn(`Vercel model ${modelName} attempt failed:`, err);
        lastError = err;
      }
    }

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

      return res.status(422).json({
        success: false,
        error: cleanErrorMessage,
      });
    }

    return res.status(200).json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Vercel scan-bill error:", error);
    return res.status(500).json({ success: false, error: error?.message || "Failed to scan bill." });
  }
}
