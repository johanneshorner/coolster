<script setup lang="ts">
import Game from "./components/Game.vue";
import {
  setup_access_token,
  request_user_authorization,
} from "./spotify_web_api.ts";
import { ref, useTemplateRef } from "vue";

const request_user_authorization_dialog = useTemplateRef<HTMLDialogElement>(
  "request-user-authorization-dialog",
);

let access_token = ref<string | null>(null);
setup_access_token().then((token) => {
  if (token) {
    access_token.value = token;
  } else {
    request_user_authorization_dialog.value!.showModal();
  }
});
</script>

<template>
  <dialog ref="request-user-authorization-dialog">
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
  <Suspense>
    <Game />
    <template #fallback> Loading Game... </template>
  </Suspense>
</template>

<style scoped></style>
