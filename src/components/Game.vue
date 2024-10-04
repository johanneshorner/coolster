The rotating image is very hackily done. The animations initial direction is set
to reverse so that the first .reverse() call actually starts in the correct
direction. Once the component is mounted we immediately call .finish() on the
animation so that the first "reversed" animation is not seen.

<script setup lang="ts">
import { ref, computed, useTemplateRef, onMounted } from "vue";
import { setup_player } from "./spotify_web_playback_sdk";
import { get_track } from "../spotify_web_api";

const spotify_uri_input = useTemplateRef<HTMLInputElement>("spotify-uri-input");
const rotating_box_div = useTemplateRef<HTMLDivElement>("rotating-box-div");

let rotate_animation: Animation | null = null;
onMounted(() => {
  rotate_animation = rotating_box_div
    .value!.getAnimations()
    .find((a) => (a as CSSAnimation).animationName.includes("cover-reveal"))!;
  rotate_animation.finish();
});

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
  } else {
    previous_state = state;
  }

  get_track(state.track_window.current_track.id).then((json) => {
    const animations = rotating_box_div.value?.getAnimations();
    console.log(animations);
    if (is_revealed.value) {
      rotating_box_div.value!.addEventListener(
        "transitionend",
        () => {
          current_track_information.value = json;
        },
        { once: true },
      );
      is_revealed.value = false;
    } else {
      current_track_information.value = json;
    }
  });
});

const next_track = () => {
  toggle_reveal();
  player.next_track();
};

const toggle_reveal = () => {
  if (is_revealed.value) {
    is_revealed.value = false;
  } else {
    rotating_box_div.value!.addEventListener(
      "animationend",
      () => (is_revealed.value = !is_revealed.value),
      {
        once: true,
      },
    );
  }
  rotate_animation!.reverse();
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
  <button type="button" @click="next_track">Next track</button>
  <div class="reveal-container" @click="toggle_reveal">
    <div ref="rotating-box-div" class="rotating-box">
      <img
        class="reveal-img rotate-y-180"
        :src="current_track_information?.album.images[0].url"
      />
      <img class="reveal-img album-cover" src="../assets/vinyl-640x640.jpg" />
    </div>
  </div>
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
.reveal-container {
  position: relative;
  perspective: 1000px;
}

.rotating-box {
  transform-style: preserve-3d;
  animation-duration: 1.5s;
  animation-name: cover-reveal;
  animation-fill-mode: both;
  animation-direction: reverse;
  display: flex;
  justify-content: center;
}

@keyframes cover-reveal {
  from {
    transform: rotateY(0deg);
  }

  to {
    transform: rotateY(180deg);
  }
}

.reveal-img {
  width: 60%;
  backface-visibility: hidden;
  border-radius: 20%;
}

.album-cover {
  position: absolute;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}

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
