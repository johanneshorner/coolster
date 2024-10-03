import {
  get_or_refresh_access_token,
  toggle_playback_shuffle,
  start_playback,
  transfer_playback,
} from "../spotify_web_api";

export class Player {
  inner: any;
  device_id: string;

  constructor(player: any, device_id: string) {
    this.inner = player;
    this.device_id = device_id;
  }

  async set_playlist(spotify_uri: string) {
    await toggle_playback_shuffle(true);
    await start_playback(this.device_id, spotify_uri);
  }

  async toggle_play() {
    await this.inner.togglePlay();
  }

  async volume(): Promise<number> {
    return await this.inner.getVolume();
  }

  async set_volume(volume: number) {
    let new_volume;
    if (volume > 1) {
      new_volume = 1;
    } else if (volume < 0) {
      new_volume = 0;
    } else {
      new_volume = volume;
    }
    await this.inner.setVolume(new_volume);
  }

  async next_track() {
    await this.inner.nextTrack();
  }

  async previous_track() {
    await this.inner.previousTrack();
  }
}

export async function setup_player(on_state_change: (state: any) => void) {
  const script = document.createElement("script");
  script.src = "https://sdk.scdn.co/spotify-player.js";
  script.async = true;
  document.body.appendChild(script);

  const player_ready = new Promise<{ player: any; device_id: string }>(
    (resolve, _) => {
      window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new window.Spotify.Player({
          name: "Coolster",
          getOAuthToken: (cb) => {
            get_or_refresh_access_token()
              .then((access_token) => cb(access_token))
              .catch((e) => console.log(`cannot refresh token: ${e}`));
          },
          volume: 0.05,
        });

        player.addListener("ready", ({ device_id }) => {
          console.log("Ready with Device ID", device_id);
          player
            .activateElement()
            .then(() =>
              transfer_playback(device_id, true).then(() =>
                resolve({ player, device_id }),
              ),
            );
        });

        player.addListener("not_ready", ({ device_id }) => {
          console.log("Device ID has gone offline", device_id);
        });

        player.on("player_state_changed", (state) => on_state_change(state));

        player.addListener("autoplay_failed", () => {
          console.log("Autoplay is not allowed by the browser autoplay rules");
        });

        player.on("initialization_error", ({ message }) => {
          console.error("Failed to initialize", message);
        });

        player.on("authentication_error", ({ message }) => {
          console.error("Failed to authenticate", message);
        });

        player.on("account_error", ({ message }) => {
          console.error("Failed to validate Spotify account", message);
        });

        player.on("playback_error", ({ message }) => {
          console.error("Failed to perform playback", message);
        });

        player.connect();
      };
    },
  );

  const { player, device_id } = await player_ready;
  return new Player(player, device_id);
}
