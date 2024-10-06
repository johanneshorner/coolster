<script setup lang="ts">
import { ref, computed, useTemplateRef } from "vue";
import { setup_player } from "./spotify_web_playback_sdk";
import { get_track } from "../spotify_web_api";
import RevealImage from "./RevealImage.vue";
import front_img from "../assets/vinyl-640x640.jpg";

const spotify_uri_input = useTemplateRef<HTMLInputElement>("spotify-uri-input");

const is_revealed = ref(false);
const current_track_information = ref<any | null>(null);
const current_track_artists = computed(() => {
  return current_track_information.value?.artists
    .map((a: any) => a.name)
    .join(", ");
});

let previous_state: any | null = null;
const player = await setup_player((state) => {
  if (
    previous_state &&
    previous_state.track_window.current_track.id ===
      state.track_window.current_track.id
  ) {
    return;
  }

  previous_state = state;

  get_track(state.track_window.current_track.id).then((json) => {
    is_revealed.value = false;
    current_track_information.value = json;
  });
});
</script>

<template>
  <div id="container">
    <div id="controls">
      <div class="control">
        <input ref="spotify-uri-input" type="text" placeholder="Spotify URI" />
        <button
          type="button"
          @click="player.set_playlist(spotify_uri_input!.value)"
        >
          Start
        </button>
      </div>
      <button class="control" type="button" @click="player.next_track">
        Next track
      </button>
    </div>
    <RevealImage
      ref="album-cover"
      @click="is_revealed = !is_revealed"
      :rotated="is_revealed"
      :front="front_img"
      :back="current_track_information?.album.images[0].url"
    />
    <ul id="current-track-information">
      <li :class="{ hidden: !is_revealed }">
        {{ current_track_information?.name }}
      </li>
      <li :class="{ hidden: !is_revealed }">
        {{ current_track_information?.album.release_date }}
      </li>
      <li :class="{ hidden: !is_revealed }">
        {{ current_track_artists }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
#container {
  display: flex;
  flex-direction: column;
}

#controls {
  width: 50%;
}

.control {
  margin: 5px;
}

.hidden {
  visibility: hidden;
}

#current-track-information {
  list-style-type: none;
  margin: 0;
  padding: 0;
  text-align: center;
  font-size: 20px;
}
</style>
