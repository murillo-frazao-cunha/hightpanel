// file: src/lib/auth.ts

import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import {getTables} from "@/backend/database/tables/tables";
import {Profile} from "@/backend/database/models/ProfileTable";

/**
 * Valida se uma string é um endereço de e-mail válido.
 * @param email A string a ser validada.
 * @returns `true` se for um e-mail válido, `false` caso contrário.
 */
export function isEmail(email: string): boolean {
    // Retorna falso para valores nulos, indefinidos ou que não são strings.
    if (!email || typeof email !== 'string') {
        return false;
    }

    // Expressão Regular (Regex) para validação de e-mail.
    // É um padrão comum e amplamente aceito que cobre 99% dos casos de uso.
    const emailRegex = new RegExp(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );

    // Testa a string contra o padrão da regex.
    return emailRegex.test(email.toLowerCase());
}

// ✨ Exporte suas opções de autenticação a partir de um arquivo central
export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Usuário", type: "text" },
                password: { label: "Senha", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials.password) {
                    return null;
                }
                const {username, password} = credentials;
                const tables = await getTables()
                let profile: Profile | null = null;
                if(isEmail(username)) {
                    // Profile[] lista
                    const user = await tables.profileTable.findByParam("email", username)
                    if(user.length === 1) {
                        profile = user[0]
                    }
                } else {
                    const user = await tables.profileTable.findByParam("username", username)
                    if(user.length === 1) {
                        profile = user[0]
                    }
                }
                if(!profile) {
                    return null;
                }
                const validPassword = await bcrypt.compare(password, profile.passwordHash);
                if(validPassword) {
                    profile.lastLogin = Date.now()
                    profile.save().catch(console.error)
                    return {
                        id: profile.id,
                    }
                } else {
                    return null;
                }
            }
        })
    ],
    pages: {
        signIn: "/login"
    },
    session: {
        strategy: "jwt"
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                // @ts-ignore - Adicionando id ao usuário da sessão
                session.user.id = token.id;
            }
            return session;
        }
    }
};
