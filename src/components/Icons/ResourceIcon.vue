<template>
  <svg
    :width="width"
    :height="height"
    viewBox="0 0 18 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.8263 6.10962H17.2286V13.3151H0.771484V6.10962H4.95777"
      :stroke="iconColor"
      stroke-miterlimit="10"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M0.771484 6.10947L3.8572 0.684814H13.9783L17.2286 6.10947"
      :stroke="iconColor"
      stroke-miterlimit="10"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M12.6415 6.10962C11.9009 7.32423 10.4609 8.14615 8.79461 8.14615C7.12833 8.14615 5.68833 7.32423 4.94775 6.10962"
      :stroke="iconColor"
      stroke-miterlimit="10"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script>
import IconBase from './IconBase'

export default {
  mixins: [IconBase]
}
</script>
