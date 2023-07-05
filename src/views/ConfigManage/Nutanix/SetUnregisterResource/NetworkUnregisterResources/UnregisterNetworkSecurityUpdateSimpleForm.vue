<!--
  * 파일명 : UnregisterNetworkSecurityUpdateSimpleForm.vue
  * 파일 기능 : 미등록 Network 보안그룹 정보 간단 수정 폼
  * License By Shinsegae I&C
 -->

<template>
  <section class="unregister-network-security-update-simple-form">
    <div class="resource-info-form edit-wrap modal-inner-scroll">
      <vertical-table
        v-if="!isEmpty(sgInfo)"
        :data="sgInfo"
        :columns="columns"
        label-align="center"
      >
        <el-checkbox
          slot="isUrgent"
          v-model="sgInfo.isUrgent"
        >
          {{ $v('긴급') }}
        </el-checkbox>

        <template #projectInfo>
          <div
            class="flex-wrap"
            style="gap: 10px;"
          >
            <span v-if="sgInfo.projectInfo && sgInfo.projectInfo.company !== null">
              {{ `${sgInfo.projectInfo.company.groupName || '-'} > ${sgInfo.projectInfo.group.groupName || '-'} > ${sgInfo.projectInfo.project.projectName || '-'}` }}
            </span>
            <button
              class="button"
              :type="sgInfo.projectInfo && sgInfo.projectInfo.company !== null
                ? 'is-dark'
                : 'is-primary'"
              @click="visibleProject = true"
              style="min-width: 140px;"
              ref="projectTrigger"
            >
              {{ sgInfo.projectInfo && sgInfo.projectInfo.company !== null ? $v('프로젝트 변경') : $v('프로젝트 선택') }}
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
              :selected-project-info="sgInfo.projectInfo ? sgInfo.projectInfo.project : null"
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
          slot="securityGroupName"
          v-model="sgInfo.securityGroupName"
          :placeholder="sgInfo.tempSecurityGroupName || $v('보안그룹 명')"
        />
        <!-- 보안그룹 명 -->

        <el-input
          slot="comment"
          v-model="sgInfo.comment"
          :placeholder="$v('설명')"
          type="textarea"
          :rows="3"
        />
        <!-- 설명 -->

        <template #networkCateInfo>
          <div class="network-cate-wrap">
            <el-tag
              v-if="sgInfo.networkCateInfo"
            >
              {{ sgInfo.networkCateInfo.cateKey }}
            </el-tag>

            <button
              class="button"
              :type="sgInfo.networkCateInfo ? 'is-dark' : 'is-primary'"
              @click="networkCateModalView = true"
            >
              {{
                $v('네트워크 카테고리')+' ' + (sgInfo.networkCateInfo
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
            v-model="sgInfo.chargeDate"
            type="date"
            @change="changeChargeDate"
            :placeholder="$v('과금 시작일')"
            :clearable="false"
            :picker-options="sgInfo.creationTime && { // 과금 시작일 datepicker 옵션 설정
              disabledDate (time) {
                const creationTime = sgInfo.creationTime
                return time.getTime() < new Date(creationTime).setHours(0, 0, 0, 0)
              }
            }"
          />
        </template>
        <!-- /. 과금 시작일 -->

        <template #tagInfo>
          <select-multiple-tag
            v-model="sgInfo.tagInfo"
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
      :init-data="sgInfo.networkCateInfo ? [sgInfo.networkCateInfo] : null"
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
  name: 'UnregisterNetworkSecurityUpdateSimpleForm',
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
          this.sgInfo,
        () => this.$emit('update:data', this.sgInfo),
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
        securityGroupName,
        networkList,

        tagInfo,

        chargeDate

      } = data

      // 운영그룹

      this.sgInfo = {
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
        securityGroupName,

        tagInfo
      }

      // console.log(this.sgInfo, '🐙=== setting ')
    },
    /**
     * 서비스 개시일 변경 이벤트
     */
    changeChargeDate (val) {
      if (!val) this.sgInfo.chargeDate = this.initData.chargeDate
      else this.sgInfo.chargeDate = +new Date(val)
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
      this.$set(this.sgInfo, 'projectInfo', param)
    },
    /**
     * 네트워크 카테고리 변경 이벤트
     */
    saveNetworkCate (cate) {
      if (cate?.length) {
        this.sgInfo.networkList = cate
        this.sgInfo.networkCateInfo = cate[0]
      } else {
        this.sgInfo.networkList = []
        this.sgInfo.networkCateInfo = undefined
      }
    }
  },
  data (root) {
    return {
      initData: null, // 최초 자원 정보
      groupTreeData: [], // 조직도

      sgInfo: { // 생성 폼 총 데이터 집합 (emit 데이터)
        resourceName: '', // Volume 그룹명
        networkCateInfo: null
      },

      columns: [
        { header: root.$v('자원 분류'), binding: 'isUrgent', titleInfo: root.$v('긴급으로 생성된 자원은 사용자 장바구니에 긴급태그로 표시됩니다.') },
        { header: root.$v('프로젝트 선택'), binding: 'projectInfo', required: true },
        { header: root.$v('보안그룹 명'), binding: 'securityGroupName', required: true },
        { header: root.$v('설명'), binding: 'comment' },
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

</style>
