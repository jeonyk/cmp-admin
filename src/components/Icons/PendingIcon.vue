<template>
  <div class="pending-icon">
    <div class="dot one" />
    <div class="dot two" />
    <div class="dot three" />
  </div>
</template>

<script>
export default {
}
</script>

<style lang="scss" scoped>
.pending-icon {
  display: flex;
  align-items: center;
}
.dot {
  display: block;
  height: 2px;
  width: 2px;
  border-radius: 50%;
  margin-right: 1px;
  animation: opacityAnim 1.6s ease-in-out infinite;
  background-color: #727797;
  &.one { animation-delay: 1s;}
  &.two { animation-delay: 1.2s; }
  &.three { animation-delay: 1.3s; }
}

@keyframes opacityAnim {
  0% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
  100% {
    opacity: .1;
  }
}
</style>
