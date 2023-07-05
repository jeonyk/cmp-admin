import Vue from 'vue'

export default Vue.extend({
  props: {
    width: {
      type: [Number, String],
      required: false,
      default: 15
    },
    height: {
      type: [Number, String],
      required: false,
      default: 15
    },
    iconColor: {
      type: String,
      default: 'currentColor'
    },
    isButton: {
      type: Boolean,
      required: false,
      default: false
    },
    addClass: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  mounted () {
    if (this.isButton) {
      this.$el.style.cursor = 'pointer'
      if (this.addClass) this.$el.classList.add('cmp-clickable-button')
      this.$el.addEventListener('click', this.clickEvent)
    }
  },
  beforeDestroy () {
    this.$el.removeEventListener('click', this.clickEvent)
  },
  methods: {
    clickEvent (event) {
      this.$emit('click', event)
    }
  }
})
