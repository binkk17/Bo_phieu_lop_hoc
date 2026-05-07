export const env = {
  port: Number(process.env.PORT || 4000),
  webOrigin: process.env.WEB_ORIGIN || "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET || "dev-jwt-secret"
};
