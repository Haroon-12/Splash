import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
 
export async function middleware(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: await headers()
	})
 
	if(!session) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// Check if accessing admin routes
	if (request.nextUrl.pathname.startsWith("/admin")) {
		// @ts-ignore - userType exists on session.user
		if (session.user?.userType !== "admin") {
			return NextResponse.redirect(new URL("/dashboard", request.url));
		}
	}
 
	return NextResponse.next();
}
 
export const config = {
  runtime: "nodejs",
  matcher: ["/dashboard", "/dashboard/:path*", "/admin", "/admin/:path*", "/profile", "/analytics", "/campaigns"], // Apply middleware to specific routes
};