<template>
  <article
    v-loading="$billBoard && $billBoard.billDataLoading"
    class="board"
    :class="{
      [boardType]: true,
      loading: $billBoard && $billBoard.billDataLoading
    }"
  >
    <section class="board-header">
      <div class="board-header-inner">
        <slot name="header" />
      </div>
    </section>
    <section class="board-body">
      <slot v-if="canDisplayBillingData" />
      <section
        v-else
        class="board-body-empty"
      >
        {{ placeholderText }}
      </section>
    </section>
  </article>
</template>

<script>
export default {
  name: 'PaymentBoard',
  inject: ['$bill', '$billBoard'],
  props: {
    boardType: {
      type: String,
      required: true,
      validator (value) {
        return ['nx', 'vmw', 'aws'].includes(value)
      }
    },
    moneyDisplayType: {
      type: String,
      default: 'won',
      validator (value) {
        return ['won', 'dollar'].includes(value)
      }
    }
  },
  computed: {
    /**
     * 빌링 데이터를 노출할 수 있는지 여부를 결정한다.
     */
    canDisplayBillingData () {
      if (
        !this.$bill ||
        !this.$bill.filterGroups ||
        !this.$bill.filterGroups.length
      ) {
        return false
      }
      if (
        !this.$billBoard ||
        !this.$billBoard.billData ||
        this.$billBoard.billDataLoading
      ) {
        return false
      }
      return true
    },
    /**
     * 데이터를 표시할 수 없을 때 placeholder 에 노출할 텍스트
     */
    placeholderText () {
      if (this.canDisplayBillingData) return ''
      if (!this.$bill || !this.$billBoard) return ''

      if (this.$billBoard.billDataLoading) {
        return '데이터 로딩중입니다.'
      } else if (!this.$bill.filterGroups.length) {
        return '관계사 또는 조직을 선택해주세요.'
      } else if (!this.$billBoard.billData) {
        return '데이터가 없습니다.'
      }

      return ''
    }
  }
}
</script>

<style lang="scss" scoped>
$nx-main-color: #4b7eff;
$nx-sub-color: #6a94ff;
$vmw-main-color: #84d631;
$vmw-sub-color: #bde297;
$aws-main-color: #ffae26;
$aws-sub-color: #ffc466;

.board {
  border-radius: 10px;
  box-sizing: border-box;
  background-color: #1f2341;
  box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.1);

  &.nx {
    .main-color {
      color: $nx-main-color;
    }
    .sub-color {
      color: $nx-sub-color;
    }

    .board-header {
      background: linear-gradient(270deg, #174489 -3.91%, #2378fa 101.74%);

      .badge-logo {
        width: 116px;
        height: 15px;
      }
    }
  }

  &.vmw {
    .main-color {
      color: $vmw-main-color;
    }
    .sub-color {
      color: $vmw-sub-color;
    }

    .board-header {
      background: linear-gradient(90deg, #a0f54a -1.09%, #5eab10 82.99%);

      &-inner {
        margin-right: 145px;
      }

      .badge-icon {
        background-blend-mode: overlay;
        mix-blend-mode: overlay;
      }

      .badge-logo {
        width: 99px;
        height: 15px;
      }
    }
  }

  &.aws {
    .main-color {
      color: $aws-main-color;
    }
    .sub-color {
      color: $aws-sub-color;
    }

    .board-header {
      background: linear-gradient(90deg, #ffbf43 -1.09%, #ff9900 82.99%);

      &-inner {
        margin-right: 120px;
      }

      .badge-icon {
        margin-right: 10px;
      }

      .badge-logo {
        width: 50px;
        height: 30px;
      }
    }
  }

  &-header {
    height: 60px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    overflow: hidden;

    &-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 100px;
    }
  }

  &-body {
    &-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 140px;
      color: #e1e1e1;
      font-size: 14px;
    }
  }
}
</style>
