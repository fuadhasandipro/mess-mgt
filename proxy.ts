import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const isAuth = !!req.nextauth.token
    const isAuthPage = req.nextUrl.pathname.startsWith("/login")
    const isRootPage = req.nextUrl.pathname === "/"

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
      return null
    }

    if (!isAuth) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    if (isRootPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  },
  {
    callbacks: {
      authorized: () => true, // We handle authorization in the middleware function itself
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/meals/:path*",
    "/finance/:path*",
    "/profile/:path*",
    "/members/:path*",
    "/manager/:path*",
    "/activity-log/:path*",
    "/login",
    "/"
  ],
}
