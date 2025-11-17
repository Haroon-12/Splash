import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { NextRequest } from 'next/server';
import { headers } from "next/headers"
import { db } from "@/db";
 
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
	emailAndPassword: {    
		enabled: true,
		requireEmailVerification: false,
	},
	user: {
		additionalFields: {
			userType: {
				type: "string",
				required: false,
			},
			isApproved: {
				type: "boolean",
				required: false,
			}
		}
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 60 * 60 * 24 * 7, // 7 days
		},
		cookieName: "better-auth.session_token",
		expiresIn: 60 * 60 * 24 * 7, // 7 days
	},
	plugins: []
});

// Session validation helper
export async function getCurrentUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user || null;
}