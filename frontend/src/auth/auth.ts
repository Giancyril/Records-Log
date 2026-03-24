const TOKEN_KEY = "rl_token";
const USER_KEY  = "rl_user";

export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const setUser = (user: any) => localStorage.setItem(USER_KEY, JSON.stringify(user));
export const getUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const useAdminUser = () => getUser();

export const signOut = (navigate: any) => {
  removeToken();
  navigate("/login");
};

export const isAuthenticated = () => !!getToken();