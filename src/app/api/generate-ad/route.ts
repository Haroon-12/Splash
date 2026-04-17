import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/lib/auth";
import Replicate from "replicate";

// Initialize Gemini for Text Generation
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy_key_for_setup" });

// Initialize Replicate for Image Generation
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { prompt, base64Image, campaign, style, platform, description } = body;

        console.log("Generating Ad with:", { campaign, style, platform });

        // Build the prompt for the generative image model
        const imagePrompt = prompt || description || "A stunning, highly detailed product advertisement.";
        const fullPrompt = `${imagePrompt}, style: ${style || 'modern'}, best quality, 8k, photorealistic`;

        // ==========================================
        // 1. TEXT PIPELINE (Google Gemini)
        // ==========================================
        const systemInstruction = `
        You are an expert, high-level marketing copywriter. We are creating an ad for the platform '${platform || "general social media"}'.
        The campaign is: '${campaign || "Product Promo"}'.
        The style is: '${style || "Modern"}'.
        
        Generate the following EXACTLY in JSON format without any other text or markdown block wrapping it:
        {
          "taglines": ["tagline 1", "tagline 2", "tagline 3"],
          "caption": "A highly engaging, professional caption for the social media post.",
          "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
        }
        `;

        let textData = {
            taglines: ["Stunning Quality.", "Elevate Your Aesthetic.", "The Future is Now."],
            caption: "Discover our newest collection. Designed for the modern era, built to last. Check out the link in bio! ✨",
            hashtags: ["#innovate", "#style", "#product", "#launch", "#viral"]
        };

        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: imagePrompt,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.7,
                    responseMimeType: "application/json",
                }
            });

            if (response.text) {
                textData = JSON.parse(response.text);
            }
        } catch (textErr) {
            console.error("Gemini copy generation failed, falling back to default.", textErr);
        }

        // ==========================================
        // 2. IMAGE PIPELINE (FLUX via Replicate)
        // ==========================================
        let imageUrl = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=800&fit=crop";

        if (process.env.REPLICATE_API_TOKEN) {
            try {
                // If there's a base64 image, we use an image-to-image model or img2img parameters.
                // Replicate's FLUX models typically take an input image directly if supported.
                // We'll use flux-dev as the standard high-quality generator.
                console.log("Calling Replicate API...");

                const inputParams: any = {
                    prompt: fullPrompt,
                    aspect_ratio: "1:1",
                    output_format: "png",
                    output_quality: 100
                };

                // Inject the base64 image if it exists into the input model structure
                if (base64Image) {
                    inputParams.image = base64Image;
                    inputParams.prompt_upsampling = true;
                    // prompt_strength controls how much the original image is modified (0.0 to 1.0)
                    // High strength = more modification based on prompt, less preserving of original image
                    inputParams.prompt_strength = 0.85;
                }

                const output: any = await replicate.run(
                    "black-forest-labs/flux-dev", // Or flux-schnell for speed
                    { input: inputParams }
                );

                console.log("Replicate Output:", output);

                // Replicate usually returns an array of URLs or a single URL for image models
                if (Array.isArray(output) && output.length > 0) {
                    const firstOutput = output[0];
                    if (typeof firstOutput === 'string') {
                        imageUrl = firstOutput;
                    } else if (firstOutput && typeof firstOutput.url === 'function') {
                        // Handle Replicate SDK 1.0.0+ FileOutput streams naturally
                        imageUrl = firstOutput.url().href;
                    } else if (firstOutput && typeof firstOutput.url === 'string') {
                        imageUrl = firstOutput.url;
                    } else {
                        // Fallback handling if it is a raw ReadableStream without a .url method
                        const chunks = [];
                        for await (const chunk of firstOutput as any) {
                            chunks.push(chunk);
                        }
                        const buffer = Buffer.concat(chunks);
                        imageUrl = `data:image/png;base64,${buffer.toString("base64")}`;
                    }
                } else if (typeof output === 'string') {
                    imageUrl = output;
                }

            } catch (err) {
                console.error("Failed to generate image from Replicate API", err);
            }
        } else {
            console.log("No REPLICATE_API_TOKEN found, using placeholder image.");
        }

        return NextResponse.json({
            imageUrl,
            taglines: textData.taglines,
            caption: textData.caption,
            hashtags: textData.hashtags
        });

    } catch (error) {
        console.error("Error generating ad:", error);
        return NextResponse.json({ error: "Failed to generate AI Ad" }, { status: 500 });
    }
}
