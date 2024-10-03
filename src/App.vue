<script setup lang="ts">
import Game from "./components/Game.vue";
import {
  setup_access_token,
  request_user_authorization,
} from "./spotify_web_api.ts";
import { ref, onMounted } from "vue";

let request_user_authorization_dialog: HTMLDialogElement | null = null;
onMounted(() => {
  request_user_authorization_dialog = document.getElementById(
    "request-user-authorization-dialog",
  )! as HTMLDialogElement;
});

let access_token = ref<string | null>(null);
setup_access_token().then((token) => {
  if (token) {
    access_token.value = token;
  } else {
    request_user_authorization_dialog!.showModal();
  }
});
</script>

<template>
  <dialog id="request-user-authorization-dialog">
    <p>
      For this game to work you need to grant access to your spotify account. Do
      you want to be redirected to the spotify authentication page?
    </p>
    <div>
      <button type="button" @click="request_user_authorization_dialog!.close()">
        Cancel
      </button>
      <button type="button" @click="request_user_authorization">Confirm</button>
    </div>
  </dialog>
  <Game msg="Vite + Vue" />
</template>

<style scoped></style>
