<!-- 삭제 예정 -->

<template>
  <el-dialog
    :visible="active"
    @close="$emit('close')"
    @closed="$emit('closed')"
    :title="$t('bill.select2ndDistAff')"
  >
    <div class="select-aff">
      <div class="select-aff-form">
        <simple-form
          :title="$t('bill.commonAffName')"
          required
          small
          :width="100"
        >
          <el-input
            ref="commonAffName"
            v-model="commonAffName"
            :placeholder="$t('bill.MODEL.PLACEHOLDER.enterCommonAffName')"
          />
        </simple-form>
        <simple-form
          :title="$t('bill.distStandardName')"
          required
          small
          :width="100"
        >
          <el-input
            v-model="distName"
            :placeholder="$t('bill.MODEL.PLACEHOLDER.enterStdDistName')"
          />
        </simple-form>
      </div>
      <div class="select-aff-selected">
        <span class="selected-label">
          {{ $t('bill.selectedAff') }}
        </span>
        <div class="selected-aff">
          <div
            v-for="group in selected"
            :key="group.groupIdx"
          >
            <clearable-tag
              :content="group.companyName"
              :unique-key="group.groupIdx"
              @clear="clearTag"
            />
          </div>
        </div>
      </div>
      <div class="select-aff-list">
        <cmp-grid
          :columns="[
            { binding: 'companyName', header: '관계사', align: 'left' }
          ]"
          :item-source="selectedCompanyAtTwoDepthAff"
          selectable
          @selectedRow="selectedRow"
        />
      </div>
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="accept"
      >
        {{ $t('common.BTN.complete') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import SimpleForm from '@/components/Billing/Distribute/SimpleForm.vue'

export default {
  components: { SimpleForm },
  props: {
    active: {
      type: Boolean,
      default: false
    },
    oneDepthAff: {
      type: Array,
      required: true
    },
    twoDepthAffNames: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    active (visible) {
      if (!visible) {
        this.selected = []
        this.distName = ''
        this.commonAffName = ''
      }
    }
  },
  computed: {
    selectedCompanyAtTwoDepthAff () {
      return this.oneDepthAff
        .filter(group => {
          return (
            this.selected.findIndex(
              innerGroup => innerGroup.groupIdx === group.groupIdx
            ) === -1
          )
        })
        .map(group => ({
          groupIdx: group.groupIdx,
          companyName: group.companyName || group.groupName,
          amount: 1
        }))
        .filter(group => group.groupIdx !== null)
    }
  },
  methods: {
    selectedRow ({ dataItem }) {
      this.selected.push(dataItem)
    },
    clearTag (groupIdx) {
      this.selected = this.selected.filter(
        selectedGroup => selectedGroup.groupIdx !== groupIdx
      )
    },
    /**
     * 공통관계사 이름 중복확인
     * @param {String} inputedName 현재 인풋의 공통관계사 이름
     * @return {Boolean} 중복된 값이면 true, 그렇지 않으면 false
     */
    duplicateTitleCheck (inputedName) {
      return !!this.twoDepthAffNames.find(el => el === inputedName)
    },

    accept () {
      const isDuplicatedCommonComTitle = this.duplicateTitleCheck(this.commonAffName)

      if (!this.active) return

      if (!this.commonAffName) {
        return this.$alert(this.$t('bill.MODEL.PLACEHOLDER.enterCommonAffName'))
      }
      if (isDuplicatedCommonComTitle) {
        this.$alert(this.$t('common.ALERT.PROJECT.072')) // 중복된 공통관계사명입니다.
        return this.$refs.commonAffName.focus()
      }
      if (!this.distName) {
        return this.$alert(this.$t('bill.MODEL.PLACEHOLDER.enterStdDistName'))
      }

      if (!this.selected.length) {
        return this.$alert(this.$t('bill.MODEL.PLACEHOLDER.selectCommonAff'))
      }
      this.$emit('accept', this.selected, this.commonAffName, this.distName)
    }
  },
  data: () => ({
    selected: [],
    commonAffName: '',
    distName: ''
  })
}
</script>

<style lang="scss" scoped>
.select-aff {
  &-selected {
    margin-top: 30px;
    margin-bottom: $gap-s;
    display: flex;

    .selected-label {
      align-self: flex-start;
      padding-top: $gap-s;
      min-width: 70px;
    }

    .selected-aff {
      margin-left: $gap-s;
      display: inline-flex;
      flex-wrap: wrap;

      > div {
        margin-right: 5px;
      }
    }
  }

  &-list {
    max-height: 200px;
    overflow-y: auto;
  }
}
</style>
