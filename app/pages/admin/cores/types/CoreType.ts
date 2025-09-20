export interface CoreImage {
    name: string;
    image: string;
}

export interface CoreVariable {
    name: string;
    description: string;
    envVariable: string;
    rules: string;
}

export interface Core {
    id: string;
    name: string;
    installScript: string;
    startupCommand: string;
    dockerImages: CoreImage[];
    variables: CoreVariable[];
    stopCommand: string;
    startupParser: string; // JSON string
    configSystem: string;  // JSON string
    description?: string; // novo
    creatorEmail?: string; // novo

    createdAt: number;
}
