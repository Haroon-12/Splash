import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/db";
import { messages, conversations } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { decryptText, isEncrypted } from "@/lib/encryption";

// Allow usage of the free-tier Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy_key_for_setup" });

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { prompt, conversationId } = await req.json();
        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        let systemInstruction = "";

        // ==========================================
        // DUAL-MODE LOGIC: Global vs Context-Locked
        // ==========================================

        if (!conversationId) {
            // MODE 1: GLOBAL MODE (Outside a chat)
            systemInstruction = `
        You are 'Splash Assist', the official AI helper for the Splash Influencer Marketing platform.
        Your ONLY job is to help users navigate the platform and explain how features work.
        Answers must be concise.
        
        RULES:
        1. If the user asks you to summarize a message, read a chat, or write an email, DECLINE and tell them they must open a specific chat thread first. 
        2. You do not have access to any underlying data, stats, or conversations here.
        3. Do not make up answers about features that don't exist.
        
        Platform Features: Brands can browse influencers, invite them to Campaigns, and pay them securely. Influencers can manage offers in their dashboard.
      `;
        } else {
            // MODE 2: CONTEXT-LOCKED MODE (Inside a specific chat)
            // Fetch the conversation object so we can extract the participant IDs for the crypto key
            const [conversationData] = await db
                .select()
                .from(conversations)
                .where(eq(conversations.id, conversationId))
                .limit(1);

            if (!conversationData) {
                return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
            }

            // Fetch the encrypted messages
            const chatHistory = await db
                .select()
                .from(messages)
                .where(eq(messages.conversationId, conversationId))
                .orderBy(asc(messages.createdAt));

            if (chatHistory.length === 0) {
                return NextResponse.json({
                    response: "It looks like there are no messages in this conversation yet. Send a message first so I can help you with it!"
                });
            }

            // Loop through the history and decrypt the ciphertexts safely
            const unencryptedHistory = chatHistory.map(msg => {
                let readableContent = msg.content || '[Attachment]';
                if (msg.content && isEncrypted(msg.content)) {
                    readableContent = decryptText(
                        msg.content,
                        conversationId,
                        conversationData.participant1Id,
                        conversationData.participant2Id
                    );
                }

                return `${msg.senderId === session.user.id ? '(You)' : '(Them)'}: ${readableContent}`;
            });

            // Format the isolated chat history into a readable script for the AI
            const formattedHistory = unencryptedHistory.join('\n');

            systemInstruction = `
        You are 'Splash Assist', operating in Context-Locked mode inside a specific chat thread.
        
        CRITICAL RULES:
        1. YOU MUST ONLY USE THE CHAT HISTORY PROVIDED BELOW to answer the user's prompt. 
        2. If the user asks about something NOT in this chat history, decline and state you can only discuss this specific conversation.
        3. NEVER make up information, prices, or deliverables that aren't stated in the chat below.
        4. If asked to summarize, summarize ONLY the provided text.
        
        --- ISOLATED CHAT HISTORY (Do not share with anyone else) ---
        ${formattedHistory}
        -------------------------------------------------------------
      `;
        }

        // Ping the free model
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.2, // Low temp for factual responses
            }
        });

        return NextResponse.json({ response: response.text });
    } catch (error) {
        console.error("AI Assistant Error:", error);
        return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
    }
}
