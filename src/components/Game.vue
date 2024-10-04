<script setup lang="ts">
import { ref, computed, useTemplateRef } from "vue";
import { setup_player } from "./spotify_web_playback_sdk";
import { get_track } from "../spotify_web_api";
import TwoSidedImage, { State } from "./TwoSidedImage.vue";
import front_img from "../assets/vinyl-640x640.jpg";

type TwoSidedImageType = InstanceType<typeof TwoSidedImage>;

const spotify_uri_input = useTemplateRef<HTMLInputElement>("spotify-uri-input");
const album_cover = useTemplateRef<TwoSidedImageType>("album-cover");

const is_revealed = ref(false);
const current_track_information = ref<any | null>(null);
const current_track_artists = computed(() => {
  return current_track_information.value?.artists
    .map((a: any) => a.name)
    .join(", ");
});

let previous_state: any | null = null;
let buffered_track_information: any | null = null;
const player = await setup_player((state) => {
  if (
    previous_state &&
    previous_state.track_window.current_track.id ===
      state.track_window.current_track.id
  ) {
    return;
  } else {
    previous_state = state;
  }

  get_track(state.track_window.current_track.id).then((json) => {
    is_revealed.value = false;
    if (album_cover.value!.state() === State.Front) {
      current_track_information.value = json;
      buffered_track_information = null;
    } else {
      buffered_track_information = json;
    }
  });
});

const album_cover_state_changed = (state: State) => {
  switch (state) {
    case State.Front:
    case State.Back:
    case State.BackPending:
      if (buffered_track_information) {
        current_track_information.value = buffered_track_information;
        buffered_track_information = null;
      }
      break;
    default:
      break;
  }
};
</script>

<template>
  <div>
    <input ref="spotify-uri-input" type="text" placeholder="Spotify URI" />
    <button
      type="button"
      @click="player.set_playlist(spotify_uri_input!.value)"
    >
      Start
    </button>
  </div>
  <button type="button" @click="player.next_track">Next track</button>
  <TwoSidedImage
    @state-changed="album_cover_state_changed"
    ref="album-cover"
    @click="is_revealed = !is_revealed"
    :rotated="is_revealed"
    :front="front_img"
    :back="current_track_information?.album.images[0].url"
  />
  <ul>
    <li class="current-track-information" :class="{ hidden: !is_revealed }">
      {{ current_track_information?.name }}
    </li>
    <li class="current-track-information" :class="{ hidden: !is_revealed }">
      {{ current_track_information?.album.release_date }}
    </li>
    <li class="current-track-information" :class="{ hidden: !is_revealed }">
      {{ current_track_artists }}
    </li>
  </ul>
  <div ref="test-ref" class="box"></div>
</template>

<style scoped>
.hidden {
  visibility: hidden;
}

.current-track-information {
  list-style-type: none;
  margin: 5;
  padding: 0;
  text-align: center;
  font-size: 20px;
}
</style>
