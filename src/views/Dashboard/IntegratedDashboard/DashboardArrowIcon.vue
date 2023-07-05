<template>
  <svg
    :class="type"
    width="8"
    height="11"
    viewBox="0 0 8 11"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.06252 4.6875L4.00002 2.0625L0.937515 4.6875M4.00002 10.8125L4.00001 2.5"
      :stroke="stroke"
      stroke-width="2"
    />
  </svg>
</template>

<script>
export default {
  name: 'DashboardArrowIcon',
  props: {
    type: {
      type: String,
      default: '-plus',
      validator (value) {
        return ['-plus', '-minus', ''].includes(value)
      }
    },
    stroke: {
      type: String,
      default: '#5260D9'
    }
  }
}
</script>

<style lang="scss" scoped>
.-minus {
  transform: rotate(180deg)
}
svg {
  display: block;
  margin-right: 3px;
}
</style>
