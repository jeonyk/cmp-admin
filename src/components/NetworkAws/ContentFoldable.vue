<template>
  <div class="content-foldable">
    <div class="header">
      <div class="content-foldabler-header-container ">
        <strong
          class="content-foldable-title"
          style="font-size: 16px"
        >{{ title }}</strong>
        <span style="margin-left:10px; color: #727797">({{ this.$v('총') }} {{ length }} {{ this.$v('개') }})</span>
      </div>
      <div style="display:flex; align-items:center;">
        <p>{{ isShow ? this.$v('접기') : this.$v('펴기') }}</p>
        <a
          :class="['mdi', isShow ? 'mdi-chevron-up' : 'mdi-chevron-down']"
          @click="isShow = !isShow"
        />
      </div>
    </div>
    <div class="divider" />
    <template v-if="isShow">
      <transition name="slide">
        <div>
          <ul
            v-if="$slots.default"
          >
            <!-- style=" display:flex; gap:10px; flex-wrap:wrap;" -->
            <slot />
          </ul>
          <template v-else>
            <p class="empty-data">
              {{ $t('common.PLACEHOLDER.noData') }}
            </p>
          </template>
        </div>
      </transition>
    </template>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: 'Enter the title'
    },
    length: {
      type: Number,
      default: 0
    },
    data: {
      type: [Array],
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

<style lang="scss" scoped>
.content-foldable {
  .header {
    display:flex;
    justify-content:space-between;
    .content-foldabler-header-container{
      margin-left: 0px;
      padding-left: 0px;
      .content-foldable-title {
        margin-left: 0px;
      }
    }
  }
}

.divider {
  margin:10px  auto;
  border: 1px solid #3d435e;
}

.mdi {
   margin-right:20px;
}

.no-data {
  text-align:center;
  font-size:20px;
}

.empty-data {
  border-radius: 6px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $gap;
  margin-top: 0;
}
</style>
