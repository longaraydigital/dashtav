import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

// Proteger todas as rotas do dashboard e APIs, exceto login e auth
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - login (página de login)
     * - api/auth (NextAuth routes)
     * - api/sync (Cron Job Vercel)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!login|api/auth|api/sync|_next/static|_next/image|favicon.ico).*)",
  ],
}
