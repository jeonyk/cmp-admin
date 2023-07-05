<template>
  <svg
    :width="width"
    :height="height"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="0.5"
      y="0.5"
      width="13"
      height="13"
      rx="6.5"
      stroke="#727797"
    />
    <g clip-path="url(#clip0)">
      <path
        d="M10.364 7.18213H4"
        stroke="#727797"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M7.18198 4.00015V10.3641"
        stroke="#727797"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0">
        <rect
          width="8.72792"
          height="8.72792"
          fill="white"
          transform="translate(1 7.17163) rotate(-45)"
        />
      </clipPath>
    </defs>
  </svg>
</template>

<script>
import IconBase from './IconBase'

export default {
  name: 'PlusIcon',
  mixins: [IconBase]
}
</script>
