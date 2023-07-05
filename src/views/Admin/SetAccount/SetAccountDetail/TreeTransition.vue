<template>
  <transition
    @enter="enter"
    @leave="leave"
    @beforeEnter="beforeEnter"
  >
    <slot />
  </transition>
</template>

<script>
export default {
  name: 'TreeTransition',
  props: {
    height: {
      type: [Number, String],
      default: 250
    }
  },
  watch: {
    height (height) {
      this.$nextTick(() => {
        if (this.$el.nodeType !== Node.COMMENT_NODE) {
          this.beforeEnter(this.$el)
          this.enter(this.$el)
        }
      })
    }
  },
  methods: {
    // -----------------
    // --- animation ---
    // -----------------
    beforeEnter (el) {
      const targets = el
      this.$anime.timeline().add({ targets, easing: 'easeOutExpo', height: 0 })
    },
    enter (el) {
      const targets = el
      this.$anime.timeline().add({ targets, easing: 'easeOutExpo', height: this.height })
    },
    leave (el, done) {
      const targets = el
      this.$anime.timeline().add({ targets, easing: 'easeOutExpo', height: 0, complete: () => done() })
    }
  },
  data () {
    return {
      done: null
    }
  }
}
</script>
