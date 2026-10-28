export interface DatabaseHealth {
  status: 'UP' | 'DOWN';
  host: string;
  database: string;
  isReplicaSet: boolean;
  responseTimeMs: number;
}

export interface MemoryHealth {
  rssMb: number;
  heapTotalMb: number;
  heapUsedMb: number;
}

export interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptimeSeconds: number;
  timestamp: string;
  environment: string;
  version: string;
  database: DatabaseHealth;
  memory: MemoryHealth;
}

export interface QuickHealthResponse {
  status: 'ok';
  timestamp: string;
  uptime: number;
}
