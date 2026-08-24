const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "/api";

const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    localStorage.clear();
    window.location.href = "/";
    return { error: "Session expired. Relog required." };
  }
  return response;
};

export const api = {
  // Authentication Actions
  getCaptcha: () => fetch(`${API_BASE}/auth/captcha`).then((res) => res.json()),

  login: (body) =>
    fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((res) => res.json()),

  register: (body) =>
    fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((res) => res.json()),

  forgotVerify: (body) =>
    fetch(`${API_BASE}/auth/forgot-verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((res) => res.json()),

  resetPassword: (body) =>
    fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((res) => res.json()),

  // Dashboard Visual Customizations
  getSettings: () => fetchWithAuth("/settings").then((res) => res.json()),

  saveSettings: (body) =>
    fetchWithAuth("/settings", {
      method: "POST",
      body: JSON.stringify(body),
    }).then((res) => res.json()),

  // Library Asset Engine
  getBooks: () => fetchWithAuth("/books").then((res) => res.json()),

  addBook: (body) =>
    fetchWithAuth("/books", {
      method: "POST",
      body: JSON.stringify(body),
    }).then((res) => res.json()),

  toggleBorrow: (id) =>
    fetchWithAuth(`/books/${id}/borrow`, { method: "POST" }).then((res) =>
      res.json(),
    ),

  deleteBook: (id) =>
    fetchWithAuth(`/books/${id}`, { method: "DELETE" }).then((res) =>
      res.json(),
    ),

  // Syndication Logs (Blog)
  getBlogs: () => fetchWithAuth("/blogs").then((res) => res.json()),

  addBlog: (body) =>
    fetchWithAuth("/blogs", {
      method: "POST",
      body: JSON.stringify(body),
    }).then((res) => res.json()),

  // Cryptographic Message Store
  getMessages: () => fetchWithAuth("/messages").then((res) => res.json()),

  sendMessage: (body) =>
    fetchWithAuth("/messages", {
      method: "POST",
      body: JSON.stringify(body),
    }).then((res) => res.json()),
};
