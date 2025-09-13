// file: app/api/profile/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import {authOptions} from "@/backend/libs/auth";
import {getTables} from "@/backend/database/tables/tables";
import {cookies} from "next/headers";
import getUser from "@/backend/routes/api/userHelper";

export async function GetUser() {
    try {

        const user = await getUser()
        if(!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const jsonUser = user.toJSON()
        const { passwordHash, ...userWithoutPassword } = jsonUser;
        return NextResponse.json(userWithoutPassword);

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
