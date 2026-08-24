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

  try {
    const response = await fetch(`${API_BASE}${url}`, { ...options, headers });

    // ⚠️ 修正互鎖：只有在明確收到 401 身份未驗證時，才強行清空 Session 登出
    if (response.status === 401) {
      localStorage.clear();
      window.location.href = "/";
      return { error: "Session expired. Relog required." };
    }

    // 如果是 403 或其他錯誤，不強行登出，改由組件內部進行降級處理
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        error: errData.error || `HTTP error! status: ${response.status}`,
        status: response.status,
      };
    }

    return response;
  } catch (netErr) {
    console.error("Network request anomaly:", netErr);
    return { error: "Network failure" };
  }
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
  getSettings: () =>
    fetchWithAuth("/settings").then((res) => (res.ok ? res.json() : res)),

  saveSettings: (body) =>
    fetchWithAuth("/settings", {
      method: "POST",
      body: JSON.stringify(body),
    }).then(async (res) => {
      // If it is already intercepted or transformed by fetchWithAuth, return it directly
      if (res.error) return res;

      // Securely parse the stream stream safely
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return text.includes("success")
          ? { success: true }
          : { error: "Payload streaming sync failed." };
      }
    }),

  // Library Asset Engine
  getBooks: () =>
    fetchWithAuth("/books").then((res) => (res.ok ? res.json() : res)),

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
  getBlogs: () =>
    fetchWithAuth("/blogs").then((res) => (res.ok ? res.json() : res)),

  addBlog: (body) =>
    fetchWithAuth("/blogs", {
      method: "POST",
      body: JSON.stringify(body),
    }).then((res) => res.json()),

  // Cryptographic Message Store
  getMessages: () =>
    fetchWithAuth("/messages").then((res) => (res.ok ? res.json() : res)),

  sendMessage: (body) =>
    fetchWithAuth("/messages", {
      method: "POST",
      body: JSON.stringify(body),
    }).then((res) => res.json()),
};
