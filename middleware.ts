import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
 
export async function middleware(request: NextRequest) {
	try {
		console.log(`Middleware checking session for: ${request.nextUrl.pathname}`);
		const session = await auth.api.getSession({
			headers: await headers()
		});

		if (!session) {
			console.log("No session found, redirecting to /login");
			return NextResponse.redirect(new URL("/login", request.url));
		}
		console.log(`Session verified for user: ${session.user.email}`);

	// Check if accessing admin routes
	if (request.nextUrl.pathname.startsWith("/admin")) {
		// @ts-ignore - userType exists on session.user
		if (session.user?.userType !== "admin") {
			return NextResponse.redirect(new URL("/dashboard", request.url));
		}
	}
 
		return NextResponse.next();
	} catch (error) {
		console.error("Middleware session check error (ignoring to avoid loop):", error);
		// If the database is timing out, don't kick the user out. 
		// Let the page handle the session state or try again.
		return NextResponse.next();
	}
}
 
export const config = {
  runtime: "nodejs",
  matcher: ["/dashboard", "/dashboard/:path*", "/admin", "/admin/:path*", "/profile", "/analytics", "/campaigns"], // Apply middleware to specific routes
};