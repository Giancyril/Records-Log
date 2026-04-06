const TOKEN_KEY = "rl_token";

const DUMMY_ADMIN = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "admin@nbsc.edu.ph",
  username: "admin",
  name: "System Admin",
  role: "ADMIN",
};

export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const getToken = () => "dummy-token";
export const removeToken = () => {};

export const setUser = (_user: any) => {};
export const getUser = () => DUMMY_ADMIN;

export const useAdminUser = () => DUMMY_ADMIN;

export const signOut = (_navigate: any) => {};

export const isAuthenticated = () => true;