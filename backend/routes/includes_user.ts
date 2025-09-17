import {NextRequest, NextResponse} from "next/server";
import getUser from "@/backend/routes/api/userHelper";
import {getTables} from "@/backend/database/tables/tables";
import {Users} from "@/backend/libs/User";

export async function interpreteIncludesUser(request: NextRequest, params: { [key: string]: string }) {
    const tables = await getTables()
    const all = await tables.profileTable.getAll()
    if(all.length === 0) {
        return NextResponse.json({
            includes: false
        })
    }
    return NextResponse.json({
        includes: true
    })
}
export async function createFirstUser(request: NextRequest, params: { [key: string]: string }) {
    const tables = await getTables()
    const all = await tables.profileTable.getAll()
    if(all.length !== 0) {
        return NextResponse.json({ status: 'error', error: 'Já possui um usuário.'})
    }
    const currentUser = await getUser();
    if(currentUser) {
        return NextResponse.json({ status: 'error', error: 'Você já está logado.'})
    }
    const { name, email, password } = await request.json()
    if(!name || !email || !password) {
        return NextResponse.json({ status: 'error', error: 'Variavel faltando' })
    }
    // verificar se email é valido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)) {
        return NextResponse.json({ status: 'error', error: 'Email inválido' })
    }
    if (password.length < 8) {
        return NextResponse.json({ status: 'error', error: 'A senha deve ter no mínimo 8 caracteres.' });
    }
    if (!/(?=.*[a-z])/.test(password)) {
        return NextResponse.json({ status: 'error', error: 'A senha deve conter pelo menos uma letra minúscula.' });
    }
    if (!/(?=.*[A-Z])/.test(password)) {
        return NextResponse.json({ status: 'error', error: 'A senha deve conter pelo menos uma letra maiúscula.' });
    }
    if (!/(?=.*\d)/.test(password)) {
        return NextResponse.json({ status: 'error', error: 'A senha deve conter pelo menos um número.' });
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
        return NextResponse.json({ status: 'error', error: 'A senha deve conter pelo menos um caractere especial (@, $, !, %, *, ?, &).' });
    }

    const user = await Users.createUser({
        name,
        email,
        password,
        admin: true
    })
    if(!user) {
        return NextResponse.json({ status: 'error', error: 'Erro ao criar usuário' })
    }
    return NextResponse.json({ status: 'success', user })
}