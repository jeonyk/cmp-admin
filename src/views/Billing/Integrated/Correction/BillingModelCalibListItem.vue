<template>
  <div
    @click="$emit('click')"
    class="billing-model-calib-list-item list-item"
    :class="{'list-item__selected': thisModelIdx === selectedIdx}"
  >
    <div class="list-item-text">
      <h3 class="list-item-text__title">
        {{ modelData.name }}
      </h3>
      <P class="list-item-text__sub">
        {{ $v('빌링여부') }} : {{ modelData.deleteAble ? 'N' : 'Y' }} | {{ displayCreateDate }}
      </P>
    </div>
    <!-- 아이콘 -->
    <div
      v-if="modifiable && modelData.deleteAble"
      class="icons"
    >
      <button
        class="button"
        type="is-icon"
        @click="onUpdateModel"
      >
        <i class="el-icon-edit edit-icon" />
      </button>
      <button
        class="button"
        type="is-icon"
        @click="onDeleteModel"
      >
        <i class="delete-icon" />
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  props: {
    modelType: {
      type: String,
      default: 'server'
    },
    modifiable: {
      type: Boolean,
      default: true
    },
    modelData: {
      type: Object,
      default () {
        return {}
      }
    },
    selectedIdx: {
      type: Number,
      default: 0
    },
    thisModelIdx: {
      type: Number,
      default: 0
    }
  },
  computed: {
    ...mapGetters({
      shortlyCloud: 'cloud/getShortlyCloud'
    }),
    number () {
      return this.modelDate?.updateDate
    },
    displayCreateDate () {
      return this.$options.filters.date(this.modelData?.createDate, 'YYYY-MM-DD') || '-'
    }
  },
  methods: {
    onUpdateModel () {
      if (this.modelType === 'server') {
        this.$router.push({ name: 'nx-billing-model-calibration-server-create', query: { edit: true, id: this.modelData.id } })
      } else {
        this.$router.push({ name: 'nx-billing-model-calibration-company-create', query: { edit: true, id: this.modelData.id } })
      }
    },
    onDeleteModel () {
      this.$confirm(this.$v('보정 모델을 삭제하시겠습니까?'))
        .then(() => {
          this.$emit('delete-model-group', this.modelData)
        })
        .catch(() => false)
    }
  }
}
</script>

<style lang="scss" scoped>
.billing-model-calib-list-item {
  &.list-item {
    cursor: pointer;;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    padding: 24px;
    width: 385px;
    height: 78px;
    line-height: 20px;
    border-radius: 4px;
    background-color: #0A0C20;

    margin-bottom:8px;
    &.list-item__selected {
      background-color: #353951;
    }
    .list-item-text {
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100%;
      .list-item-text__title {
        display: inline-flex;
        font-weight: 300 !important;
        color: white;
      }
      .list-item-text__sub {
        display: inline-flex;
        color: #727797;
      }
    }
    & .icons {
      display: inline-flex;
      margin-left: auto;

      & > .button {
        display: flex;
        justify-items: center;
      }

      & > * {
        & .edit-icon,
        & .delete-icon {
          font-size: 18px;
          height: 18px;
          vertical-align: top;
          color: $slate;

          &:hover {
            color: inherit;
          }
        }
      }

      & > *:last-child {
        margin-left: 5px;
      }
    }
  }
}
</style>
