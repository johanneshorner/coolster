const CLIENT_ID = "cf04c7e7969443b1ae794f1c16aa0ce0";
const REDIRECT_URI = window.location.origin;

export async function setup_access_token(): Promise<string | null> {
  if (!window.location.search) {
    // TODO If the token exists validate it by issuing some request to spotify
    return localStorage.getItem("access-token");
  }

  const params = new URLSearchParams(window.location.search);
  // TODO instruct spotify to redirect to some other path e.g. /spotify-auth and redirect back to root from there
  window.history.pushState(null, "", "/");

  const code = params.get("code");
  if (!code) {
    console.log("`code` query parameter does not exist");
    return null;
  }

  const code_verifier = localStorage.getItem("code-verifier");
  if (!code_verifier) {
    console.log("`code-verifier` does not exist in local storage");
    return null;
  }

  const token_url = "https://accounts.spotify.com/api/token";
  const response = await fetch(token_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier,
    }),
  });
  localStorage.removeItem("code-verifier");

  const json = await response.json();
  localStorage.setItem("access-token", json.access_token);
  localStorage.setItem("refresh-token", json.refresh_token);
  const expiry_time_in_millis = Date.now() + json.expires_in * 1000;
  localStorage.setItem("expiry-time", expiry_time_in_millis.toString());

  return json.access_token;
}

export async function request_user_authorization() {
  const generateRandomString = (length: number) => {
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
  };

  const code_verifier = generateRandomString(64);
  localStorage.setItem("code-verifier", code_verifier);

  const sha256 = async (plain: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest("SHA-256", data);
  };

  const base64_encode = (input: ArrayBuffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  };

  const hashed = await sha256(code_verifier);
  const code_challenge = base64_encode(hashed);

  const params = {
    response_type: "code",
    client_id: CLIENT_ID,
    scope:
      "streaming user-modify-playback-state user-read-email user-read-private",
    code_challenge_method: "S256",
    code_challenge,
    redirect_uri: REDIRECT_URI,
  };

  let auth_url = new URL("https://accounts.spotify.com/authorize");
  auth_url.search = new URLSearchParams(params).toString();
  window.location.href = auth_url.toString();
}
