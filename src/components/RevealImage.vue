The rotating image is done very hackily. The animations initial direction is set
to reverse so that the first .reverse() call actually starts in the correct
direction. Once the component is mounted we immediately call .finish() on the
animation so that the first "reversed" animation is not seen.

<script lang="ts">
export enum State {
  Front,
  Back,
  FrontPending,
  BackPending,
}
</script>

<script setup lang="ts">
import { useTemplateRef, onMounted, watch, ref } from "vue";

const props = defineProps<{
  front: string;
  back: string;
  rotated: boolean;
}>();
const emit = defineEmits<{
  "state-changed": [state: State];
}>();

const delayed_back = ref("");

watch(
  () => props.rotated,
  (new_rotated) => {
    if (new_rotated) {
      show_back();
    } else {
      show_front();
    }
  },
);

let current_state = State.Front;
const set_state = (new_state: State) => {
  current_state = new_state;
  emit("state-changed", current_state);
};

const rotating_box = useTemplateRef<HTMLDivElement>("rotating-box");

let rotate_animation: Animation | null = null;
onMounted(() => {
  delayed_back.value = props.back;
  rotate_animation = rotating_box
    .value!.getAnimations()
    .find((a) => (a as CSSAnimation).animationName.includes("rotate"))!;
  rotate_animation.addEventListener("finish", () => {
    switch (current_state) {
      case State.FrontPending:
        set_state(State.Front);
        break;
      case State.BackPending:
        set_state(State.Back);
        break;
      default:
        console.warn(
          `received animation finish event but our state is already '${current_state}'`,
        );
    }
  });
  rotate_animation.finish();

  watch(
    () => props.back,
    async (new_back) => {
      if (current_state !== State.Front) {
        await new Promise((r) =>
          rotate_animation!.addEventListener("finish", r, { once: true }),
        );
      }
      delayed_back.value = new_back;
    },
  );
});

const toggle = () => {
  if (current_state === State.Back || current_state === State.BackPending) {
    show_front();
  } else {
    show_back();
  }
};

const show_front = () => {
  switch (current_state) {
    case State.Front:
    case State.FrontPending:
      return;
    case State.BackPending:
    case State.Back:
      rotate_animation!.reverse();
      set_state(State.FrontPending);
      break;
  }
};

const show_back = () => {
  switch (current_state) {
    case State.Front:
    case State.FrontPending:
      rotate_animation!.reverse();
      set_state(State.BackPending);
      break;
    case State.BackPending:
    case State.Back:
      return;
  }
};

const state = () => current_state;

defineExpose({ toggle, show_front, show_back, state });
</script>

<template>
  <div id="perspective">
    <div ref="rotating-box" id="rotating-box">
      <img class="image" id="back" :src="delayed_back" />
      <img class="image" id="front" :src="front" />
    </div>
  </div>
</template>

<style scoped>
#perspective {
  perspective: 1000px;
  display: flex;
}

#rotating-box {
  transform-style: preserve-3d;
  animation-duration: 1.5s;
  animation-name: rotate;
  animation-fill-mode: both;
  animation-direction: reverse;
  display: grid;
}

@keyframes rotate {
  from {
    transform: rotateY(0deg);
  }

  to {
    transform: rotateY(180deg);
  }
}

.image {
  backface-visibility: hidden;
  border-radius: 20%;
}

#front,
#back {
  grid-row: 1;
  grid-column: 1;
}

#back {
  transform: rotateY(180deg);
}
</style>
