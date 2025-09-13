// file: app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth"; // ⬅️ Importe AuthOptions
import {authOptions} from "@/backend/libs/auth";
const nextAuthHandler = NextAuth(authOptions);
export { nextAuthHandler as GET, nextAuthHandler as POST };



