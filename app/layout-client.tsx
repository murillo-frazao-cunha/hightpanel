"use client";


import {SessionProvider} from "next-auth/react";
import {UserProvider} from "@/app/contexts/UserContext";
import {ToastProvider} from "@/app/contexts/ToastContext";

export default function LayoutClient({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {

    return (

        <SessionProvider>
            <UserProvider>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </UserProvider>
        </SessionProvider>

    );
}
