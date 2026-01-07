/**
 * Exportações principais do Supabase
 */

// Clients
export { createClient as createBrowserClient } from './client';
export { createClient as createServerClient } from './server';

// Queries
export * from './queries';
export * from './events';
export * from './challenges';
export * from './rewards';

// Types
export * from './types';
