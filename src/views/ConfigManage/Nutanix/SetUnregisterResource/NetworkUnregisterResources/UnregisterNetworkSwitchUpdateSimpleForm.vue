<!--
  * 파일명 : UnregisterNetworkSwitchUpdateSimpleForm.vue
  * 파일 기능 : 미등록 Network 스위치 (L4/L7) 정보 간단 수정 폼
  * License By Shinsegae I&C
 -->

<template>
  <section class="unregister-network-switch-update-simple-form">
    <div class="resource-info-form edit-wrap modal-inner-scroll">
      <vertical-table
        v-if="!isEmpty(lbInfo)"
        :data="lbInfo"
        :columns="columns"
        label-align="center"
      >
        <el-checkbox
          slot="isUrgent"
          v-model="lbInfo.isUrgent"
        >
          {{ $v('긴급') }}
        </el-checkbox>

        <template #projectInfo>
          <div
            class="flex-wrap"
            style="gap: 10px;"
          >
            <span v-if="lbInfo.projectInfo && lbInfo.projectInfo.company !== null">
              {{ `${lbInfo.projectInfo.company.groupName || '-'} > ${lbInfo.projectInfo.group.groupName || '-'} > ${lbInfo.projectInfo.project.projectName || '-'}` }}
            </span>
            <button
              class="button"
              :type="lbInfo.projectInfo && lbInfo.projectInfo.company !== null
                ? 'is-dark'
                : 'is-primary'"
              @click="visibleProject = true"
              style="min-width: 140px;"
              ref="projectTrigger"
            >
              {{ lbInfo.projectInfo && lbInfo.projectInfo.company !== null ? $v('프로젝트 변경') : $v('프로젝트 선택') }}
            </button>
          </div>

          <div
            v-if="visibleProject"
            class="custom-popup -app-manager"
          >
            <select-from-tree
              type="project"
              :search-title="$v('프로젝트를 검색하세요.')"
              :header="$v('프로젝트 리스트')"
              v-if="visibleProject"
              class="-body"
              @close="visibleProject = false"
              :selected-project-info="lbInfo.projectInfo ? lbInfo.projectInfo.project : null"
              :group-tree-data="groupTreeData"
              :loading="isGetGroupTree"
              :user-group-idx="userInfo.userGroup"
              :trigger-btn="$refs"
              @select="changeProject"
            />
          </div>
        </template>
        <!-- 프로젝트 선택 -->

        <el-input
          slot="resourceName"
          v-model="lbInfo.resourceName"
          class="storage-name-input"
          :placeholder="$v('로드밸런스 명')"
        />
        <!-- 로드밸런스 명 -->

        <template #networkCateInfo>
          <div class="network-cate-wrap">
            <el-tag
              v-if="lbInfo.networkCateInfo"
            >
              {{ lbInfo.networkCateInfo.cateKey }}
            </el-tag>

            <button
              class="button"
              :type="lbInfo.networkCateInfo ? 'is-dark' : 'is-primary'"
              @click="networkCateModalView = true"
            >
              {{
                $v('네트워크 카테고리')+' ' + (lbInfo.networkCateInfo
                  ? $v('변경')
                  : $v('선택'))
              }}
            </button>
          </div>
        </template>
        <!-- 네트워크 카테고리 -->

        <template #chargeDate>
          <el-date-picker
            class="service-date-pick"
            v-model="lbInfo.chargeDate"
            type="date"
            @change="changeChargeDate"
            :placeholder="$v('과금 시작일')"
            :clearable="false"
            :picker-options="lbInfo.creationTime && { // 과금 시작일 datepicker 옵션 설정
              disabledDate (time) {
                const creationTime = lbInfo.creationTime
                return time.getTime() < new Date(creationTime).setHours(0, 0, 0, 0)
              }
            }"
          />
        </template>
        <!-- /. 과금 시작일 -->

        <template #tagInfo>
          <select-multiple-tag
            v-model="lbInfo.tagInfo"
            widths="200px"
            :placeholder="$v('자원 태그를 입력해주세요.')"
            :after-placeholder="$v('태그 추가')"
            is-modify
          />
        </template>
      </vertical-table>
    </div>

    <!-- 네트워크 카테고리 선택 모달 -->
    <network-category-tree-selection
      :visible="networkCateModalView"
      :init-data="lbInfo.networkCateInfo ? [lbInfo.networkCateInfo] : null"
      :cate-limit="1"
      @close="networkCateModalView = false"
      @save="saveNetworkCate"
    />
  </section>
</template>

<script>
import { cloneDeep, isEmpty } from 'lodash'
import API, { SelectFromTree, SelectMultipleTag } from '@sd-fe/cmp-core'

export default {
  name: 'UnregisterNetworkSwitchUpdateSimpleForm',
  components: {
    SelectFromTree,
    SelectMultipleTag
  },
  props: {
    data: { // 해당 제품의 초기 데이터
      type: Object,
      default: null
    },
    projectInfo: { // 프로젝트 정보 { company, group, project }
      type: Object,
      default: undefined
    },
    userInfo: {
      type: Object,
      default: null
    }
  },
  watch: {
    projectInfo: {
      immediate: true,
      deep: true,
      handler () {
        this.changeProject(this.projectInfo)
      }
    },
    isLoading: {
      immediate: true,
      handler () { this.$emit('change-loading', this.isLoading) }
    }
  },

  computed: {
    isLoading () {
      return this.initLoading ||
        this.isGetGroupTree
    }
  },
  async created () {
    try {
      this.initLoading = true

      await Promise.all([
        this.getGroupTreeData()
      ]).then(async () => {
        if (this.data) await this.initDataSetting()

        this.$watch(() =>
          this.lbInfo,
        () => this.$emit('update:data', this.lbInfo),
        { deep: true, immediate: true }
        )
      })
    } catch (error) {
      console.error(error)
      this.initLoading = false
    } finally {
      this.initLoading = false
    }
  },
  methods: {
    /**
     * 초기 데이터(this.data)가 있을 떄, 데이터 세팅해줍니다.
     */
    async initDataSetting () {
      const data = this.data

      this.initData = cloneDeep(data)

      console.log(this.initData, '🎃 ============DATA? ')
      const {
        isUrgent,

        resourceIdx,
        resourceName,
        networkList,

        tagInfo,

        chargeDate

      } = data

      // 운영그룹

      this.lbInfo = {
        ...data,
        ...(this.projectInfo && {
          projectInfo: this.projectInfo
        }),
        ...(networkList?.length && {
          networkList,
          networkCateInfo: networkList[0]
        }),
        resourceIdx,
        chargeDate,

        isUrgent: isUrgent || false,
        resourceName,

        tagInfo
      }

      // console.log(this.lbInfo, '🐙=== setting ')
    },
    /**
     * 서비스 개시일 변경 이벤트
     */
    changeChargeDate (val) {
      if (!val) this.lbInfo.chargeDate = this.initData.chargeDate
      else this.lbInfo.chargeDate = +new Date(val)
    },

    /**
     * API: 전체 그룹 트리를 조회합니다.
     */
    async getGroupTreeData () {
      try {
        this.isGetGroupTree = true
        const response = await API.iam.getGroupManageTree({ project: true })

        this.groupTreeData = response ? [...response] : []
      } catch (error) {
        console.error(error)
        this.$alert('조직 조회에 문제가 발생했습니다.', () => false)
      } finally {
        this.isGetGroupTree = false
      }
    },
    isEmpty (value) {
      return isEmpty(value)
    },

    /**
     * 관-조-프 변경 이벤트
     */
    async changeProject (param) {
      this.$set(this.lbInfo, 'projectInfo', param)
    },
    /**
     * 네트워크 카테고리 변경 이벤트
     */
    saveNetworkCate (cate) {
      if (cate?.length) {
        this.lbInfo.networkList = cate
        this.lbInfo.networkCateInfo = cate[0]
      } else {
        this.lbInfo.networkList = []
        this.lbInfo.networkCateInfo = undefined
      }
    }
  },
  data (root) {
    return {
      initData: null, // 최초 자원 정보
      groupTreeData: [], // 조직도

      lbInfo: { // 생성 폼 총 데이터 집합 (emit 데이터)
        resourceName: '', // Volume 그룹명
        networkCateInfo: null
      },

      columns: [
        { header: root.$v('자원 분류'), binding: 'isUrgent', titleInfo: root.$v('긴급으로 생성된 자원은 사용자 장바구니에 긴급태그로 표시됩니다.') },
        { header: root.$v('프로젝트 선택'), binding: 'projectInfo', required: true },
        { header: root.$v('로드밸런스 명'), binding: 'resourceName', required: true },
        { header: root.$v('네트워크 카테고리'), binding: 'networkCateInfo', required: true },
        { header: root.$v('과금 시작일'), binding: 'chargeDate', required: true },
        { header: root.$v('자원 태그'), binding: 'tagInfo' }
      ],

      // ----- 로딩 -----
      initLoading: false, // 로딩: 전체
      isGetGroupTree: false,

      // ----- only Admin -----
      visibleProject: false,
      networkCateModalView: false

    }
  }
}
</script>

<style lang="scss" scoped>
  .resource-info-form {
    .flex-wrap {
      display: flex;
      align-items: center;
      height: 100%;
      > * {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    small.-reference {
      margin-top: 5px;
      color: $input-placeholder;
      span, &.-alert { color: $main-red; }
    }
  }
  .service-date-pick { width: 150px; }

  .storage-name-input.el-input::v-deep .el-input__inner { padding: 0 55px 0 15px; }
</style>
