export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/api/profile/:path*", "/api/documents/:path*", "/api/optimize/:path*", "/api/applications/:path*", "/api/mock-interview/:path*", "/api/portfolio/:path*"],
};
