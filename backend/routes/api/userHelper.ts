import {getServerSession} from "next-auth/next";
import {authOptions} from "@/backend/libs/auth";
import {NextResponse} from "next/server";
import {Profile} from "@/backend/database/models/ProfileTable";
import {getTables} from "@/backend/database/tables/tables";
import {cookies} from "next/headers";

export default async function getUser(): Promise<Profile | null> {
    // 2. Obtenha a sessão do usuário no lado do servidor
    const session = await getServerSession(authOptions);

    // @ts-ignore
    if (!session || !session.user || !session.user.id) {
        return null
    }

    // @ts-ignore
    const userId = session.user.id;

    const tables = await getTables()

    const user = await tables.profileTable.get(userId)

    if (!user) {
        (await cookies()).delete("next-auth.session-token");
        (await cookies()).delete("next-auth.csrf-token");
        return null
    }

    return user;
}