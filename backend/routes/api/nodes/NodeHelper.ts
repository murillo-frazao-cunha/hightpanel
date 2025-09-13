import {NextRequest, NextResponse} from "next/server";
import {Users} from "@/backend/libs/User";
import {ServerApi} from "@/backend/libs/Server";
import {getTables} from "@/backend/database/tables/tables";
import bcrypt from "bcryptjs";


export async function interpretNodeHelper(request: NextRequest, params: { [key: string]: string }) {
    const body = await request.json();
    const token = body.token

    if(!token) {
        return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }
    if(token !== process.env.TOKEN) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    const { action } = params;

    switch (action) {
        case "permission":
            return HasPermission(body);
        case "verify-sftp":
            return VerifySFTP(body);
        case "admin-permission":
        default:
            return HasAdminPermission(body);
    }
}
export async function VerifySFTP(body: any) {
    try {
        const {userName, password, serverUuid} = body;
        if(!userName || !password || !serverUuid) {
            return NextResponse.json({ error: 'userUuid is required' }, { status: 400 });
        }
        const {profileTable} = await getTables()
        const userList = await profileTable.findByParam("username", userName)
        if(userList.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const user = userList[0];
        // verificar se é valido pelo bcrypt
        const isValid = bcrypt.compareSync(password, user.passwordHash);
        if(!isValid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 403 });
        }
        const server = await ServerApi.getServer(serverUuid);
        if(!server) {
            return NextResponse.json({ error: 'serverUuid is required' }, { status: 400 });
        }
        // Verifique se o usuário tem permissão para o servidor aqui ou é admin
        if(server.ownerId !== user.id) {
            if(!user.admin) {
                return NextResponse.json({ permission: false }, { status: 403 });
            }
        }
        return NextResponse.json({ permission: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function HasAdminPermission(body: any) {
    try {
        const userUuid = body.userUuid;
        if(!userUuid) {
            return NextResponse.json({ error: 'userUuid is required' }, { status: 400 });
        }
        const user = await Users.getUser(userUuid)
        if(!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const isAdmin = user.admin;
        return NextResponse.json({ isAdmin });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
export async function HasPermission(body: any) {
    try {
        const userUuid = body.userUuid;
        const serverUuid = body.serverUuid;
        if(!userUuid) {
            return NextResponse.json({ error: 'userUuid is required' }, { status: 400 });
        }
        if(!serverUuid) {
            return NextResponse.json({ error: 'serverUuid is required' }, { status: 400 });
        }
        const user = await Users.getUser(userUuid)
        if(!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const isAdmin = user.admin;
        const server = await ServerApi.getServer(serverUuid);
        if(!server) {
            return NextResponse.json({ error: 'serverUuid is required' }, { status: 400 });
        }
        // Verifique se o usuário tem permissão para o servidor aqui
        if(server.ownerId !== user.id && !user.admin) {
            return NextResponse.json({ permission: false }, { status: 403 });
        }



        return NextResponse.json({ permission: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
