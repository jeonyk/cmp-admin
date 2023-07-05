<template>
  <div class="content-board">
    <h2 class="title">
      <span>{{ title }}</span>
      <a
        v-if="isToggle"
        :class="['mdi', isShow ? 'mdi-chevron-up' : 'mdi-chevron-down']"
        style="margin-left: 8px;"
        @click="isShow = !isShow"
      />
    </h2>

    <transition name="slide">
      <section
        class="row"
        v-if="isShow"
      >
        <register-contents
          :key="vpc"
          v-for="(vpc,key) in data"
          :title="key"
        >
          {{ vpc }}
        </register-contents>
      </section>
    </transition>
  </div>
</template>

<script>
export default {
  created () {
  },
  props: {
    isToggle: {
      type: Boolean,
      default: true
    },
    title: {
      type: String,
      default: '기본 정보'
    },
    data: {
      type: Object,
      default: () => {}
    }
  },
  data () {
    return {
      isShow: true
    }
  }
}
</script>

<style scoped>
.title {
  /* margin-bottom:15px; */
  text-indent: 10px;;
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    font-size: 18px;
}
.row {
  width:100%;
  display:flex;
  flex-direction: row;
  flex-wrap:wrap;
}

 .slide-enter-active,
  .slide-leave-active {
    transition: all .3s ease;
  }
  .slide-enter, .slide-leave-to {
    transform: translateY(-0px);
    opacity: 0;
  }

</style>
<style lang="scss">
.content-board {

  .register-contents {
    width:50%;
    box-sizing: border-box;
  }

  .register-contents:first-child {
      border-top: 1px solid #2A2D44;
  }

  .register-contents:nth-child(2) {
      border-top: 1px solid #2A2D44;
  }

  .register-contents:nth-last-child(1):nth-child(odd) {
    width:100%;
  }
}

</style>
