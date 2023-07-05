<template>
  <div class="create-form">
    <div class="create-form-header">
      {{ activeProject.projectName }}
    </div>
    <div class="create-form-summary">
      <distribute-summary
        v-if="activeProject"
        create-mode
        :detail-common-project="activeProject"
        @preview-rate="activeRatePreviewModal = true"
      />
    </div>
    <div class="create-form-input">
      <simple-form
        :title="$t('bill.distStandardName')"
        required
      >
        <el-input
          v-model="rootDistName"
          :placeholder="$t('bill.MODEL.PLACEHOLDER.enterDistStd')"
        />
      </simple-form>
      <simple-form
        v-if="selectedOneDepthAff"
        :title="$t('bill.dist1stAff')"
        required
        :class="'distance' && selectedOneDepthAff.length"
        :top-fixed="selectedOneDepthAff.length > 0"
      >
        <button
          class="button"
          type="is-primary"
          size="is-large"
          @click="activeSelectAffModal = true"
        >
          {{ $t('common.BTN.BILL.selectAff') }}
        </button>
        <div
          v-for="group in selectedOneDepthAff"
          :key="group.id || group.groupIdx"
          class="aff-input"
        >
          <el-input
            :value="group.companyName"
            disabled
          />
          <el-input-number
            v-model="group.amount"
            :min="1"
            :max="1000000000"
          />
          <trash-icon
            v-if="!group.isSecond && group.groupIdx"
            is-button
            @click="unSelectOneDepthAff(group)"
          />
        </div>
      </simple-form>
      <simple-form
        v-if="selectedTwoDepthAff"
        :title="$t('bill.dist2ndAff')"
        :summary="$t('bill.MODEL.PLACEHOLDER.select1stAff')"
        :class="'distance' && selectedOneDepthAff.length"
        :top-fixed="selectedTwoDepthAff.length > 0"
      >
        <button
          class="button"
          type="is-primary"
          size="is-large"
          @click="activeSelectAffTwoDepModal = true"
          :disabled="!selectedOneDepthAff.length"
        >
          {{ $t('common.BTN.BILL.selectAff') }}
        </button>
        <div
          v-for="(model, index) in selectedTwoDepthAff"
          class="two-depth"
          :key="index"
        >
          <div class="two-depth__header">
            <span>
              <strong>{{ model.commonAffName }}</strong> ({{ $t('bill.distStandard') }} :
              {{ model.distName || model.selected[0].distributeStandardName }})
            </span>
            <trash-icon
              is-button
              @click="deleteTwoDepth(index, model)"
            />
          </div>
          <div
            v-for="group in model.selected"
            :key="group.id || group.groupIdx"
            class="aff-input"
          >
            <el-input
              :value="group.companyName"
              disabled
            />
            <el-input-number
              v-model="group.amount"
              :min="1"
              :max="1000000000"
            />
          </div>
        </div>
      </simple-form>
    </div>
    <select-aff-modal
      :active.sync="activeSelectAffModal"
      :active-project="activeProject"
      :selected-aff="selectedOneDepthAff"
      :aff-list="affList"
      @accept="acceptAffModal"
      @close="activeSelectAffModal = false"
    />
    <select-aff-two-dep-modal
      :active.sync="activeSelectAffTwoDepModal"
      :one-depth-aff="selectedOneDepthAff"
      :two-depth-aff-names="selectedTwoDepthAffNames"
      @accept="acceptTwoDepthModal"
      @close="activeSelectAffTwoDepModal = false"
    />
    <rate-preview-modal
      :active.sync="activeRatePreviewModal"
      :one-depth-aff="selectedOneDepthAff"
      :two-depth-aff="selectedTwoDepthAff"
      @close="activeRatePreviewModal = false"
    />
  </div>
</template>

<script>
import DistributeSummary from '@/components/Billing/Distribute/DistributeSummary.vue'
import SimpleForm from '@/components/Billing/Distribute/SimpleForm.vue'
import SelectAffModal from '@/components/Billing/Distribute/SelectAffModal.vue'
import SelectAffTwoDepModal from '@/components/Billing/Distribute/SelectAffTwoDepModal.vue'
import TrashIcon from '@/components/Icons/TrashIcon.vue'
import RatePreviewModal from '@/components/Billing/Distribute/RatePreviewModal.vue'
import { cloneDeep, uniqueId, flatten } from 'lodash'
import API from '@sd-fe/cmp-core'

export default {
  name: 'DistributeCreateForm',
  components: {
    DistributeSummary,
    SimpleForm,
    SelectAffModal,
    SelectAffTwoDepModal,
    TrashIcon,
    RatePreviewModal
  },
  computed: {
    selectedTwoDepthAffNames () {
      return (this.selectedTwoDepthAff || []).map(el => el.commonAffName)
    }
  },
  props: {
    activeProject: {
      type: Object,
      default: null
    },
    autoSet: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    activeProject: {
      handler: 'syncModel',
      deep: true
    }
  },
  created () {
    if (this.activeProject.distInfo) {
      this.selectedOneDepthAff = cloneDeep(this.activeProject.distInfo.oneDepth) || []
      this.selectedTwoDepthAff = cloneDeep(this.activeProject.distInfo.twoDepth) || []
      this.rootDistName = cloneDeep(this.activeProject.distInfo.distName) || ''
    }
    this.getAllAff()

    if (this.autoSet) {
      const autoSetWatch = this.$watch(vm => vm.activeProject.distributeGroups, (groups) => {
        if (groups && groups.length) {
          this.selectedOneDepthAff = cloneDeep(groups.map(group => ({ ...group, companyName: group.groupName })))
          autoSetWatch()
        }
      })
    }
  },
  methods: {
    syncModel (newProject, oldProject) {
      if (newProject === oldProject || !oldProject) return
      this.$emit(
        'sync-dist',
        oldProject,
        cloneDeep(this.selectedOneDepthAff),
        cloneDeep(this.selectedTwoDepthAff),
        this.rootDistName
      )
      if (newProject.distInfo) {
        this.selectedOneDepthAff = cloneDeep(newProject.distInfo.oneDepth)
        this.selectedTwoDepthAff = cloneDeep(newProject.distInfo.twoDepth)
        this.rootDistName = cloneDeep(newProject.distInfo.distName)
      } else {
        this.selectedOneDepthAff = []
        this.selectedTwoDepthAff = []
        this.rootDistName = ''
      }
    },
    async getAllAff () {
      try {
        const res = await API.iam.getGroupList({ groupUpper: 0 })
        this.affList = res
      } catch (error) {
        this.$alert(this.$t('common.ALERT.BILL.061'))
      }
    },
    acceptAffModal (selected) {
      this.selectedOneDepthAff = [...selected, ...this.selectedOneDepthAff.filter(aff => aff.distributeStandardName)]
      this.activeSelectAffModal = false
      if (!this.selectedOneDepthAff.length) this.selectedTwoDepthAff = []
    },
    unSelectOneDepthAff (group) {
      if (this.selectedTwoDepthAff.length) {
        // 등록된 2차 배부 관계사를 모두 조회
        const twoDepths = flatten(this.selectedTwoDepthAff.map(depth => depth.selected))
        // groupIdx만 가져옴
        const twoDepthGroupIdxs = twoDepths.map(depth => depth.groupIdx)

        if (twoDepthGroupIdxs.includes(group.groupIdx)) {
          // groupIdx들 중에 삭제하려는 관계사가 포함될 경우
          this.$confirm('삭제하려는 관계사가 2차 배부 관계사에 포함되어 있습니다.<br>그래도 삭제하시겠습니까?<br>2차 배부 관계사에 선택된 ' + group.companyName + ' 관련 내용은 전부 삭제됩니다.', { dangerouslyUseHTMLString: true })
            .then(() => {
              const removeIdxs = []
              // 2차 배부 관계사에서 1차 배부 관계사를 모두 삭제
              this.selectedTwoDepthAff.forEach((depth, index) => {
                depth.selected = depth.selected.filter(innerGroup => innerGroup.groupIdx !== group.groupIdx)
                if (!depth.selected.length) {
                  // 2차 배부 관계사에서 1차 배부 관계사가 모두 삭제되어
                  // 0개가 되었을 경우 2차 배부 관계사를 삭제한다.
                  removeIdxs.push(depth.uuid)
                }
              })
              if (removeIdxs.length) removeIdxs.forEach(r => this.deleteTwoDepthByUuid(r, this.selectedTwoDepthAff.find(t => t.uuid === r)))
              // 1차 배부 관계사에서 삭제한다.
              this.selectedOneDepthAff = this.selectedOneDepthAff.filter(
                exist => exist.groupIdx !== group.groupIdx
              )
            })
            .catch(() => false)
        } else {
          this.selectedOneDepthAff = this.selectedOneDepthAff.filter(
            exist => exist.groupIdx !== group.groupIdx
          )
        }
        // 1차 배부 관계사 목록에서
        // 2차 배부 관계사로 묶은 공통 배부 관계사를 아이콘 클릭으로
        // 지울 경우 아래 로직 추가 필요
        // else if (group.groupIdx === 0) {
        //   this.selectedTwoDepthAff = this.selectedTwoDepthAff.filter(
        //     depth => depth.groupName !== group.groupName
        //   )
        //   this.selectedOneDepthAff = this.selectedOneDepthAff.filter(
        //     depth => (depth.groupName !== group.groupName) && (depth.groupIdx !== group.groupIdx)
        //   )
        // }
      } else {
        this.selectedOneDepthAff = this.selectedOneDepthAff.filter(
          exist => exist.groupIdx !== group.groupIdx
        )
      }
    },
    acceptTwoDepthModal (selected, commonAffName, distName) {
      // this.selectedTwoDepthAff = selected
      const uuid = uniqueId('second_dist_')
      this.selectedTwoDepthAff.push({ selected, commonAffName, distName, uuid })
      this.selectedOneDepthAff.push({
        amount: 1,
        companyName: commonAffName,
        distributeProjectId: this.activeProject.projectIdx,
        distributeStandardName: null,
        groupIdx: null,
        groupName: commonAffName,
        id: null,
        parentGroupName: null,
        isSecond: true,
        uuid
      })
      this.activeSelectAffTwoDepModal = false
    },
    deleteTwoDepth (index, model, twoDepth = this.selectedTwoDepthAff) {
      // const target = this.selectedTwoDepthAff[index]
      // this.selectedOneDepthAff = this.selectedOneDepthAff.filter(group => group.uuid !== target.uuid)
      const targetOne = this.selectedOneDepthAff.findIndex(tr => model.commonAffName === tr.groupName)
      this.selectedOneDepthAff.splice(targetOne, 1)
      twoDepth.splice(index, 1)
    },
    deleteTwoDepthByUuid (uuid, model) {
      const targetOne = this.selectedOneDepthAff.findIndex(tr => model.commonAffName === tr.groupName)
      this.selectedOneDepthAff.splice(targetOne, 1)
      this.selectedTwoDepthAff = this.selectedTwoDepthAff.filter(t => t.uuid !== uuid)
    },
    resetCreateForm () {
      this.rootDistName = ''
      this.selectedOneDepthAff = []
      this.selectedTwoDepthAff = []
    },
    copied () {
      this.rootDistName = cloneDeep(this.activeProject.distInfo.distName)
      this.selectedOneDepthAff = cloneDeep(this.activeProject.distInfo.oneDepth)
      this.selectedTwoDepthAff = cloneDeep(this.activeProject.distInfo.twoDepth)
    }
  },
  data: () => ({
    rootDistName: '',
    selectedOneDepthAff: [],
    selectedTwoDepthAff: [],
    activeSelectAffModal: false,
    activeSelectAffTwoDepModal: false,
    activeRatePreviewModal: false,
    affList: []
  })
}
</script>

<style lang="scss" scoped>
.create-form {
  &-header {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: $gap;
  }

  &-summary {
    margin-bottom: $gap;
  }

  &-input {
    .distance {
      .button {
        margin-bottom: $gap-s;
      }
    }

    .simple-form {
      &::v-deep {
        .el-input,
        .el-input .el-input__inner {
          width: 500px;
        }

        .el-input-number {
          width: 245px;

          .el-input,
          .el-input .el-input__inner {
            width: 245px;
          }
        }
      }
    }

    .aff-input {
      display: flex;
      align-items: center;
      margin: $gap-s 0;

      > * + * {
        margin-left: $gap-s;
      }

      > svg {
        position: relative;
        top: -2px;
      }
    }

    .two-depth {
      margin-top: $gap;

      &__header {
        padding-bottom: $gap-s;
        border-bottom: 1px solid $purple-gray;
        max-width: 790px;
        display: flex;
        justify-content: space-between;

        > svg {
          margin-right: 13px;
        }
      }
    }
  }
}
</style>
