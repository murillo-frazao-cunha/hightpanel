export interface User {
    username: string;
    email: string;
    admin: boolean;
    id: string;
    // Adicionado campo de senha (opcional, usado apenas no envio)
    password?: string;
}

