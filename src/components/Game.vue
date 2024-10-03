<script setup lang="ts">
import { ref } from "vue";

const is_revealed = ref(false);
</script>

<template>
  <div class="reveal-container" @click="is_revealed = !is_revealed">
    <div class="rotating-box" :class="{ 'rotate-y-180': is_revealed }">
      <img class="reveal-img rotate-y-180" src="../assets/other.jpg" />
      <img class="reveal-img album-cover" src="../assets/vinyl-640x640.jpg" />
    </div>
  </div>
</template>

<style scoped>
.reveal-container {
  position: relative;
  perspective: 1000px;

  .rotating-box {
    transform-style: preserve-3d;
    transition: transform 1.5s;
    display: flex;
    justify-content: center;
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
}
</style>
