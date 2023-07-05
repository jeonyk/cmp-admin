<template>
  <svg
    :width="width"
    :height="height"
    viewBox="0 0 2 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1.74332 5.60799H0.283422L0.0534759 0H1.97326L1.74332 5.60799ZM0 7.15605C0 6.9097 0.0944742 6.70828 0.283422 6.55181C0.475936 6.39201 0.714795 6.31211 1 6.31211C1.28521 6.31211 1.52228 6.39201 1.71123 6.55181C1.90374 6.70828 2 6.9097 2 7.15605C2 7.40241 1.90374 7.60549 1.71123 7.76529C1.52228 7.92176 1.28521 8 1 8C0.714795 8 0.475936 7.92176 0.283422 7.76529C0.0944742 7.60549 0 7.40241 0 7.15605Z"
      :fill="iconColor"
    />
  </svg>
</template>

<script>
import IconBase from './IconBase'

export default {
  mixins: [IconBase]
}
</script>
