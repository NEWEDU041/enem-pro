// Minimal auth-client stub
export function useAuth() {
  return {
    user: null,
    isLoading: false,
    isError: false,
  };
}

export const authClient = {
  getSession: async () => null,
};
