import { loginApi } from "../api/authApi";

export const login = async (email, password) => {
  const response = await loginApi({
    email: (email || "").trim(),
    password,
  });

  const data = response.data;
  const user = data.user;

  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("roles", JSON.stringify(user?.roles ?? []));
  localStorage.setItem("access", JSON.stringify([]));

  return data;
};

export const logout = () => {
  localStorage.clear();
};