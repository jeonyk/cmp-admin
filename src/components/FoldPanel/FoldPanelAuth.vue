<!--
  * 파일명 : FoldPanelAuth.vue
  * 파일 기능 : Foldable 패널
  * 작성자 : 이유준
  * 최종 작성일 : 2022-04-12
  * License By Shinsegae I&C
 -->

<template>
  <section
    :class="['fold-panel', {'-expand': !collapsed, '-selected': selected}]"
    :id="customId"
  >
    <label
      class="fold-header"
      @click="clickHeader"
    >

      <div class="header-left">
        <slot name="header-prefix" />
        <b class="header-title">
          <!-- v-else -->
          {{ title }}
        </b>
      </div>
      <!-- /.header-left -->

      <div class="header-right">
        <slot name="header-suffix" />
        <span class="expand-icon">
          <span
            id="btnCollapse"
            class="tree-is-child-icon -collapse"
            v-if="collapsed"
          >
            <i class="icon-horizon" />
            <i class="icon-verti" />
          </span>
          <span
            class="tree-is-child-icon -expand"
            v-else
          >
            <i class="icon-horizon" />
            <i class="icon-verti" />
          </span>
        </span>
      </div>
      <!-- /.header-right -->
    </label>
    <!--///////////////////// /.fold-header ///////////////////////////-->

    <transition
      name="slide"
      class="tiny-scroll"
    >
      <section
        class="fold-body tiny-scroll"
        v-show="!collapsed"
      >
        <slot />
      </section>
    </transition>
  </section>
</template>
<script>

export default {
  name: 'FoldPanel',
  props: {
    foldable: { // 접을 수 있는지?
      type: Boolean,
      default: true
    },
    isCollapsed: { // 접혔을 때 : true
      type: Boolean,
      default: false
    },
    customId: { // id를 지정
      type: String,
      default: null
    },
    title: { // 헤더 타이틀
      type: String,
      default: ''
    },
    groupIdx: { // 그룹 idx
      type: Number,
      default: null
    }
  },
  watch: {
    isCollapsed: {
      immediate: true,
      handler (state) {
        this.collapsed = state
      }
    }
  },
  methods: {
    clickHeader () {
      if (this.foldable) this.collapsed = !this.collapsed
      this.selected = !this.selected
      this.$emit('clickHeader', this.collapsed)
    },
    isInArea (el) {
      const elCustomId = document.querySelector(`#${this.customId}`)
      if (el === elCustomId) return true
      if (elCustomId) {
        const children = elCustomId.querySelector('*')
        for (const child of children) {
          if (el === child) return true
        }
      }
      return false
    }
  },
  data () {
    return {
      collapsed: true,
      selected: false
    }
  }
}
</script>
<style lang="scss" scoped>
  .fold-panel {
    color: inherit;
    box-sizing: border-box;
    width: 100%;
    padding:0px !important;
    transition: height 0.4s;
    > .fold-header {
      display: flex;
      flex-wrap: nowrap;
      width: 100%;
      box-sizing: border-box;
      position: relative;
      align-items: center;
      justify-content: space-between;
      border-radius: 0;
      padding: 14px $gap;
      font-size: 14px;
      background: #353951;
      cursor: pointer;
      border-top: 1px solid #2A2D44;
      > .header-left {
        display: flex;
        align-items: center;
        .header-title {
          white-space: nowrap;
          margin-left: $gap-s;
          color: inherit;
          font-weight: normal;
          &.ellipsis-wrap {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 128px;
            &.-wide {
              max-width: 155px;
            }
          }
        }
      }
      > .header-right {
        display: flex;
        align-items: center;
        margin-left: $gap;
      }
    }
    > .fold-body {
      border-bottom-left-radius: $radius;
      border-bottom-right-radius: $radius;
      max-height: 48vh;
      overflow-x: hidden;
      overflow-y: auto;

    }

    .slide-enter-active,
    .slide-leave-active {
      transition: opacity 0.4s, height 0.4s;
    }
    .slide-enter,
    .slide-leave-to {
      height: 0;
      opacity: 0;
    }
    .tree-is-child-icon { // 트리 expand 아이콘
      position: relative;
      display: block;
      width: 20px;
      height: 20px;
      border-radius: $radius-s;
      transition: all .2s;
      > i {
        display: block;
        position: absolute;
        top: 50%;
        left: 50%;
        width: 12px;
        height: 2px;
        transform: translate(-50%, -50%);
        background-color: #E1E1E1;
      }
      &.-expand {
        background-color: rgba(114, 119, 151, 0.5);
      }
      &.-collapse {
        border: 1px solid rgba(114, 119, 151);
        * {background-color: rgba(114, 119, 151);}
        > i.icon-verti {
          transform: translate(-50%, -50%) rotate(90deg);
        }
      }
    }
  }
</style>
