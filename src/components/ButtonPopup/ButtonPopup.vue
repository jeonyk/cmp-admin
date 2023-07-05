<!--
  * 파일명 : ButtonPopup.vue
  * 파일 기능 :
  * 작성자 : 이경환 외 1명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 fix: 사전 협의 디스크, 설치프로그램 툴팁 수정
 -->

<template>
  <div class="button-popup">
    <el-popover
      :placement="popupPlacement"
      :trigger="popupData.length > 0 ? trigger : null"
      :width="100"
      :popper-class="`-scroll ${popupType} resource`"
    >
      <ul
        :class="['more-info-list', popupType]"
      >
        <li
          class="more-info-item"
          v-for="(item, idx) in popupData"
          :key="idx"
        >
          <slot
            name="popupItem"
            :item="item"
          >
            {{ item.label }}
          </slot>
        </li>
      </ul>
      <button
        slot="reference"
        class="button"
        type="is-anti"
      >
        <!-- @click.stop="clickEvent" -->
        <slot />
      </button>
    </el-popover>
    <!-- <button
      class="button"
      type="is-anti"
      @click.stop="clickEvent"
    >
      <slot />
    </button>

    <transition name="fade">
      <ul
        :class="['more-info-list', popupType]"
        v-if="popup"
      >
        <li
          class="more-info-item"
          v-for="(item, idx) in popupData"
          :key="idx"
        >
          <slot
            name="popupItem"
            :item="item"
          >
            {{ item.label }}
          </slot>
        </li>
      </ul>
    </transition> -->
  </div>
</template>
<script>
export default {
  name: 'ButtonPopup',
  props: {
    popupType: {
      type: String,
      default: 'light',
      validator (value) {
        return ['dark', 'light'].includes(value)
      }
    },
    popupData: { // 팝업에 뿌려줄 데이터 arr
      type: Array,
      default: () => []
    },
    popupPlacement: { // 팝업의 위치
      type: String,
      default: 'bottom',
      validator (value) {
        return ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'left', 'left-start', 'left-end', 'right', 'right-start', 'right-end'].includes(value)
      }
    },
    trigger: {
      type: String,
      default: 'click',
      validator (value) {
        return ['click', 'focus', 'hover', 'manual'].includes(value)
      }
    }
  },
  watch: {
    '$route' (val) {
      this.$destroy()
    }
  },
  created () {
    if (typeof window !== 'undefined') {
      document.addEventListener('keyup', this.keyPress)
    }
  },
  beforeDestroy () {
    if (typeof window !== 'undefined') {
      document.removeEventListener('keyup', this.keyPress)
    }
  },
  methods: {
    clickEvent () {
      this.$emit('click')
      if (this.popupData?.length) this.popup = !this.popup
    },
    keyPress (e) {
      if (this.popup && e.keyCode === 27) this.popup = false
    }
  },
  data () {
    return {
      popup: false
    }
  }
}
</script>
<style lang="scss" scoped>
  .button-popup {
    position: relative;
     .more-info-list {
      position: absolute;
      top: 110%;
      // left: 0;
      left: 50%;
      margin-top: 5px;
      // margin-left: -9px;
      padding: $gap-s;
      min-width: 100px;
      border-radius: $radius-r;
      transform: translateX(-50%);
      z-index: 10;
      &.dark {
        color: $white;
        background-color: #303133;
        box-shadow: 2.5px 4.3px 20px 0 rgba(255, 255, 255, 0.3);
      }
      &.light {
        color: $color-black;
        background-color: $white;
        box-shadow: 2.5px 4.3px 20px 0 rgba(34, 39, 43, 0.2);
      }
      > .more-info-item {
        line-height: 23px;
      }

      &::before {
        content: '';
        position: absolute;
        top: -4px;
        left: 50%;
        margin-left: -4px;
        width: 8px;
        height: 8px;
        background-color: inherit;
        transform: rotate(45deg);
      }
    }
  }
</style>
