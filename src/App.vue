<script setup lang="ts">
import Game from "./components/Game.vue";
import {
  setup_access_token,
  request_user_authorization,
} from "./spotify_web_api.ts";
import { ref } from "vue";

let access_token = ref<string | null>(null);
setup_access_token().then((token) => (access_token.value = token));
</script>

<template>
  <!-- only show this button when we don't have a valid access token yet -->
  <button
    type="button"
    v-if="!access_token"
    @click="request_user_authorization"
  >
    Request spotify access
  </button>
  <Game msg="Vite + Vue" />
</template>

<style scoped></style>
