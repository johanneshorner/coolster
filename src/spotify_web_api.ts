const CLIENT_ID = "cf04c7e7969443b1ae794f1c16aa0ce0";
const REDIRECT_URI = window.location.origin;

// Tests our access-token by issuing a request
const test_access_token = async (access_token: string) => {
  const url =
    "https://api.spotify.com/v1/melody/v1/check_scope?" +
    new URLSearchParams({ scope: "web-playback" }).toString();
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
  if (response.status === 401) {
    throw new Error("access-token is invalid");
  }
};

export async function get_or_refresh_access_token() {
  if (!is_token_expired()) {
    return localStorage.getItem("access-token")!;
  }
  return await refresh_access_token();
}

const is_token_expired = () => {
  const expiry_time = parseInt(localStorage.getItem("expiry-time")!);
  return expiry_time < Date.now();
};

export async function setup_access_token(): Promise<string | null> {
  if (!window.location.search) {
    const access_token = localStorage.getItem("access-token");
    if (!access_token) {
      return null;
    }

    if (!is_token_expired()) {
      await test_access_token(access_token);
      return access_token;
    }

    try {
      return await refresh_access_token();
    } catch (e) {
      console.log(`cannot refresh access token: ${e}`);
      return null;
    }
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

export async function refresh_access_token(): Promise<string> {
  const refresh_token = localStorage.getItem("refresh-token");
  if (!refresh_token) {
    throw new Error("no refresh-token in local storage");
  }

  const token_url = "https://accounts.spotify.com/api/token";
  const response = await fetch(token_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token,
    }),
  });

  const json = await response.json();
  localStorage.setItem("access-token", json.access_token);
  if (json.refresh_token)
    localStorage.setItem("refresh-token", json.refresh_token);
  const expiry_time_in_millis = Date.now() + json.expires_in * 1000;
  localStorage.setItem("expiry-time", expiry_time_in_millis.toString());

  return json.access_token;
}

export async function get_track(track_id: string) {
  const url = `https://api.spotify.com/v1/tracks/${track_id}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access-token")}`,
    },
  });
  return response.json();
}

export async function toggle_playback_shuffle(state: boolean) {
  const url =
    "https://api.spotify.com/v1/me/player/shuffle?" +
    new URLSearchParams({ state: state.toString() }).toString();
  await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access-token")}`,
    },
  });
}

export async function start_playback(device_id: string, uri: string) {
  const url =
    "https://api.spotify.com/v1/me/player/play?" +
    new URLSearchParams({ device_id }).toString();
  await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access-token")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      context_uri: uri,
      position_ms: 0,
    }),
  });
}

export async function transfer_playback(device_id: string, play: boolean) {
  const url = "https://api.spotify.com/v1/me/player";
  await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access-token")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      device_ids: [device_id],
      play,
    }),
  });
}
