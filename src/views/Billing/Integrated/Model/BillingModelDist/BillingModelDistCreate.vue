<template>
  <div
    v-loading="pageLoading || creating"
    class="dist-create"
    :class="{ [$i18n.locale]: true }"
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
        <button
          class="button"
          type="is-primary"
          @click="activeFetchModal = true"
        >
          {{ $t('bill.fetchDistModel') }}
        </button>
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
            @click="$router.push({ name: 'nx-billing-model-dist-list' })"
          >
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button"
            type="is-primary"
            size="is-large"
            @click="createDistModel"
          >
            {{ $t('common.BTN.apply') }}
          </button>
        </div>
      </div>
      <div class="dist-create-info__project">
        <billing-model
          v-if="commonProjects.length"
          :model-data="{ distributeProjects: commonProjects }"
          distribute-model
          is-apply-model
          is-detail
          @active-model="onChangeActiveModel"
          @expand-model="onExpandModel"
          @active-children-model="onChangeActiveChildrenModel"
          no-scroll
        />
      </div>
    </div>
    <div class="dist-create-form">
      <distribute-create-form
        v-if="activeProject && activeProject.distInfo"
        ref="createForm"
        :auto-set="initAutoSetOneDepthAff"
        :active-project="activeProject"
        @sync-dist="syncDist"
      />
      <div
        v-else-if="!commonProjects.length"
        class="empty-data"
        style="padding-top: 100px;"
      >
        {{ $t('bill.MODEL.PLACEHOLDER.noCommonProject') }}
      </div>
    </div>
    <fetch-billing-model
      distribute
      :active.sync="activeFetchModal"
      @close="activeFetchModal = false"
      @apply="copyModelGroup"
    />
  </div>
</template>

<script>
import RefreshIcon from '@/components/Icons/RefreshIcon.vue'
import FetchBillingModel from '@/components/Billing/Modals/FetchBillingModel.vue'
import BillingModel from '@/components/Billing/BillingModel.vue'
import DistributeCreateForm from '@/components/Billing/Distribute/DistributeCreateForm.vue'
import { flatten, groupBy } from 'lodash'
import DistMixins from '@/components/Billing/Distribute/DistMixins'
import API from '@sd-fe/cmp-core'

export default {
  name: 'BillingModelDistCreate',
  mixins: [DistMixins],
  components: {
    RefreshIcon,
    FetchBillingModel,
    BillingModel,
    DistributeCreateForm
  },
  async created () {
    await this.getCommonProjects()
    await this.getApplyDistModel()
  },
  watch: {
    activeProject (project) {
      if (project) {
        if (this.copying || this.creating) return
        this.activeProjectGroups = []
        this.getCommonProjectGroup(project)
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
     * apply된 배부 모델 가져오기
     */
    async getApplyDistModel () {
      try {
        const { data } = await API.billing.getApplyDistModel()
        this.applyDistModel = data
        // 새 모델에 복사
        if (data && this.applyDistModel.distributeProjects) {
          this.applyDistModel.distributeProjects.forEach(project => {
            const findProject = this.commonProjects.find(
              innerProject => innerProject.projectIdx === project.projectIdx
            )

            // findProject.distributeGroups = project.distributeGroups
            // 2차 배부 관계사
            // parentGroupName이 존재하는 걸 찾음
            // 키를 다 찾고 중복 제거
            // const isDepthArr = project.distributeGroups
            //   .filter(group => group.parentGroupName)
            //   .map(group => group.parentGroupName)

            // 객체에 그룹 이름으로 child 추합
            // { 공통: [...] }
            // const result = {}
            // let twoDepth = null

            // if (isDepthArr.length) {
            //   isDepthArr.forEach(groupName => {
            //     const items = project.distributeGroups.filter(
            //       group => group.parentGroupName === groupName
            //     )
            //     result[groupName] = {
            //       selected: items.map(item => ({ ...item, companyName: item.groupName })),
            //       commonAffName: groupName,
            //       distName: items[0].distributeStandardName
            //     }
            //   })

            //   twoDepth = Object.keys(result).map(key => result[key])
            // }
            if (findProject) {
              // 2차 배부모델을 제외한 1차 배부모델
              const oneDepth = project.distributeGroups
                .filter(
                  group => !group.parentGroupName && group.groupIdx !== 0
                )
                .map(t => ({ ...t, companyName: t.groupName }))

              // 2차 배부모델(첫번째 인덱스만 index=0)
              const twoDepthForOneDepth = project.distributeGroups
                .filter(
                  group => !group.parentGroupName && group.groupIdx === 0
                )
                .map(t => ({ ...t, companyName: t.groupName }))

              // 2차 배부모델
              const twoDepth = []

              // 2차 배부모델이 등록된 1차 배부모델들
              const allDepthNotDuplic = project.distributeGroups.filter(
                group => group.groupIdx !== 0 && group.parentGroupName
              ).map(t => ({ ...t, companyName: t.groupName }))

              const TwoDepthGroupByParentName = groupBy(twoDepthForOneDepth, 'groupName')

              for (const key in TwoDepthGroupByParentName) {
                const standardFound = TwoDepthGroupByParentName[key][0].distributeStandardName // 2차 기준명을 맵핑합니다
                let result = []
                result = allDepthNotDuplic.filter(el => el.parentGroupName === key)
                twoDepth.push({
                  companyName: TwoDepthGroupByParentName[key][0].companyName,
                  groupName: TwoDepthGroupByParentName[key][0].groupName,
                  // groupIdx: TwoDepthGroupByParentName[key][0].groupIdx,
                  distributeStandardName: standardFound || '',
                  commonAffName: key,
                  selected: result,
                  distName: standardFound || ''
                })
              }
              this.$set(findProject, 'distInfo', {
                distName: project.distributeStandardName,
                oneDepth: [...oneDepth, ...twoDepthForOneDepth],
                twoDepth: twoDepth
              })
            }
          })
        }
        this.commonProjects
          .filter(project => project.distInfo === undefined)
          .forEach(async project => {
            if (project.distInfo && project.distInfo.oneDepth.length) return
            const { data: commonProject } = await API.billing.getDistributeGroup(project.projectIdx)
            this.$set(project, 'distInfo', {
              distName: '',
              oneDepth: commonProject.filter(cp => !cp.parentGroupName && !cp.groupIdx !== 0).map(cp => ({ ...cp, companyName: cp.groupName })),
              twoDepth: []
            })
          })
        if (this.$route.query.projectIdx) {
          // 관리자에서 공통 프로젝트를 만들고 배부모델 페이지로 이동한 경우
          // 공통 프로젝트를 자동으로 선택하고
          // 1차 배부 관계사를 생성한 공통 프로젝트의 관계사로
          // 초기 세팅한다.
          const projectIdx = parseInt(this.$route.query.projectIdx)
          const findProjectIdx = this.commonProjects.findIndex(
            project => project.projectIdx === projectIdx
          )
          if (projectIdx && findProjectIdx !== -1) {
            this.initAutoSetOneDepthAff = true
            this.onChangeActiveModel(this.commonProjects[findProjectIdx])
          }
        } else {
          this.onChangeActiveModel(this.commonProjects[0])
        }
      } catch (error) {
        console.log(error)
      } finally {
        this.pageLoading = false
      }
    },
    /**
     * 배부 모델 생성
     */
    async createDistModel () {
      this.creating = true

      const oneDepth = this.$refs.createForm?.selectedOneDepthAff
      const twoDepth = this.$refs.createForm?.selectedTwoDepthAff
      const distName = this.$refs.createForm?.rootDistName

      if (!this.activeProject) {
        this.activeProject = {}
      }

      this.activeProject.distInfo = {
        oneDepth: oneDepth || [],
        twoDepth: twoDepth || [],
        distName: distName || ''
      }

      const reqObj = {
        name: this.modelName,
        distributeProjects: this.commonProjects.map(project => {
          // 공통 관계사로 묶은 녀석들을 여기에 넣음
          let twoDepthGroup = []
          if (project.distInfo && project.distInfo.twoDepth.length !== 0) {
            const depth = project.distInfo.twoDepth
            const all = depth.map(group => {
              const temp = [...group.selected]
              return temp.map(t => ({
                amount: t.amount,
                groupIdx: t.groupIdx,
                groupName: t.companyName,
                distributeStandardName: group.distName,
                parentGroupName: group.commonAffName
              }))
            })
            twoDepthGroup = flatten(all)
          }

          let oneDepthGroup = []

          if (project.distInfo && project.distInfo.oneDepth) {
            oneDepthGroup = project.distInfo.oneDepth.map(group => ({
              groupIdx: group.groupIdx,
              groupName: group.companyName,
              amount: group.amount
            }))
          }

          const groups = [].concat(oneDepthGroup, twoDepthGroup)
          return {
            distributeGroups: groups,
            distributeStandardName: project.distInfo?.distName || '',
            projectIdx: project.projectIdx,
            projectName: project.projectName
          }
        })
      }

      // validate
      if (!this.validateDistModel(reqObj)) {
        this.creating = false
        return
      }

      try {
        await API.billing.insertDistModel(reqObj)
        this.$alert(this.$t('common.ALERT.BILL.054'), {
          callback: () => {
            this.$router.push({ name: 'nx-billing-model-dist-list' })
          }
        })
      } catch (error) {
        switch (error.data.code) {
          case 'BIL2001':
            return this.$alert(this.$t('common.ALERT.BILL.015')) // 중복된 모델명입니다.
          default:
            return this.$alert(this.$t('common.ALERT.BILL.055')) // 배부 모델 생성 실패
        }
      } finally {
        this.creating = false
      }
    },
    /**
     * 공통 프로젝트 조회
     */
    async getCommonProjects () {
      try {
        this.pageLoading = true

        const commonProjects = await API.iam.getProject({
          inCommon: true,
          isDeleted: false,
          isApprove: true
        })

        if (commonProjects && commonProjects.length) {
          commonProjects.forEach(project => {
            this.$set(project, 'active', false)
            this.$set(project, 'expanded', false)
            this.$set(project, 'expandable', true)
            this.$set(project, 'distributeGroups', [])
          })
        }

        this.commonProjects = commonProjects || []
      } catch (error) {
        console.log(error)
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
    initAutoSetOneDepthAff: false,
    modelName: '',
    activeFetchModal: false,
    commonProjects: [],
    pageLoading: true,
    activeProject: null,
    activeProjectGroups: [],
    copying: false,
    creating: false,
    applyDistModel: null,
    isCopied: false
  })
}
</script>

<style lang="scss" scoped>
.dist-create {
  display: flex;
  flex-wrap: nowrap;
  width: 100%;

  &.en {
    .dist-create-info {
      &__header {
        white-space: wrap;
        flex-wrap: wrap;

        .button {
          margin-top: $gap-s;
        }
      }
    }
  }

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
