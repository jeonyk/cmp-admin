<template>
  <!-- __selected -->
  <li
    @click="selectCard"
    :class="['board-item', {'__selected' : data.value === selectedCard}]"
  >
    <strong
      class="board-item-num"
      v-if="useIndex"
    >{{ index }}</strong>
    <div class="board-item-inner">
      <p class="board-item-name">
        {{ data.name }}
      </p>
      <i style="margin-right:20px;" />
    </div>
  </li>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      default: () => {}
    },
    index: {
      type: Number,
      default: 0
    },
    // 카드 앞 인덱스 사용 여부
    useIndex: {
      type: Boolean,
      default: true
    },
    selectedCard: {
      type: String,
      default: null
    }
  },
  methods: {
    selectCard () {
      this.$emit('selectCard', this.data.value)
    }
  }
}
</script>

<style lang="scss" scoped>
    .board-item {
      display: flex;
      height: 44px;
      margin-bottom: 10px;
      cursor:pointer;
      .board-item-num {
        width: 25px;
        line-height: 44px;
        text-align: left;
        color: #727797;
        box-sizing: border-box;
        padding: 0px;
        margin: 0px;
      }

      .board-item-inner {
        width: 100%;
        display: flex;
        align-items: center;
        background: #2a2d44;
        border-radius: 6px;
      }

      .board-item-name {
        width: 100%;
        line-height: 44px;
        text-indent: 20px;
        border-radius: 6px;

      }

      &.__selected {
        .board-item-inner {
          position: relative;
          background: #3e57c9;
        }
      }
    }
</style>
