export interface DatabaseHost {
  id?: string; // UUID
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string; // enviado só em criação ou alteração
  phpmyAdminLink?: string;
}

