export type ServerStatus = 'running' | 'initializing' | 'stopped';

export interface Server {
  id: string;
  name: string;
  ip: string;
  status: ServerStatus;
  cpu: { used: number; total: number };
  ram: { used: number; total: number; unit: 'MB' | 'GB' };
  disk: { used: number; total: number; unit: 'MB' | 'GB' };
  isFavorite?: boolean;
  error?: boolean;
}

