<template>
  <div class="ti-dropdown-toggler">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'DropdownToggle',
  props: {
    triggerMode: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      required: true
    }
  },
  mounted () {
    this.bindEvent()
  },
  beforeDestroy () {
    this.unBindEvent()
  },
  computed: {
    eventName () {
      return this.triggerMode === 'click' ? 'click' : 'mouseleave'
    }
  },
  methods: {
    bindEvent () {
      if (this.triggerMode === 'click') {
        this.$el.addEventListener(this.triggerMode, this.clickEvent)
      } else {
        this.$parent.$el.addEventListener('mouseleave', this.mouseleaveEvent)
        this.$parent.$el.addEventListener('mouseenter', this.mouseoverEvent)
      }
      document.addEventListener(this.eventName, this.detectEventOnOutside)
    },
    unBindEvent () {
      if (this.triggerMode === 'click') {
        this.$el.removeEventListener(this.triggerMode, this.clickEvent)
      } else {
        this.$parent.$el.removeEventListener('mouseleave', this.mouseleaveEvent)
        this.$parent.$el.removeEventListener('mouseenter', this.mouseoverEvent)
      }
      document.removeEventListener(this.eventName, this.detectEventOnOutside)
    },
    clickEvent (e) {
      this.$emit('toggle', !this.active)
    },
    mouseoverEvent () {
      this.$emit('toggle', true)
    },
    mouseleaveEvent () {
      this.$emit('toggle', false)
    },
    detectEventOnOutside (e) {
      if (this.active && !this.$parent.$el.contains(e.target)) {
        this.$emit('toggle', false)
      }
    }
  }
}
</script>
