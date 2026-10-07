import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth/constants";
import { db } from "@/lib/db/prisma";

// Better Auth reads two settings by itself:
//   BETTER_AUTH_SECRET  the key that signs login cookies
//   BETTER_AUTH_URL     the exact address of the site, for example https://yourdomain.com
//
// Extra addresses that may sign in (comma separated), optional.
const trustedOrigins = (process.env.AUTH_TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  trustedOrigins,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: MAX_PASSWORD_LENGTH,
    // Part 2 adds email verification and password reset, which need an email service
    requireEmailVerification: false,
  },

  user: {
    additionalFields: {
      // input: false means a sign-up form can NEVER set the role
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false,
      },
    },
  },

  rateLimit: {
    // Also on while developing, so we can test it before going live
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 600, max: 5 },
    },
  },

  // Must be the last plugin: it lets Server Actions set and clear cookies
  plugins: [nextCookies()],
});