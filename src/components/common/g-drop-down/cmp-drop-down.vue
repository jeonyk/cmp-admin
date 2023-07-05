<!--
  * 파일명 : cmp-drop-down.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-12-19
  * License By Shinsegae I&C
  * 2020-12-19 fix: 업무>확인사항 틀어짐 css 수정
 -->

<template>
  <section
    class="cmp-drop-down"
    v-if="isActive"
  >
    <div
      class="cmp-dropdown-wrapper"
      :style="`right: ${right}; width: ${width}`"
      @click.stop="e => e.preventDefault()"
    >
      <span
        class="dropdown-title"
        v-if="title"
      >{{ title }}</span>

      <div
        :id="customId"
        :class="[{ '-opened': openStatus }, 'contents', 'tiny-scroll']"
      >
        <slot />
      </div>

      <slot name="footer" />
    </div>

    <a
      :class="['close-button', { '-inner': innerCloseBtn }]"
      @click.stop="close"
      :style="`right: calc(${right} + 30px);`"
    >
      <i
        v-if="innerCloseBtn"
        class="mdi mdi-close"
      />
      <i
        v-else
        class="close-icon"
      />
    </a>
  </section>
</template>

<script>
export default {
  name: 'CMPDropDown',
  props: {
    // 모달 active sync
    active: {
      type: Boolean,
      default: false
    },
    openStatus: {
      type: Boolean,
      default: false
    },
    customId: { // id를 지정합니다. - 필수
      type: String,
      default: null,
      required: true
    },
    right: {
      type: String,
      default: '0'
    },
    width: {
      type: String,
      default: '500px'
    },
    transitionStyle: { // ['dropped', 'fade']
      type: String,
      default: 'dropped'
    },
    title: {
      type: String,
      default: ''
    },
    innerCloseBtn: { // x 버튼 내부/외부 위치 입력
      type: Boolean,
      default: false
    }
  },
  watch: {
    active (newval) {
      this.isActive = newval

      if (newval) {
        document.addEventListener('click', this.clickElements)
        document.addEventListener('keyup', this.keyPress)
      } else {
        document.removeEventListener('click', this.clickElements)
        document.removeEventListener('keyup', this.keyPress)
      }
    },
    isActive (newval) {
      this.active = newval
    }
  },
  methods: {
    /**
     * 버튼으로 등록된 요소를 클릭하면 열립니다..
     * 사용 방법 ::
     * 외부에서 버튼을 사용하기 위해서는 ref가 필요합니다.
     * trigger 할 버튼에 cmp-drop-down의 custum id와 동일한 ref를 설정하면
     * 해당 창 외에 모든 창이 닫힙니다.
     */
    clickElements (e) {
      e.stopPropagation()
      // console.log(this.isInDropdown(e.target))
      if (!this.isInDropdown(e.target)) this.close()
    },
    isInDropdown (target) {
      const el = document.querySelector(`#${this.customId}`)
      const triggerBtn = this.$parent.$refs[this.customId]
      const triggerBtnChildren = triggerBtn ? triggerBtn.querySelectorAll('*') : null
      const children = el?.querySelectorAll('*')

      const isChildren = (element) => Array.from(element).some(child => target === child)

      // target button이거나 해당 버튼 내부 요소를 클릭한 경우
      if (triggerBtn && triggerBtnChildren &&
      (target === triggerBtn || isChildren(triggerBtnChildren))) return true
      if (el) {
        if (target === el) return true
        return isChildren(children)
      }
      return false
    },
    close () {
      this.isActive = false
      this.$emit('close')
    },
    /**
    * 'ESC' 키 눌렀을 때 모달 창 닫힘
    */
    keyPress (e) {
      if (this.isActive && e.keyCode === 27) this.close()
    }

  },
  destroyed () {
    document.removeEventListener('click', this.clickElements)
    if (typeof window !== 'undefined') {
      document.removeEventListener('keyup', this.keyPress)
      document.removeEventListener('click', this.clickElements)
    }
  },
  data () {
    return {
      isActive: this.active || false,
      dropTrigger: null
    }
  }
}
</script>

<style lang="scss" scoped>
.cmp-drop-down {
  position: relative;
  padding-right: $gap-m;
  cursor: auto;

  .cmp-dropdown-wrapper {
    top: calc(100% + 10px);
    border-radius: $radius;
    position: absolute;
    overflow-y: auto;
    z-index: 5;
    max-width: 310px;
    color: #333;
    height: auto;
    background: #f0f0f0;
    right: 0;
    box-shadow: 2.5px 4.3px 20px 0 rgba(34, 39, 43, 0.2);

    .dropdown-title {
      position: absolute;
      top: 0; left: 0;
      display: block;
      width: auto;
      padding: $gap $gap-m;
      font-size: 16px;
      color: $color-black;
      font-weight: bold;
    }

    .contents {
      overflow-y: auto;
    }
  }

  .close-button {
    position: absolute;
    display: block;
    width: 20px;
    height: 20px;
    top: $gap-s;
    right: -$gap-s;
    z-index: 11;
    > .close-icon {
      display: inline-block;
      margin-right: $gap-s;
      width: 20px;
      height: 20px;
      background-position: center;
      background-size: contain;
      background-repeat: no-repeat;
      background-image: url('../../../assets/images/icon-close@3x.png');
    }
    .mdi-close {
      color: $white;
    }
    &.-inner {
      right: $gap;
      top: $gap-m;
      .mdi-close {
        color: $text-black;
        width: $gap;
        height: $gap;
        font-size: $gap-m;
        display: block;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        &::before {
          line-height: 1;
        }
      }
    }
  }
}

.dropped-enter-active, .dropped-leave-active {
  transition: all 0 ease;
}
.dropped-enter, .dropped-leave-to {
  height: 0;
}

.fade-enter-active, .fade-leave-active {
  // transition: all .3s ease;
}
.fade-enter, .fade-leave-to {
  // opacity: 0;
}
</style>
