import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // API Route: Extract flyer items using Gemini 2.5 Flash Vision API
  app.post("/api/extract-flyer", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "GEMINI_API_KEY environment variable is required." });
      }

      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "No imageBase64 provided." });
      }

      const ai = new GoogleGenAI({ apiKey });

      // Clean base64 string
      const cleanBase64 = imageBase64.replace(/^data:(image|application)\/[a-zA-Z]+;base64,/, "");
      const actualMimeType = mimeType || "image/jpeg";

      const prompt = `You are an expert OCR flyer item extractor. Analyze this promotional flyer image carefully.
Extract the exact promotional items listed on the flyer into JSON format matching this schema:

{
  "catalogueTitle": "Exact Main Title from flyer (e.g. KASI WEEKEND SPECIALS!)",
  "subtitle": "Exact Subtitle or Banner tagline (e.g. 100% KASI FRESH! Meat, Poultry & Combo Deals)",
  "validityText": "Exact promotion validity text from flyer banner or footer (e.g. Promotion valid from 11 - 15 August 2026)",
  "items": [
    {
      "name": "Exact Product Name (e.g. Fresh Beef Chuck)",
      "description": "Brief description based on flyer details (e.g. A Grade Premium Quality)",
      "price": 89.90,
      "priceUnit": "Per kg or Per 4kg pack or Per 4kg box",
      "badge": "Badge text if present (e.g. COUNTER ONLY, BUY BULK & SAVE, SAVE R20)"
    }
  ]
}

CRITICAL RULES:
1. Extract ALL visible items with their EXACT price numbers (e.g., 89.90, 49.90, 199.90, 169.90, 189.90).
2. Do NOT invent or hallucinate items not present on the flyer image.
3. Return ONLY valid JSON, no markdown codeblock wrapper or extra commentary.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: actualMimeType,
                  data: cleanBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
      });

      const responseText = response.text ? response.text.trim() : "";
      const jsonText = responseText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "")
        .trim();

      const parsed = JSON.parse(jsonText);
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("Error extracting flyer with Gemini:", err);
      return res.status(500).json({ error: err.message || "Failed to extract flyer." });
    }
  });

  // Healthcheck endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
