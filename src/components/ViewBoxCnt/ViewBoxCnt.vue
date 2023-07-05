<!--
  * 파일명 : ViewBoxCnt.vue
  * 파일 기능 : [공통컴포넌트] 자원의 개수를 외부에서 받아 보여주는 스타일링된 컴포넌트입니다.
  * 작성자 : 정재은 외 1명
  * 최종 작성일 : 2020-12-15
  * License By Shinsegae I&C
  * 2020-12-15 Update: 테스트버그 수정중
 -->

<template>
  <section class="view-box-wrap">
    <!-- <el-popover
      :placement="popupPlacement"
      :trigger="hoverInfo.length > 0 ? actionType : null"
      :width="100"
      :popper-class="type === 'is-black'? 'dark' : 'light'"
    >
      <div class="view-box-cnt">
        <a class="view-box">
          <span :class="['box-icon', type === 'is-black'? '' : '-reverse']" />
          <span class="view-cnt">
            <slot />
          </span>
        </a>
      </div>
      <template #content>
        <ul class="more-info-list">
          <li
            class="more-info-item"
            v-for="(item, idx) in hoverInfo"
            :key="idx"
          >
            <slot
              name="hoverItem"
              :item="item"
            >
              {{ item.label }}
            </slot>
          </li>
        </ul>
      </template>
    </el-popover> -->

    <el-tooltip
      v-if="actionType==='hover' && hoverInfo.length > 0"
      effect="light"
    >
      <div class="view-box-cnt">
        <a class="view-box">
          <span :class="['box-icon', type === 'is-black'? '' : '-reverse']" />
          <span class="view-cnt">
            <slot />
          </span>
        </a>
      </div>
      <template #content>
        <ul class="more-info-list">
          <li
            class="more-info-item"
            v-for="(item, idx) in hoverInfo"
            :key="idx"
          >
            <slot
              name="hoverItem"
              :item="item"
            >
              {{ item.label }}
            </slot>
          </li>
        </ul>
      </template>
    </el-tooltip>

    <div
      class="view-box-cnt"
      v-else
    >
      <a
        class="view-box"
        @click.stop="clickEvent"
      >
        <span :class="['box-icon', type === 'is-black'? '' : '-reverse']" />
        <span class="view-cnt">
          <slot />
        </span>
      </a>

      <transition name="fade">
        <ul
          class="more-info-list"
          v-if="moreInfo"
        >
          <li
            class="more-info-item"
            v-for="(item, idx) in hoverInfo"
            :key="idx"
          >
            <slot
              name="hoverItem"
              :item="item"
            >
              {{ item.label }}
            </slot>
          </li>

          <li class="close-button">
            <i
              class="mdi mdi-close"
              style="color: #fff;"
              size="is-small"
              @click="moreInfo = false"
            />
          </li>
        </ul>
      </transition>
    </div>
  </section>
</template>
<script>
export default {
  name: 'ViewBoxCnt',
  props: {
    type: {
      type: String,
      default: 'is-black',
      validator (value) {
        return ['is-black', 'is-white'].includes(value)
      }
    },
    hoverInfo: {
      type: Array,
      default: () => []
    },
    useMoreInfo: {
      type: Boolean,
      default: true
    },
    actionType: { // hover,click
      type: String,
      default: 'click'
    },
    popupPlacement: { // 팝업의 위치
      type: String,
      default: 'bottom',
      validator (value) {
        return ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'left', 'left-start', 'left-end', 'right', 'right-start', 'right-end'].includes(value)
      }
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
      if (this.hoverInfo.length && this.useMoreInfo) this.moreInfo = !this.moreInfo
    },
    keyPress (e) {
      if (this.moreInfo && e.keyCode === 27) this.moreInfo = false
    }
  },
  data () {
    return {
      moreInfo: false
    }
  }
}
</script>
<style lang="scss" scoped>
  .view-box {
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    font-size: 11px;
    color: inherit;
    // padding-right: 9px;
    > .box-icon {
      display: inline-block;
      // margin-left: 5px;
      width: 17px;
      height: 17px;
      background-position: center;
      background-size: contain;
      background-repeat: no-repeat;
      background-image: url('../../assets/images/box_ico.png');
      transition: all .2s;
      &.-reverse {
        -webkit-filter: invert(100%);
        filter: invert(100%);
      }
    }
    > .view-cnt {
      position: absolute;
      top: -9px;
      left: 50%;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: $main-red;
      color: $white;
      font-size: 12px;
      text-align: center;
      line-height: 20px;
    }
  }
  .view-box-cnt {
    position: relative;
    > .more-info-list {
      position: absolute;
      top: 100%;
      left: 50%;
      margin-top: 5px;
      margin-left: -9px;
      padding: $gap-s;
      background-color: #fff;
      border-radius: $radius-r;
      z-index: 10;
      box-shadow: 2.5px 4.3px 20px 0 rgba(34, 39, 43, 0.2);
      > .more-info-item {
        color: $color-black;
        line-height: 23px;
      }
      > .close-button {
        position: absolute;
        top: -2px;
        right: -$gap;
        cursor: pointer;
      }
    }

    .fade-enter-active, .fade-leave-active {
      transition: opacity .2s;
    }
    .fade-enter, .fade-leave-to {
      opacity: 0;
    }
  }
</style>
