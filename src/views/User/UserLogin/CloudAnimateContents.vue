<!--
  * 파일명 : CloudAnimateContents.vue
  * 파일 기능 :
  * 작성자 : 정재은 외 1명
  * 최종 작성일 : 2020-12-15
  * License By Shinsegae I&C
  * 2020-12-15 Merge commit 'd503915ee56b582d5110b7315989488b57ed103c' into publish/network-create-update-temp
 -->

<template>
  <div
    class="cloud-animate-contents"
    ref="animateContents"
  >
    <section class="infra-wrap">
      <div class="cloud-setting">
        <i class="setting -purple move-object" />
        <i class="setting -mint move-object" />
        <div class="folder-icons">
          <span
            class="folders"
            ref="folders"
          >
            <i
              class="folder move-object"
              v-for="(item, idx) in 3"
              :key="idx"
              :style="`animation-delay: ${3*(idx+1)}s; animation-duration: ${1*(idx+2)}s;`"
            />
          </span>
          <span class="connecting-icon" />
        </div>
      </div>

      <div class="set-infra">
        <i
          class="round-outline move-object"
          v-for="(item,idx) in 3"
          :key="idx"
          :style="`animation-delay: ${1*(idx+1)}s;`"
        />
      </div>

      <div class="set-database">
        <i class="piechart" />
        <i class="piechart-piece move-object" />
      </div>

      <div class="set-storage">
        <i
          class="round-icon -mint move-object"
          v-for="(item, idx) in 4"
          :key="idx"
          :style="`animation-duration: ${3*(idx+1)}s;`"
        />
      </div>

      <div class="set-global">
        <span class="rotate-round move-object">

          <i class="round-icon -mint" />
          <i class="round-icon -mint" />
        </span>
        <i
          class="round-icon -purple"
          style="margin-left: -3px; left: 50%; top: 2px;"
        />
        <i
          class="round-icon -purple"
          style="margin-left: -3px; margin-top: 33px; left: 50%; bottom: 0;"
        />
      </div>
    </section>

    <transition name="fade">
      <section
        class="line-wrap"
        v-show="!afterView"
      >
        <span
          class="dotted-line -center"
          ref="connect"
        >
          <i
            class="dotted"
            v-for="(dot, idx) in 22"
            :key="idx"
            :style="`margin-top: 4px`"
          />
        </span>
        <span
          class="dotted-line -mini"
          style="transform: rotate(70deg); bottom: 50px; right: 313px;"
          ref="lefttop"
        >
          <i
            class="dotted"
            v-for="(dot, idx) in 21"
            :key="idx"
          />
        </span>
        <span
          class="dotted-line"
          style="transform: rotate(80deg); bottom: -20px; right: 285px;"
          ref="righttop"
        >
          <i
            class="dotted"
            v-for="(dot, idx) in 29"
            :key="idx"
          />
          <!-- :style="`margin-top: 2px`" -->
          <!-- :style="`margin-top: 4px`" -->
        </span>
        <span
          class="dotted-line -mini"
          style="transform: rotate(-70deg); bottom: 50px; left: 311px;"
          ref="leftbottom"
        >
          <i
            class="dotted"
            v-for="(dot, idx) in 21"
            :key="idx"
          />
        </span>
        <span
          class="dotted-line"
          style="transform: rotate(-80deg); bottom: -20px; left: 283px; "
          ref="rightbottom"
        >
          <i
            class="dotted"
            v-for="(dot, idx) in 29"
            :key="idx"
          />
        </span>
      </section>
    </transition>

    <section
      class="round-outline-wrap"
      v-show="afterView"
    />

    <section
      class="motion-wrap"
      :class="{'-after': afterView}"
    >
      <div
        class="note-book"
        :class="{'-after': afterView}"
      >
        <p
          class="monitor-logo-text"
          v-if="afterView"
        >
          <span>Spharos</span>
          <span>CMP</span>
        </p>
        <i
          class="monitor-setting"
          v-else
        />
      </div>
      <span class="hand" />
      <span class="touch" />
    </section>
  </div>
</template>
<script>
export default {
  name: 'CloudAnimateContents',
  mounted () {
    this.initAnimation()
  },
  methods: {
    initAnimation () {
      this.connectAnimation()
      this.activeMotionHistory()
      this.toggleActiveState('.monitor-logo-text', true)
    },
    activeMotionHistory () {
      this.toggleActiveState('.hand', true)
      setTimeout(() => {
        this.toggleActiveState('.touch', true)
      }, 800)
      setTimeout(() => this.toggleActiveState('.touch', false), 4000)

      setTimeout(() => this.toggleActiveState('.monitor-setting', true), 2000)
      setTimeout(() => {
        this.connectAnimation()
        this.toggleActiveState('.dotted-line', true)
      }, 3400)
      setTimeout(() => this.actionObjects(), 4400)

      setTimeout(() => {
        this.afterView = true
        this.toggleActiveState('.touch', true)
      }, 9600)
      setTimeout(() => {
        this.toggleActiveState('.round-outline-wrap', true)
        this.toggleActiveState('.monitor-logo-text', true)
      }, 10200)
    },
    setRandomAnimationDuration (el) {
      const node = this.$refs.animateContents
      const elements = node.querySelectorAll(el)
      if (!elements) return
      elements.forEach(element => {
        element.style.animationDuration = Math.floor(Math.random() * 10 + 1) + 's'
      })
    },
    actionObjects () {
      const elements = document.querySelectorAll('.move-object')
      elements.forEach(el => {
        el.classList.add('-active')
      })
    },
    /**
     * el 클래스 HTML 요소에 '-active' 를 추가할 것인지?
     */
    toggleActiveState (el, state) {
      const node = this.$refs?.animateContents
      if (!node) return
      const elements = node.querySelectorAll(el)
      if (!elements) return
      elements.forEach(element => {
        state ? element.classList.add('-active') : element.classList.remove('-active')
      })
    },
    setAfter () {
      this.afterView = true
      this.toggleActiveState('.touch', true)
    },
    /**
     * 애니메이션을 동작시킵니다.
     * @param {function} callback
     * @param {Number} time
     */
    trigger (callback, time) {
      setTimeout(() => {
        return callback
      }, time)
    },
    setInitState () {
      this.toggleActiveState('.-active', false)
      this.afterView = false
    },
    connectAnimation () {
      const dots = this.$refs.connect ? this.$refs?.connect.querySelectorAll('.dotted') : null
      if (!dots) return
      const reversed = [...dots].reverse()

      reversed.forEach((dot, idx) => {
        setTimeout(() => {
          dot.classList.add('-active')
        }, 3000 + idx * 80)
      })
      setTimeout(() => this.connectSideDotsAnimation(), 2000)
    },
    connectSideDotsAnimation () {
      const sideLists = ['leftbottom', 'lefttop', 'rightbottom', 'righttop']
      sideLists.forEach(side => {
        const dots = this.$refs[side]?.querySelectorAll('.dotted')
        if (!dots) return
        const reversed = [...dots].reverse()

        reversed.forEach((dot, idx) => {
          setTimeout(() => {
            dot.classList.add('-active')
          }, 3000 + idx * 80)
        })
      })
    }
  },
  data () {
    return {
      folders: [
        { idx: 1, active: false },
        { idx: 2, active: false },
        { idx: 3, active: false }
      ],
      afterView: false
    }
  }
}
</script>
<style lang="scss" scoped src="./CloudAnimateContents.scss" />
