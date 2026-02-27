import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) {
            throw new Error("LOVABLE_API_KEY is not configured");
        }

        const { imageBase64, cropType } = await req.json();

        if (!imageBase64) {
            return new Response(
                JSON.stringify({ error: "No image provided" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const systemPrompt = `You are an expert agricultural pathologist AI. Analyze the provided crop image for diseases, pests, or nutrient deficiencies.

Respond ONLY with valid JSON in this exact format:
{
  "disease": "Detected Disease Name",
  "confidence": 85,
  "severity": "Low|Medium|High",
  "symptoms": ["Symptom 1", "Symptom 2"],
  "treatment": "Treatment Recommendation",
  "prevention": "Prevention Tips"
}`;

        const response = await fetch(AI_GATEWAY_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash",
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: `Analyze this ${cropType || "crop"} image.` },
                            {
                                type: "image_url",
                                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
                            },
                        ],
                    },
                ],
            }),
        });

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        const result = JSON.parse(content.replace(/```json|```/g, "").trim());

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
