import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert sports medicine doctor analyzing blood test results.
Extract the following biomarkers from the document. Use EXACTLY these Turkish names:
- Testosteron (unit: ng/dL, ref: 300-1000)
- Kortizol (unit: µg/dL, ref: 6-23)
- TSH (unit: mIU/L, ref: 0.4-4.0)
- Vitamin D (unit: ng/mL, ref: 30-100)
- Vitamin B12 (unit: pg/mL, ref: 200-900)
- Ferritin (unit: ng/mL, ref: 30-400)
- Hemoglobin (unit: g/dL, ref: 13.5-17.5)
- CRP (unit: mg/L, ref: 0-3)
- Kreatin Kinaz (CK) (unit: U/L, ref: 30-200)
- Kreatinin (unit: mg/dL, ref: 0.7-1.3)
- AST (unit: U/L, ref: 10-40)
- ALT (unit: U/L, ref: 7-56)
- Magnezyum (unit: mg/dL, ref: 1.7-2.2)

For each found biomarker return an object with:
- name: string (exactly as listed above)
- value: number
- unit: string
- ref: string (reference range like "30-100")
- status: "low" | "normal" | "high" (based on reference range)

If a biomarker is not found in the document, omit it.
Return ONLY a valid JSON array. No markdown, no explanation.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication check ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate the JWT and get the user
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser();
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.user.id;

    const { fileUrl, fileName } = await req.json();
    if (!fileUrl) {
      return new Response(JSON.stringify({ error: "fileUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Verify the caller owns the file (folder prefix matches user ID) ---
    if (!fileUrl.startsWith(`${userId}/`)) {
      return new Response(JSON.stringify({ error: "Forbidden: you can only analyze your own files" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Download file from storage using service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("blood-test-pdfs")
      .download(fileUrl);

    if (downloadError || !fileData) {
      console.error("Storage download error:", downloadError);
      return new Response(JSON.stringify({ error: "Failed to download file from storage" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);

    // Determine MIME type
    const ext = (fileName || fileUrl).split(".").pop()?.toLowerCase() || "";
    let mimeType = "application/pdf";
    if (["jpg", "jpeg"].includes(ext)) mimeType = "image/jpeg";
    else if (ext === "png") mimeType = "image/png";
    else if (ext === "webp") mimeType = "image/webp";

    // Call Lovable AI Gateway with multimodal content
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              {
                type: "text",
                text: "Bu kan tahlili belgesindeki biyobelirteçleri çıkar ve JSON dizisi olarak döndür.",
              },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const body = await aiResponse.text();
      console.error(`AI Gateway error [${status}]:`, body);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "rate_limit", message: "AI rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "credits_exhausted", message: "AI credits exhausted. Please top up your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "ai_error", message: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (strip markdown fences if present)
    let jsonStr = rawContent.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let biomarkers: any[];
    try {
      biomarkers = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response as JSON:", rawContent);
      return new Response(JSON.stringify({ error: "parse_error", message: "AI response was not valid JSON" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate and filter
    const validStatuses = ["low", "normal", "high"];
    const validated = (Array.isArray(biomarkers) ? biomarkers : []).filter(
      (b: any) =>
        typeof b.name === "string" &&
        typeof b.value === "number" &&
        typeof b.unit === "string" &&
        typeof b.ref === "string" &&
        validStatuses.includes(b.status)
    );

    return new Response(JSON.stringify({ biomarkers: validated }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-bloodwork error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
