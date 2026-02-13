
/**
 * @deprecated
 * This hook is DEPRECATED.
 * Please use `hooks/useTonAuth.ts` for all authentication logic.
 * This file is kept only to prevent build errors if referenced, 
 * but should be removed in future cleanups.
 */

export const useAuth = () => {
    throw new Error("useAuth is deprecated. Import useTonAuth from './hooks/useTonAuth' instead.");
};
