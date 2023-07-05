<!--
  * 파일명 : BillingModel.vue
  * 파일 기능 : [빌링 > 모델 > 과금모델] 적용 과금 모델/전체 과금 모델을 그립니다.
  * 작성자 : 이경환
  * 최종 작성일 : 2021-07-05
  * License By Shinsegae I&C
  * 빌링 과금 모델 2차 UI 적용중
 -->

<template>
  <div
    class="billing-model"
    :class="[
      isApplyModel ? 'is-apply' : 'no-apply',
      isOpenNoApplyModel && 'active',
      noScroll && 'no-scroll',
      rootClickable && 'root-clickable'
    ]"
    @click.stop.prevent="onClickRoot"
  >
    <div
      v-if="!isDetail"
      class="header"
    >
      <div
        v-if="!isApplyModel"
        class="open-icon"
      >
        <button
          class="button open-button"
          type="is-icon"
          @click.stop="handleOpenModel"
        >
          <i
            class="mdi"
            :class="isOpenNoApplyModel ? 'mdi-minus' : 'mdi-plus'"
          />
        </button>
      </div>
      <div class="title">
        <div class="model-name">
          {{ modelName }}
        </div>
        <div class="sub">
          <span class="is-billing">
            {{ $t('main.LAYOUT.bill') }} : {{ isBilling }} |
            <span class="billing-date">{{ billingDate }}</span>
          </span>
        </div>
      </div>
      <div
        v-if="billingType === 'd' && !modelData.confirm"
        class="icons"
      >
        <!-- <button
          v-if="(distributeModel ? !modelData.apply : true) && !noIcon"
          class="button"
          type="is-icon"
          @click="moveToEdit"
        >
          <i class="el-icon-edit edit-icon" />
        </button> -->
        <button
          v-if="!isApplyModel && !noIcon"
          class="button"
          type="is-icon"
          @click="$emit('delete-model-group', modelData)"
        >
          <i class="delete-icon" />
        </button>
        <button
          v-if="isApplyModel"
          class="button apply-btn"
          type="is-anti"
          size="is-mini"
        >
          Apply
        </button>
        <button
          v-else
          class="button apply-btn"
          type="is-anti"
          size="is-mini"
          @click="updateApply"
        >
          Apply
        </button>
        <!-- <button
          v-else-if="isIncludeNewProject"
          class="button apply-btn"
          type="is-anti"
          size="is-mini"
        >
          <span class="dot" />
          <span class="dot" />
          <span class="dot" />
          {{ $t('task.STATE.wait') }}
        </button> -->
      </div>
      <div
        v-else-if="billingType === 'b'"
        class="icons"
      >
        <button
          v-if="!noIcon && !modelData.confirm"
          class="button"
          type="is-icon"
          @click="moveToEdit"
        >
          <i class="el-icon-edit edit-icon" />
        </button>
        <button
          class="button apply-btn"
          type="is-anti"
          size="is-mini"
          @click="updateApply"
        >
          Apply
        </button>
      </div>
      <div
        v-else-if="billingType === 'c'"
        class="icons"
      >
        <button
          v-if="modelData.apply"
          class="button apply-btn"
          type="is-anti"
          size="is-mini"
        >
          Apply
        </button>
      </div>
    </div>
    <div
      v-if="isApplyModel || isOpenNoApplyModel"
      class="body tiny-scroll"
      :class="isDetail && 'only-body'"
    >
      <div
        v-for="(model, modelIdx) in models"
        :key="model.id"
        class="model-list"
        @click.stop="onClickModelItem(model, modelIdx)"
      >
        <div
          class="model-list-item"
          :class="model.active && 'active'"
        >
          <div class="model-list-item__wrapper">
            <div
              class="model-list-item__left"
            >
              <span class="model-list-item__left-icon">
                <i
                  v-if="!model.expanded"
                  class="el-icon el-icon-arrow-right"
                  @click.stop="$emit('expand-model', model, modelIdx, isApplyModel)"
                />
                <i
                  v-if="model.expandable && model.expanded"
                  class="el-icon el-icon-arrow-up"
                  @click.stop="$emit('expand-model', model, modelIdx, isApplyModel)"
                />
              </span>
              <span class="model-list-item__left-name">
                <template v-if="!distributeModel">
                  {{ modelTypeMap[model.type] }}
                </template>
                <template v-else>
                  {{ model.projectName }} <span
                    v-if="model.isNew || (model.distInfo ? (!model.distInfo.distName || !model.distInfo.oneDepth.length) : false)"
                    class="project-is-new"
                  >N</span>
                </template>
                <span v-if="model.expandable && !distributeModel">({{ model.models.length }})</span>
              </span>
            </div>
            <span
              v-if="isEdit && model.type === 2"
              class="model-list-item__right"
            >
              <div class="model-list-item__right-delete-icon">
                <button
                  class="button"
                  type="is-icon"
                  @click.stop="deleteModel(model)"
                >
                  <i class="delete-icon" />
                </button>
              </div>
            </span>
          </div>
          <div
            v-if="model.expandable && model.expanded"
            class="model-list-item__children"
          >
            <div
              v-for="item in !distributeModel ? model.models : model.distributeGroups.filter(group => !group.parentGroupName && group.groupIdx !== 0)"
              :key="item.id"
              class="model-list-item__children-item"
              :class="item.active && 'active'"
            >
              <div class="model-list-item__children-item-wrapper">
                <div
                  style="border-bottom: none;"
                  @click.stop="$emit('active-children-model', item, isApplyModel, model)"
                >
                  {{ !distributeModel ? item.companyName : item.groupName }}
                </div>
                <div
                  v-if="isEdit"
                  class="delete-icon"
                >
                  <button
                    class="button"
                    type="is-icon"
                    @click.stop="deleteModel(item)"
                  >
                    <i class="delete-icon" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Dayjs from 'dayjs'
import BillingModelMixins from '@/components/Billing/BillingModel.mixins'

export default {
  name: 'BillingModelListItem',
  mixins: [BillingModelMixins],
  props: {
    // 배부 모델에서 쓰입니까?
    distributeModel: {
      type: Boolean,
      default: false
    },
    modelData: {
      type: Object,
      required: true
    },
    isApplyModel: {
      type: Boolean,
      required: false,
      default: false
    },
    noApplyIndex: {
      type: Number,
      required: false,
      default: -1
    },
    // 수정 모드 여부
    isEdit: {
      type: Boolean
    },
    // 디테일 페이지 여부
    isDetail: {
      type: Boolean
    },
    // b, d, c
    // b: 과금
    // d: 배부
    // c: 보정
    billingType: {
      type: String,
      default: 'd',
      validator (value) {
        return ['b', 'd', 'c'].includes(value)
      }
    },
    noScroll: {
      type: Boolean,
      default: false
    },
    noIcon: {
      type: Boolean,
      default: false
    },
    initOpen: {
      type: Boolean,
      default: false
    },
    rootClickable: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    modelName () {
      return this.modelData.name
    },
    isBilling () {
      return this.modelData.confirm ? 'Y' : 'N'
    },
    billingDate () {
      return Dayjs(this.modelData.createTime).format('YYYY-MM-DD')
    },
    models () {
      return !this.distributeModel
        ? this.modelData.models
        : this.modelData.distributeProjects
    },
    isIncludeNewProject () {
      return !!this.models.filter(model => model.isNew).length
    },
    newProjectLength () {
      return !this.distributeModel ? null : this.models.filter(model => model.isNew).length
    }
  },
  created () {
    if (this.initOpen) this.handleOpenModel()
  },
  methods: {
    onClickRoot () {
      if (this.rootClickable) {
        this.$emit('all-expand')
        this.$emit('click-root', this.modelData)
        this.$nextTick(() => {
          this.isOpenNoApplyModel = true
        })
      }
    },
    updateApply () {
      this.$emit('update-apply', this.modelData)
    },
    moveToEdit () {
      if (!this.distributeModel) {
        this.$router.push({
          name: 'nx-billing-model-standard-new-detail',
          query: {
            isEdit: true,
            id: this.modelData.id
          }
        })
      } else {
        this.$router.push({
          name: 'nx-billing-model-dist-update',
          params: {
            id: this.modelData.id
          }
        })
      }
    },
    deleteModel (model) {
      this.$emit('delete-model', model)
    },
    handleOpenModel () {
      this.isOpenNoApplyModel = !this.isOpenNoApplyModel
      this.$emit('open-model', this.modelData)
    },
    onClickModelItem (model, modelIdx) {
      if (model.active) return

      this.$emit('all-expand')
      this.$emit(
        'active-model',
        model,
        modelIdx,
        this.isApplyModel,
        this.noApplyIndex
      )
      this.$nextTick(() => {
        this.isOpenNoApplyModel = true
      })
    }
  },
  data: (root) => ({
    activeBody: false,
    isOpenNoApplyModel: false
  })
}
</script>

<style lang="scss" scoped>
$card-padding: 20px;

.billing-model {
  &.root-clickable {
    cursor: pointer;
  }

  &:not(.no-scroll) {
    padding: 0 !important;

    & .header {
      padding: $card-padding;
    }

    &.no-apply {
      &.active {
        .body {
          border-top: 1px solid $dark-slate;

          &::-webkit-scrollbar-track {
            background-color: #353951;
          }

          &::-webkit-scrollbar-thumb {
            background-color: #727797;
          }
        }
      }
    }

    .body {
      max-height: 300px;
      overflow-y: auto;
      padding: 20px;
      border-top: 1px solid #d9d9d9;

      &::-webkit-scrollbar-track {
        background-color: $white;
        border-top-right-radius: $radius;
        border-bottom-right-radius: $radius;
      }

      &::-webkit-scrollbar-thumb {
        background-color: $dark-slate;
      }

      &:not(.only-body)::before {
        display: none;
        border: none !important;
      }
    }
  }

  &.no-scroll {
    .body {
      border-top: none;
      max-height: 500px;
    }
  }

  & .header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;

    & .title {
      line-height: 19px;

      & .model-name {
        font-size: 14px;
        font-weight: bold;
      }

      & .sub {
        font-size: 12px;
        color: #bbb;

        & .is-billing {
          color: $input-placeholder;

          & > .billing-date {
            font-weight: normal;
            color: #bbb;
          }
        }
      }
    }

    & .icons {
      margin-left: auto;

      & > .button {
        min-width: 26px;
      }

      & > * {
        display: inline-block;
        vertical-align: top;

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

        &.apply-btn {
          border-radius: 9999px;
          border-color: $main-blue;
          color: $main-blue;
        }
      }

      & > *:last-child {
        margin-left: 5px;
      }
    }
  }

  &.is-apply,
  &.no-apply {
    /* padding: $card-padding; */
    border-radius: $radius;
  }

  &.is-apply {
    background-color: $white;
    color: $color-black;

    & .body {
      & .model-list {
        &-item {
          &__children {
            :not(:last-of-type) {
              border-bottom: 1px dashed #e9e9e9;
            }
          }
        }
      }
    }
  }

  &.no-apply {
    background-color: $dark-navy;
    transition: background-color 250ms ease;
    will-change: background-color;
    color: $light-gray;
    font-weight: normal;
    font-size: 12px;
    color: $light-gray;

    & .header {
      & .open-icon {
        margin-right: 12px;

        & .open-button {
          padding: 10px;
          border: 1px solid $input-placeholder;
          border-radius: 2px;
          height: 14px;
          width: 14px;
          min-width: 0;

          &:hover {
            border: 1px solid $primary;
            color: $primary;
          }

          > i.mdi-plus {
            color: $input-placeholder;
          }
        }
      }

      & .title {
        & .model-name {
          font-size: 12px;
          font-weight: normal;
        }

        & .sub {
          color: $input-placeholder;

          & .is-billing {
            color: $input-placeholder;

            & .billing-date {
              color: $input-placeholder;
            }
          }
        }
      }
    }

    &.active {
      background-color: #353951;
      color: white; // TODO

      & .header {
        & .open-icon {
          & .open-button {
            border: none;
            background-color: rgba(114, 119, 151, 0.5);;

            &:hover {
              border: none;
              color: inherit;
              /* background-color: white; // TODO Hover minus icon */
            }

            > i.mdi-minus {
              color: #E1E1E1;
            }
          }
        }
      }

      & .body {
        &:not(.only-body)::before {
          border-top: 1px solid $dark-slate;
        }

        & .model-list {
          /* color: red; */
          color: $white;

          &:not(:last-child) {
            border-bottom: 1px solid $dark-slate;
          }

          &-item {
            &.active {
              /* color: $white; */
            }

            &__children {
              color: #bbb;

              :not(:last-child) {
                border-bottom-color: $dark-slate;
              }
            }
          }
        }
      }
    }

    & .icons {
      & > * {
        & .edit-icon,
        & .delete-icon {
          color: $input-placeholder;
        }

        &.apply-btn {
          border-radius: 9999px;
          border-color: $input-placeholder;
          color: $input-placeholder;
        }
      }
    }
  }

  & .body {
    color: $color-black;
    font-weight: normal;

    &:not(.only-body)::before {
      content: '';
      margin: $gap #{-$card-padding} $gap-s #{-$card-padding};
      border-top: 1px solid #d9d9d9;
      display: block;
      width: calc(100% + #{$card-padding * 2});
    }

    & .model-list {
      color: $color-black;
      padding: 10px 0;

      &:first-child {
        padding-top: 0;
        padding-bottom: $gap-s;
      }

      &:not(:last-child) {
        border-bottom: 1px solid #e9e9e9;
      }

      &:last-child {
        padding-bottom: 0;
      }

      &-item {
        &__wrapper {
          display: flex;
          justify-content: space-between;
        }

        &.active {
          color: $main-blue;
        }

        &__left {
          cursor: pointer;

          &-name {
            font-weight: 500;
          }

          &-icon {
            color: $slate;
            margin-right: 5px;

            & .el-icon {
              font-weight: 900;
            }
          }
        }

        &__right,
        &__children,
        &__children-item-wrapper {
          &-delete-icon,
          & .delete-icon {
            > button {
              height: 16px;
              position: relative;

              > .delete-icon {
                height: 16px;
              }
            }
          }
        }

        &__children {
          color: $color-grey;
          padding: 5px 0 0 23px;

          &-item {
            padding: 10px 0;
            font-size: 12px;

            &.active {
              color: $main-blue;
            }

            &-wrapper {
              display: flex;
              justify-content: space-between;

              > *:first-child {
                cursor: pointer;
              }
            }
          }

          :last-child {
            padding-bottom: 0;
          }

          :not(:last-of-type) {
            border-bottom: 1px dashed $dark-slate;
          }
        }
      }
    }
  }

  .project-is-new {
    font-size: 11px;
    padding: 1px 3px;
    box-sizing: border-box;
    text-align: center;
    color: $white;
    background-color: $main-blue;
    margin-left: 2px;
  }

  .apply-btn {
    .dot {
      width: 2px;
      height: 2px;
      border-radius: 9999px;
      display: inline-block;
      margin-right: 1px;
      vertical-align: middle;
      position: relative;
      top: -1px;
    }

    .dot:nth-of-type(1) {
      background-color: rgba(150, 163, 171, 0.4);
    }

    .dot:nth-of-type(2) {
      background-color: rgba(150, 163, 171, 0.7);
    }

    .dot:nth-of-type(3) {
      background-color: #96A3AB;
    }
  }
}
</style>
