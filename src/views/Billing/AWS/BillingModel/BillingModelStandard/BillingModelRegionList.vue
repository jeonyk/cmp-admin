<template>
  <ul class="region-list">
    <li
      v-for="(region, index) in regions"
      :key="`${region}-${index}`"
      @click="changeRegion(index)"
      class="region-list-item"
      :class="{'is-focused': selectedRegionIdx === index}"
    >
      <p class="region-title">
        {{ region.displayName }}
      </p><p class="region-sub">
        {{ region.regionName }}
      </p>
    </li>
  </ul>
</template>

<script>
export default {
  name: 'BillingModelRegionList',
  model: {
    prop: 'selectedRegionIdx',
    event: 'change'
  },
  props: {
    regions: {
      type: Array,
      default () {
        return []
      }
    },
    selectedRegionIdx: {
      type: Number,
      default: 0
    }
  },
  watch: {
    value (val) {
      console.log(val)
    }
  },
  methods: {
    changeRegion (index) {
      console.log(index)
      this.$emit('change', index)
      // 리전이 바뀌었을때 이벤트를 전달합니다.
    }
  }

}
</script>

<style lang="scss" scoped>
  .region-list {
    width: 100%;
    height: 620px;
    overflow-y: auto;
    box-sizing: border-box;
    .region-list-item {
      cursor: pointer;
      width: 100%;
      box-sizing: border-box;
      background-color: #0A0C20;
      margin-bottom: 8px;
      padding:  20px;
      border-radius: 6px;
      transition: all 0.2s ease;
      .region-title {
        font-weight:700;
        font-size: 13px;
        margin-bottom: 8px;
        opacity: 0.4;
      }
      .region-sub {
        font-size: 12px;
        font-weight: 400;
        opacity: 0.4;
      }
      &.is-focused {
        background-color: white;
        color: black;
        .region-title {
          opacity: 1;
        }
        .region-sub {
          opacity: 1;
        }
      }
    }
  }

</style>
