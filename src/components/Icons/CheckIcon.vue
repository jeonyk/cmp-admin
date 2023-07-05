<template>
  <svg
    :width="height"
    :height="height"
    viewBox="0 0 12 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4.62588 7.54267L0.666546 3.71399L1.60921 2.77132L4.62655 5.656L4.62588 5.65667L10.2826 0L11.2252 0.942667L5.56855 6.6L4.62655 7.542L4.62588 7.54267Z"
      :fill="iconColor"
    />
  </svg>
</template>

<script>
import IconBase from './IconBase'

export default {
  name: 'CheckIcon',
  mixins: [IconBase]
}
</script>
