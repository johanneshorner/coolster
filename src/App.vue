<script setup lang="ts">
import Game from "./components/Game.vue";
import {
  setup_access_token,
  request_user_authorization,
} from "./spotify_web_api.ts";
import { onMounted, useTemplateRef } from "vue";

const request_user_authorization_dialog = useTemplateRef<HTMLDialogElement>(
  "request-user-authorization-dialog",
);
const dialog_text = useTemplateRef<HTMLParagraphElement>("dialog-text");

const NO_TOKEN_DIALOG_TEXT =
  "For this game to work you need to grant access to your spotify account. Do you want to be redirected to the spotify authentication page?";
const BAD_TOKEN_DIALOG_TEXT =
  "Your access token expired and could not be refreshed. Do you want to be redirected to the spotify authentication page to request a new one?";

onMounted(() => {
  setup_access_token()
    .then((token) => {
      if (!token) {
        dialog_text.value!.innerText = NO_TOKEN_DIALOG_TEXT;
        request_user_authorization_dialog.value!.showModal();
      }
    })
    .catch(() => {
      dialog_text.value!.innerText = BAD_TOKEN_DIALOG_TEXT;
      request_user_authorization_dialog.value!.showModal();
    });
});
</script>

<template>
  <dialog ref="request-user-authorization-dialog">
    <p ref="dialog-text"></p>
    <div>
      <button type="button" @click="request_user_authorization_dialog!.close()">
        Cancel
      </button>
      <button type="button" @click="request_user_authorization">Confirm</button>
    </div>
  </dialog>
  <div id="game">
    <Suspense>
      <Game />
      <template #fallback> Loading Game... </template>
    </Suspense>
  </div>
</template>

<style scoped>
#game {
  display: flex;
  justify-content: center;
}
</style>
