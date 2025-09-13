'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUsers, saveUser } from './api';
import type { User } from './types/UserType';
import UserListPage from './components/UserListPage';
import UserFormPage from './components/UserFormPage';
import { Background } from '@/app/pages/clients/ui/Background';
import { AdminSidebar } from "@/app/pages/admin/ui/AdminSidebar";
import { ToastProvider, useToast } from '@/app/contexts/ToastContext';

interface UsersContainerProps {
    action?: string;
    id?: string;
}

const UsersContent: React.FC<UsersContainerProps> = ({ action, id }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        // Para a página de usuários, é mais simples buscar todos de uma vez
        getUsers().then(data => {
            setUsers(data);
            if (action === 'edit' && id) {
                const userToEdit = data.find(u => u.id === id);
                setEditingUser(userToEdit || null);
            }
            setIsLoading(false);
        });
    }, [action, id]);


    const handleSaveUser = async (userData: Omit<User, 'id'>) => {
        setIsSubmitting(true);
        try {
            await saveUser(userData);
            addToast(`Usuário "${userData.username}" salvo com sucesso!`, 'success');
            router.push('/admin/users');
        } catch (error: any) {
            addToast(error.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-full">
                    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            );
        }

        if (action === 'create') {
            return <UserFormPage onSave={handleSaveUser} isSubmitting={isSubmitting} />;
        }

        if (action === 'edit' && id) {
            return <UserFormPage user={editingUser} onSave={handleSaveUser} isSubmitting={isSubmitting} />;
        }

        return <UserListPage users={users} />;
    };

    return (
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar">
            {renderContent()}
        </main>
    );
};

export default function UsersContainer({ action, id }: UsersContainerProps) {
    return (
        <ToastProvider>
            <div className="min-h-screen bg-zinc-950 text-zinc-200 font-['Inter',_sans-serif] flex">
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #3f3f46; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #52525b; }
                `}</style>
                <Background />
                <AdminSidebar />
                <UsersContent action={action} id={id} />
            </div>
        </ToastProvider>
    );
}
