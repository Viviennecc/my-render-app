import React, { useEffect, useState } from "react";

// --- PKCE HELPERS ---
const generateRandomString = (length) => {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
};

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const SpotifyPKCEPlayer = () => {
  const CLIENT_ID = "c9fa74056fde42aeba50700b5c835061"; // 👈 REPLACE THIS
  const REDIRECT_URI = "http://localhost:3000";

  const [token, setToken] = useState(
    window.localStorage.getItem("access_token"),
  );
  const [playlists, setPlaylists] = useState([]);
  const [selectedUri, setSelectedUri] = useState("");

  // 1. START LOGIN (Redirect to Spotify)
  const handleLogin = async () => {
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    window.localStorage.setItem("code_verifier", codeVerifier);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      scope: "playlist-read-private user-read-private",
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      redirect_uri: REDIRECT_URI,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  };

  // 2. CATCH CODE & EXCHANGE FOR TOKEN
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      const exchangeCodeForToken = async () => {
        const codeVerifier = window.localStorage.getItem("code_verifier");
        const payload = {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: codeVerifier,
          }),
        };

        const body = await fetch(
          "https://accounts.spotify.com/api/token",
          payload,
        );
        const response = await body.json();

        if (response.access_token) {
          window.localStorage.setItem("access_token", response.access_token);
          setToken(response.access_token);
          window.history.replaceState({}, document.title, "/"); // Clean URL
        }
      };

      exchangeCodeForToken();
    }
  }, [CLIENT_ID]);

  // 3. FETCH DATA
  useEffect(() => {
    if (token) {
      fetch("https://api.spotify.com/v1/me/playlists", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setPlaylists(data.items || []);
          if (data.items?.length > 0) setSelectedUri(data.items[0].uri);
        });
    }
  }, [token]);

  const logout = () => {
    window.localStorage.clear();
    setToken(null);
  };

  return (
    <div
      style={{
        backgroundColor: "#121212",
        color: "white",
        minHeight: "400px",
        padding: "30px",
        fontFamily: "sans-serif",
      }}
    >
      {!token ? (
        <button
          onClick={handleLogin}
          style={{
            backgroundColor: "#1DB954",
            color: "white",
            padding: "15px 30px",
            borderRadius: "30px",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Login with Spotify (Code + PKCE)
        </button>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            gap: "20px",
          }}
        >
          <aside>
            <button
              onClick={logout}
              style={{
                color: "#aaa",
                background: "none",
                border: "1px solid #444",
                borderRadius: "4px",
                marginBottom: "20px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
            <h3>Playlists</h3>
            {playlists.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedUri(p.uri)}
                style={{
                  padding: "10px",
                  cursor: "pointer",
                  borderBottom: "1px solid #222",
                  color: selectedUri === p.uri ? "#1DB954" : "white",
                }}
              >
                {p.name}
              </div>
            ))}
          </aside>

          <main>
            {selectedUri && (
              <iframe
                src={`https://open.spotify.com/embed/${selectedUri.split(":")[1]}/${selectedUri.split(":")[2]}?utm_source=generator&theme=0`}
                width="100%"
                height="400"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              ></iframe>
            )}
          </main>
        </div>
      )}
    </div>
  );
};

export default SpotifyPKCEPlayer;
