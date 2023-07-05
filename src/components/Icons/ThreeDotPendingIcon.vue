<template>
  <svg
    width="8"
    height="2"
    viewBox="0 0 8 2"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="1"
      cy="1"
      r="1"
      :fill="iconColor"
      fill-opacity="0.4"
    />
    <circle
      cx="7"
      cy="1"
      r="1"
      :fill="iconColor"
    />
    <circle
      cx="4"
      cy="1"
      r="1"
      :fill="iconColor"
      fill-opacity="0.7"
    />
  </svg>
</template>

<script>
import IconBase from './IconBase'

export default {
  name: 'PendingIcon',
  mixins: [IconBase]
}
</script>
