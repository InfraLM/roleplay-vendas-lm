export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: string | null;
}

export interface ApiError {
  message: string;
  statusCode: number;
  details?: unknown;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
