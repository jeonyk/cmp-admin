<!--
  * 파일명 : FoldPanel.vue
  * 파일 기능 : Foldable 패널
  * 작성자 : 김예담
  * 최종 작성일 : 2021-08-19
  * License By Shinsegae I&C
 -->

<template>
  <section
    :class="['fold-panel', {'-expand': !collapsed}]"
    :id="customId"
  >
    <!-- @click.stop="useSelection?selectHeader(data):clickHeader()" -->
    <div
      class="fold-header"
      @click.stop="useSelection?selectHeader(data):clickHeader()"
    >
      <div class="header-left">
        <slot name="header-prefix" />
        <el-checkbox
          v-if="useCheckbox"
          v-model="isChecked"
          @click.native="(e) => e.stopPropagation()"
          @change="() => {
            $emit('check', isChecked)
            $forceUpdate()
          }"
          style="margin-right: 10px; height: 20px;"
        />
        <!-- <span class="expand-icon">
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
        </span> -->

        <slot name="header">
          <span class="expand-icon">
            <span
              id="btnCollapse"
              class="tree-is-child-icon -collapse"
              v-if="collapsed"
              @click.stop="useSelection?clickHeader():null"
            >
              <i class="icon-horizon" />
              <i class="icon-verti" />
            </span>
            <span
              class="tree-is-child-icon -expand"
              v-else
              @click.stop="useSelection?clickHeader():null"
            >
              <i class="icon-horizon" />
              <i class="icon-verti" />
            </span>
          </span>

          <!-- <el-tooltip
          v-if="foldable ? title.length > 12 : title.length > 15"
          :content="title"
          placement="top"
          effect="light"
        >
          <span
            class="header-title ellipsis-wrap"
            :class="{'-wide': !foldable}"
          >
            {{ title }}
          </span>
        </el-tooltip> -->
          <b
            :class="['header-title', selected ? '-selected' : '']"
          >
            {{ title }} <i class="mdi-check" v-show="selected" />
          <!-- v-else -->
          </b>
        </slot>
      </div>
      <!-- /.header-left -->

      <div class="header-right">
        <slot
          name="header-suffix"
          :isCollapsed="collapsed"
          :isFoldable="foldable"
        />
        <!-- <a
          v-if="foldable"
          class="mdi"
          :class="[collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up']"
        /> -->
      </div>
      <!-- /.header-right -->
    </div>
    <!--///////////////////// /.fold-header ///////////////////////////-->

    <transition
      name="slide"
      @before-enter="beforeEnter"
      @enter="enter"
      @after-enter="afterEnter"
      @before-leave="beforeLeave"
      @leave="leave"
      @after-leave="afterLeave"
    >
      <section
        class="fold-body tiny-scroll"
        v-if="!collapsed"
      >
        <slot />
      </section>
    </transition>
  </section>
</template>
<script>

export default {
  name: 'FoldPanel',
  components: {
  },
  props: {
    foldable: { // 접을 수 있는지?
      type: Boolean,
      default: true
    },
    isCollapsed: { // 접혔을 때 : true
      type: Boolean,
      default: true
    },
    useSelection: {
      type: Boolean,
      default: false
    },
    onlySelectables: {
      type: Boolean,
      default: false
    },
    initSelection: {
      type: Boolean,
      default: false
    },
    customId: { // id를 지정
      type: Number,
      default: null
    },
    title: { // 헤더 타이틀
      type: String,
      default: ''
    },
    data: {
      type: Object,
      default: null
    },
    groupIdx: { // 그룹 idx
      type: Number,
      default: null
    },
    useCheckbox: {
      type: Boolean,
      default: false
    },
    checked: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    isCollapsed: {
      immediate: true,
      handler (state) {
        this.collapsed = state
      }
    },
    initSelection: {
      handler (initSelection) {
        this.init(initSelection)
      }
    },
    checked: {
      handler (state) {
        this.isChecked = state
      }
    }
  },
  methods: {
    init (inited) {
      // console.log('Tree.inited:', this.data, inited)
      // inited = false
      if (inited) {
        const elements = document.querySelectorAll('.header-left .-selected')
        elements.forEach((element) => {
          element.classList.remove('-selected')
        })
        this.selected = false
        this.selection = null
        this.$emit('selected', null)
      }
      // this.$forceUpdate()
    },
    selectHeader (data) {
      // if (this.data.selectable) {
      if (this.selected) {
        this.selection = null; this.selected = false
      } else {
        this.selection = data; this.selected = true
      }
      // console.log('selection:', this.selection?.groupIdx)
      this.$emit('selected', this.data)
      // }
    },
    clickHeader () {
      if (this.foldable) this.collapsed = !this.collapsed
      // this.selected = !this.selected
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
    },
    // 트랜지션
    beforeEnter (element) {
      requestAnimationFrame(() => {
        if (!element.style.height) element.style.height = '0px'

        element.style.display = null
      })
    },
    /**
     * @param {HTMLElement} element
     */
    enter (element) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          element.style.height = `${element.scrollHeight - 30}px`
        })
      })
    },
    /**
     * @param {HTMLElement} element
     */
    afterEnter (element) {
      element.style.height = null
    },
    /**
     * @param {HTMLElement} element
     */
    beforeLeave (element) {
      requestAnimationFrame(() => {
        if (!element.style.height) element.style.height = `${element.offsetHeight - 30}px`
      })
    },
    /**
     * @param {HTMLElement} element
     */
    leave (element) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          element.style.height = '0px'
        })
      })
    },
    /**
     * @param {HTMLElement} element
     */
    afterLeave (element) {
      element.style.height = null
    }

  },
  data () {
    return {
      collapsed: true,
      isChecked: false,
      selected: false,
      selection: null
    }
  }
}
</script>
<style lang="scss" scoped>
  .fold-panel {
    color: inherit;
    transition: all .3s;
    border-radius: $radius;
    border: 1px solid #3D435E;
    &.-expand {
      > .fold-header {
        background: #353951;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        border-top-left-radius: $radius;
        border-top-right-radius: $radius;
      }
      > .fold-body {
        background: #353951;
      }
    }
    &.-selected {
      .header-title {
        color: #7681FF !important;
        text-decoration: underline;
        text-underline-offset: 0.3em;
      }
    }
    > .fold-header {
      display: flex;
      flex-wrap: nowrap;
      position: relative;
      align-items: center;
      justify-content: space-between;
      border-radius: $radius;
      padding: 14px $gap;
      font-size: 14px;
      cursor: pointer;
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
          &.-selected {
            color: #7681FF !important;
            text-decoration: underline;
            text-underline-offset: 0.3em;
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
      // overflow-y: auto;
      overflow: hidden;
      padding: $gap-s $gap $gap-s 49px;
      border-bottom-left-radius: $radius;
      border-bottom-right-radius: $radius;
      border-top: 1px solid #2A2D44;
    }

    .slide-enter-active,
    .slide-leave-active {
      transition: all .2s;
    }
    .slide-enter,
    .slide-leave-to {
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
        transition: all .2s;
      }
      &.-expand {
        background-color: rgba(114, 119, 151, 0.5);
      }
      &.-collapse {
        border: 1px solid $input-stroke;
        * {background-color: $input-stroke;}
        > i.icon-verti {
          transform: translate(-50%, -50%) rotate(90deg);
        }
      }
    }

    .mdi-check {
      color: #d95252;
      margin: -12px 0 0 5px;
      height: 16px;
    }
    .mdi-check:before {
      display: inline-block;
      font: normal normal normal 24px/1 "Material Design Icons";
      font-size: inherit;
    }
  }
</style>
