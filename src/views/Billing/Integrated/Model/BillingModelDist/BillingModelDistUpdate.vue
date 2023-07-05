<template>
  <div
    v-loading="pageLoading || creating"
    class="dist-create"
  >
    <div class="dist-create-info">
      <div class="dist-create-info__header">
        <div class="heading">
          <h3>{{ $t('bill.distModelName') }}</h3>
          <span @click="resetDist">
            <refresh-icon
              :width="13"
              :height="13"
            />
            <span>
              {{ $t('common.BTN.reset') }}
            </span>
          </span>
        </div>
        <!-- <button
          class="button"
          type="is-primary"
          @click="activeFetchModal = true"
        >
          배부 모델 불러오기
        </button> -->
      </div>
      <div class="dist-create-info__name">
        <el-input
          v-model="modelName"
          :placeholder="$t('bill.MODEL.PLACEHOLDER.enterDistModelName')"
        />
        <div class="dist-create-info__name-button">
          <button
            class="button"
            type="is-anti"
            size="is-large"
            @click="$router.push({ name: 'nx-billing-model-dist' })"
          >
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button"
            type="is-primary"
            size="is-large"
            @click="updateDistModel"
          >
            {{ $t('common.BTN.modify') }}
          </button>
        </div>
      </div>
      <div class="dist-create-info__project">
        <billing-model
          :model-data="{ distributeProjects: commonProjects }"
          distribute-model
          is-apply-model
          is-detail
          @active-model="onChangeActiveModel"
          @expand-model="onExpandModel"
          @active-children-model="onChangeActiveChildrenModel"
        />
      </div>
    </div>
    <div class="dist-create-form">
      <distribute-create-form
        v-if="activeProject"
        ref="createForm"
        :active-project="activeProject"
        @sync-dist="syncDist"
      />
    </div>
    <!-- <fetch-billing-model
      distribute
      :active.sync="activeFetchModal"
      @close="activeFetchModal = false"
      @apply="copyModelGroup"
    /> -->
  </div>
</template>

<script>
import RefreshIcon from '@/components/Icons/RefreshIcon.vue'
import BillingModel from '@/components/Billing/BillingModel.vue'
import DistributeCreateForm from '@/components/Billing/Distribute/DistributeCreateForm.vue'
import { flatten } from 'lodash'
import DistMixins from '@/components/Billing/Distribute/DistMixins'
import API from '@sd-fe/cmp-core'

export default {
  name: 'BillingModelDistUpdate',
  mixins: [DistMixins],
  components: {
    RefreshIcon,
    BillingModel,
    DistributeCreateForm
  },
  async created () {
    await this.getDistModelDetail()
  },
  watch: {
    activeProject (project) {
      if (project) {
        if (this.copying || this.creating || this.pageLoading) return
        this.activeProjectGroups = []
        this.pageLoading = true
        Promise.all([
          // this.getCommonProjectGroup(project),
          this.getProjectInfo()
        ]).finally(() => {
          this.pageLoading = false
        })
      }
    }
  },
  methods: {
    onExpandModel (model, modelIdx, isApplyModel) {
      if (model.expanded) {
        model.expanded = false
        return
      }
      this.onChangeActiveModel(model, modelIdx, isApplyModel)
      model.expanded = true
    },
    /**
     * 프로젝트 정보 조회
     */
    async getProjectInfo () {
      try {
        const project = await API.iam.getProject({
          inCommon: true,
          isDeleted: false,
          isApprove: true,
          projectIdx: this.activeProject.projectIdx
        })
        if (project && project.length) {
          this.$set(this.activeProject, 'companyName', project[0].companyName)
          this.$set(this.activeProject, 'createTime', project[0].createTime)
        }
      } catch (error) {
        console.log(error)
      }
    },
    /**
     * 배부 모델 상세 조회 (수정 페이지용)
     */
    async getDistModelDetail () {
      try {
        this.pageLoading = true

        const { data: distModels } = await API.billing.getDistributeDetailModel(
          this.$route.params.id
        )

        this.updateModel = distModels
        this.updateModel.distributeProjects.forEach(project => {
          const oneDepth = project.distributeGroups
            .filter(group => !group.parentGroupName)
            .map(group => ({ ...group, companyName: group.groupName, isSecond: !group.groupIdx }))
          const distName = project.distributeStandardName

          // 2차 배부 관계사
          // parentGroupName이 존재하는 걸 찾음
          // 키를 다 찾고 중복 제거
          const isDepthArr = [...new Set(project.distributeGroups
            .filter(group => group.parentGroupName)
            .map(group => group.parentGroupName))]

          // 객체에 그룹 이름으로 child 추합
          // { 공통: [...] }
          const result = {}
          let twoDepth = []

          if (isDepthArr.length) {
            isDepthArr.forEach(groupName => {
              const items = project.distributeGroups.filter(
                group => group.parentGroupName === groupName
              )
              result[groupName] = {
                selected: items.map(item => ({
                  ...item,
                  companyName: item.groupName
                })),
                commonAffName: groupName,
                distName: items[0].distributeStandardName
              }
            })

            twoDepth = Object.keys(result).map(key => result[key])
          }

          if (twoDepth.length) {
            twoDepth.forEach(group => {
              // const uuid = uniqueId('billing_dist_update_')
              // group.uuid = uuid
              // oneDepth.push({
              //   amount: 1,
              //   companyName: group.commonAffName,
              //   distributeProjectId: null,
              //   distributeStandardName: null,
              //   groupIdx: null,
              //   groupName: group.commonAffName,
              //   id: group.id,
              //   parentGroupName: null,
              //   isSecond: true,
              //   uuid
              // })
            })
          }

          this.$set(project, 'distInfo', {
            distName,
            oneDepth,
            twoDepth
          })
        })
        this.commonProjects = [...this.updateModel.distributeProjects]
        this.commonProjects.forEach(project => {
          this.$set(project, 'active', false)
          this.$set(project, 'expanded', false)
          this.$set(project, 'expandable', true)
        })
        this.modelName = this.updateModel.name
        this.onChangeActiveModel(this.updateModel.distributeProjects[0])
      } catch (error) {
        console.log(error)
      } finally {
        this.pageLoading = false
      }
    },
    /**
     * 배부 모델 수정
     */
    async updateDistModel () {
      this.creating = true

      const oneDepth = this.$refs.createForm.selectedOneDepthAff
      const twoDepth = this.$refs.createForm.selectedTwoDepthAff
      const distName = this.$refs.createForm.rootDistName

      this.activeProject.distInfo = {
        oneDepth,
        twoDepth,
        distName
      }

      const reqObj = {
        id: this.updateModel.id,
        name: this.modelName,
        distributeProjects: this.commonProjects.map(project => {
          // 공통 관계사로 묶은 녀석들을 여기에 넣음
          let twoDepthGroup = []

          if (project.distInfo && project.distInfo.twoDepth) {
            const depth = project.distInfo.twoDepth
            const all = depth.map(group => {
              const temp = [...group.selected]
              return temp.map(t => ({
                amount: t.amount,
                groupIdx: t.groupIdx,
                groupName: t.companyName,
                distributeStandardName: group.distName,
                parentGroupName: group.commonAffName,
                id: t.id || null
              }))
            })
            twoDepthGroup = flatten(all)
          }

          let oneDepthGroup = []

          if (project.distInfo && project.distInfo.oneDepth) {
            oneDepthGroup = project.distInfo.oneDepth.map(group => ({
              groupIdx: group.groupIdx,
              groupName: group.companyName,
              amount: group.amount,
              id: group.id || null
            }))
          }

          const groups = [].concat(oneDepthGroup, twoDepthGroup)

          return {
            distributeGroups: groups,
            distributeStandardName: project.distInfo?.distName || '',
            projectIdx: project.projectIdx,
            projectName: project.projectName,
            id: project.id,
            modelId: project.modelId
          }
        })
      }

      // validate
      if (!this.validateDistModel(reqObj)) {
        this.creating = false
        return
      }

      try {
        await API.billing.updateDistModel(reqObj)
        this.$alert(this.$t('common.ALERT.BILL.056'), {
          callback: () => {
            this.$router.push({ name: 'nx-billing-model-dist-list' })
          }
        })
      } catch (error) {
        console.log(error)
        this.$alert(this.$t('common.ALERT.BILL.057'))
      } finally {
        this.creating = false
      }
    },
    /**
     * 공통 프로젝트의 관계사 조회
     */
    async getCommonProjectGroup (activeProject) {
      if (this.isCopied) return

      try {
        this.pageLoading = true

        const { data } = await API.billing.getDistributeGroup(
          this.activeProject.projectIdx
        )

        const recentAllGroup = data.filter(
          group => !group.parentGroupName && group.groupIdx !== 0
        )
        // const recentAllGroupIdx = recentAllGroup.map(group => group.groupIdx)

        // this.activeProject.distInfo = {
        //   ...this.activeProject.distInfo,
        //   oneDepth: (activeProject.distInfo || { oneDepth: [] }).oneDepth.filter(group =>
        //     recentAllGroupIdx.includes(group.groupIdx)
        //   )
        // }

        this.activeProject.distInfo.oneDepth = [
          ...this.activeProject.distInfo.oneDepth.filter(aff => !aff.distributeStandardName),
          ...this.activeProject.distInfo.twoDepth.map(aff => ({
            amount: 1,
            companyName: aff.commonAffName,
            distributeProjectId: null,
            distributeStandardName: aff.distName,
            groupIdx: 0,
            groupName: aff.commonAffName,
            id: null,
            isSecond: true,
            parentGroupName: null
          }))
        ]

        if (!this.activeProject.distInfo.oneDepth.length) {
          this.activeProject.distInfo.oneDepth = data.map(group => ({ ...group, companyName: group.groupName }))
        }

        this.$set(this.activeProject, 'distributeGroups', recentAllGroup)
        this.$refs.createForm.syncModel(this.activeProject, {})
      } catch (error) {
        console.log(error)
      } finally {
        this.pageLoading = false
      }
    }
  },
  data: () => ({
    modelName: '',
    activeFetchModal: false,
    commonProjects: [],
    pageLoading: true,
    activeProject: null,
    activeProjectGroups: [],
    copying: false,
    creating: false,
    updateModel: null
  })
}
</script>

<style lang="scss" scoped>
.dist-create {
  display: flex;
  flex-wrap: nowrap;
  width: 100%;

  &-info {
    flex: 0 0 385px;
    margin-right: 50px;
    min-height: 500px;

    &__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 15px;
      border-bottom: 1px solid $purple-gray;
      white-space: nowrap;

      .heading {
        > * {
          display: inline-block;
        }

        > h3 {
          font-size: 16px;
          font-weight: 700;
        }

        > span {
          color: $input-placeholder;
          font-size: 11px;
          font-weight: 400;
          margin-left: $gap-s;
          display: inline-block;
          vertical-align: middle;
          cursor: pointer;

          > span {
            position: relative;
            top: -3px;
            font-size: 11px;
            margin-left: 3px;
          }
        }
      }
    }

    &__name {
      padding: 15px 0;
      margin-bottom: 30px;

      &::v-deep {
        .el-input__inner {
          height: 44px;
        }
      }

      &-button {
        margin-top: $gap-s;
        display: flex;
        justify-content: space-between;

        > .button {
          width: 49%;
        }
      }
    }
  }

  &-form {
    width: 100%;
    position: relative;
    overflow: hidden;
  }
}
</style>
