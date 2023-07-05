<template>
  <svg
    :width="width"
    :height="height"
    viewBox="0 0 12 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      y="3"
      width="12"
      height="1"
      :fill="iconColor"
    />
    <rect
      x="1"
      y="15"
      width="10"
      height="1"
      :fill="iconColor"
    />
    <rect
      x="10"
      y="16"
      width="11"
      height="1"
      transform="rotate(-90 10 16)"
      :fill="iconColor"
    />
    <rect
      x="7"
      y="12"
      width="5"
      height="1"
      transform="rotate(-90 7 12)"
      :fill="iconColor"
    />
    <rect
      x="4"
      y="12"
      width="5"
      height="1"
      transform="rotate(-90 4 12)"
      :fill="iconColor"
    />
    <rect
      x="1"
      y="16"
      width="11"
      height="1"
      transform="rotate(-90 1 16)"
      :fill="iconColor"
    />
    <rect
      x="3.5"
      y="0.5"
      width="5"
      height="3"
      :stroke="iconColor"
    />
  </svg>
</template>

<script>
import IconBase from './IconBase'

export default {
  mixins: [IconBase]
}
</script>
