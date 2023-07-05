<!--
  * 파일명 : ResourceFilterComponent.vue
  * 파일 기능 : 관계사/조직/프로젝트 필터링 컴포넌트
  * 작성자 : 이경환 외 1명
  * 최종 작성일 : 2021-02-26
  * License By Shinsegae I&C
  * 2021-02-26 add: 필터링 드롭다운 글자 넘치는 아이템 툴팁 추가
 -->

<template>
  <div
    class="resource-filter-component"
    v-loading="loading.company || loading.group || loading.project"
  >
    <filtering-component
      :class="{'-prefix-wrap': hasPrefixSlot() || hasSuffixSlot()}"
      v-if="isReplaceFilteringComponent"
      :use-title="useTitle"
      @reset-data="resetAllFilter()"
    >
      <template
        v-if="hasPrefixSlot()"
      >
        <div class="prefix-wrap">
          <slot name="prefix" />
        </div>
      </template>

      <section :class="['filter-form', {'-small-gap': !useFilterLabel}]">
        <span
          class="filter-name"
          v-if="useFilterLabel"
        >{{ $t('common.TERMS.rel') }}</span>
        <searchable-select
          v-model="filteredCompany"
          :placeholder="$t('common.PLACEHOLDER.selectAff')"
          :options="allCompany"
          :popper-class="popperClass"
          unique-key="groupIdx"
          @change="changeCompany"
        />
      </section>
      <!-- 관계사 -->

      <section :class="['filter-form', {'-small-gap': !useFilterLabel}]">
        <span
          class="filter-name"
          v-if="useFilterLabel"
        >{{ $t('common.TERMS.group') }}</span>
        <searchable-select
          v-model="filteredGroup"
          :placeholder="$t('common.PLACEHOLDER.selectOrg')"
          :options="groupOptions"
          :empty-text="!filteredCompany ? $t('common.ALERT.PROJECT.008') : $t('common.PLACEHOLDER.noData')"
          :popper-class="popperClass"
          org-tooltip
          unique-key="groupIdx"
          @change="changeGroup"
        />
      </section>
      <!-- 조직 -->

      <section
        :class="['filter-form', {'-small-gap': !useFilterLabel}]"
        v-if="useProject"
      >
        <span
          class="filter-name"
          v-if="useFilterLabel"
        >{{ $t('common.TERMS.project') }}</span>
        <searchable-select
          v-model="filteredProject"
          :placeholder="$t('common.PLACEHOLDER.selectProject')"
          :options="projectOptions"
          :empty-text="!filteredCompany || !filteredGroup ? $t('common.PLACEHOLDER.selectCompanyAndGroup') : $t('common.PLACEHOLDER.noData')"
          :popper-class="popperClass"
          unique-key="projectIdx"
          @change="val => setSelectProject(val)"
        />
      </section>
      <!-- 프로젝트 -->
      <slot />

      <template
        v-if="hasSuffixSlot()"
      >
        <div class="suffix-wrap">
          <slot name="suffix" />
        </div>
      </template>
    </filtering-component>

    <div
      v-else
      class="flex-wrap"
    >
      <section :class="['filter-form', {'-small-gap': !useFilterLabel}]">
        <span
          class="filter-name"
          v-if="useFilterLabel"
        >{{ $t('common.TERMS.rel') }}</span>
        <searchable-select
          v-model="filteredCompany"
          :placeholder="$t('common.PLACEHOLDER.selectAff')"
          :options="allCompany"
          :popper-class="popperClass"
          unique-key="groupIdx"
          @change="changeCompany"
        />
      </section>
      <!-- 관계사 -->

      <section :class="['filter-form', {'-small-gap': !useFilterLabel}]">
        <span
          class="filter-name"
          v-if="useFilterLabel"
        >{{ $t('common.TERMS.group') }}</span>
        <searchable-select
          v-model="filteredGroup"
          :placeholder="$t('common.PLACEHOLDER.selectOrg')"
          :options="groupOptions"
          :empty-text="!filteredCompany ? $t('common.ALERT.PROJECT.008') : $t('common.PLACEHOLDER.noData')"
          :popper-class="popperClass"
          org-tooltip
          unique-key="groupIdx"
          @change="changeGroup"
        />
      </section>
      <!-- 조직 -->

      <section
        :class="['filter-form', {'-small-gap': !useFilterLabel}]"
        v-if="useProject"
      >
        <span
          class="filter-name"
          v-if="useFilterLabel"
        >{{ $t('common.TERMS.project') }}</span>
        <searchable-select
          v-model="filteredProject"
          :placeholder="$t('common.PLACEHOLDER.selectProject')"
          :options="projectOptions"
          :empty-text="!filteredCompany || !filteredGroup ? $t('common.PLACEHOLDER.selectCompanyAndGroup') : $t('common.PLACEHOLDER.noData')"
          :popper-class="popperClass"
          unique-key="projectIdx"
          @change="val => setSelectProject(val)"
        />
      </section>
      <!-- 프로젝트 -->
    </div>
  </div>
</template>
<script>
import API, { SearchableSelect, FilteringComponent } from '@sd-fe/cmp-core'

export default {
  name: 'ResourceFilterComponent',
  components: {
    SearchableSelect,
    FilteringComponent
  },
  watch: {
    tableData (newVal) {
      this.filteredGridData = newVal
    },
    refreshKey: {
      handler () {
        this.setInitSelectedProject()
      }
    }
    // initProjectIdx: {
    //   handler () {
    //     this.setInitSelectedProject()
    //   }
    // },
    // initGroupIdx: {
    //   handler () {
    //     this.setInitSelectedProject()
    //   }
    // },
    // initCompanyIdx: {
    //   handler () {
    //     this.setInitSelectedProject()
    //   }
    // }
    // changingData: {
    //   // immediate: true,
    //   deep: true,
    //   handler (data) {
    //     this.$emit('change', this.changingData)
    //   }
    // }
  },
  props: {
    tableData: {
      type: Array,
      default: () => []
    },
    // useApi: { // API 사용하는지 여부, 사용 안하면 프론트에서 필터링
    //   type: Boolean,
    //   default: false
    // },
    addUnknown: {
      type: Boolean,
      default: false
    },
    isReplaceFilteringComponent: { // FilteringComponent 영역에 쓰여지는지 여부를 설정합니다. (그리드 상단 필터영역에서 사용되면 true)
      type: Boolean,
      default: true
    },
    useProject: { // 프로젝트 선택 영역 없이 관-조 만 선택하면 false.
      type: Boolean,
      default: true
    },
    useFilterLabel: { // 필터 라벨 ('관계사', '조직', '프로젝트') 사용 여부
      type: Boolean,
      default: true
    },
    initCompanyIdx: { // 초기 선택 관계사 IDX
      type: Number,
      default: undefined
    },
    initGroupIdx: { // 초기 선택 조직 IDX
      type: Number,
      default: undefined
    },
    initProjectIdx: { // 초기 선택 프로젝트 IDX
      type: Number,
      default: undefined
    },
    useTitle: {
      type: Boolean,
      default: true
    },
    popperClass: { // 관-조-프 선택 드롭다운 Popper에 추가 할 클래스 명
      type: String,
      default: ''
    },
    refreshKey: { // 부모 컴포넌트에서 강제로 업데이트 할 수 있게 하는 키
      type: Number,
      default: undefined
    },
    cloudType: { // 'private', 'public'
      type: String,
      default: undefined
    },
    onlyActiveProject: {
      type: Boolean,
      default: false
    }
  },
  async created () {
    await this.getCompanyList()
    // this.setInitSelectedProject()
  },
  methods: {
    async getCompanyList () {
      try {
        this.loading.company = true
        const companies = await this.getGroupList({ groupUpper: 0 })
        if (!companies) return

        if (this.addUnknown) companies.push({ label: '미등록', companyCode: 'unknown', groupIdx: undefined })
        this.allCompany = this.isReplaceFilteringComponent ? companies : companies.filter(comp => comp.groupIdx !== 1) // 자원 생성에 쓰일 경우, '공통' 항목 제거

        await this.setInitSelectedProject()
      } catch (error) {
        this.allCompany = []
        console.error(error)
      } finally {
        this.loading.company = false
      }
    },
    async getGroupList (params) {
      try {
        this.loading.group = true
        const response = await API.iam.getGroupList(params)
        if (!response) return
        const result = response.map(item => {
          return {
            ...item,
            label: item.groupName,
            companyCode: item.companyCode || null
          }
        })
        return [{ label: this.$t('main.DASHBOARD.all'), companyCode: null, groupIdx: null }, ...result] // 전체 포함
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.groupOptions = []
        this.projectTreeData = []
        this.$alert(message)
        throw error
      } finally {
        this.loading.group = false
      }
    },
    /**
     * 초기 선택 된 관-조-프 세팅
     */
    async setInitSelectedProject () {
      if (this.initCompanyIdx === undefined &&
       this.initGroupIdx === undefined &&
       this.initProjectIdx === undefined) return

      await this.setSelectCompany(this.initCompanyIdx)
      if (this.filteredCompany) await this.setSelectGroup(this.initGroupIdx)
      if (this.filteredCompany && this.filteredGroup) await this.setSelectProject(this.initProjectIdx)

      this.changeEvent()
    },

    /**
     * 셀렉트 박스 => company 변경 이벤트 (created 시, 적용 x)
     */
    async changeCompany (val) {
      this.filteredGroup = val === null ? '' : null
      this.filteredProject = ''
      this.groupOptions = []
      this.projectOptions = []
      // this.changingData.group = null
      // this.changingData.project = null

      this.changingData = {
        ...this.changingData,
        group: null,
        project: null
      }
      await this.setSelectCompany(val)

      this.changeEvent()
    },
    /**
     * 셀렉트 박스 => group 변경 이벤트 (created 시, 적용 x)
     */
    changeGroup (val) {
      this.filteredProject = val === null ? '' : null
      this.projectOptions = []
      this.setSelectGroup(val)

      this.changingData = {
        ...this.changingData,
        project: null
      }

      this.changeEvent()
    },

    async getProject (params) {
      try {
        this.loading.project = true
        const response = await API.iam.getProject(params)
        const result = response.map(item => {
          return {
            ...item,
            label: item.projectName
          }
        })
        return result
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.projectTreeData = []
        this.$alert(message)
        throw error
      } finally {
        this.loading.project = false
      }
    },

    /**
     * 관계사 선택 -> 그룹 정보 세팅
     */
    async setSelectCompany (selectedCompany) {
      if (isNaN(selectedCompany)) return
      this.filteredGroup = selectedCompany === null ? '' : null
      this.groupOptions = []
      // this.objectMap(this.disabled, () => { return false })
      // if (this.useApi) {
      if (selectedCompany === 1) { // '공통'일 때..
        this.companyCode = 'common'
        this.filteredOwnerCompany = selectedCompany
        this.filteredCompany = selectedCompany

        this.groupOptions = []
      } else if (this.addUnknown && selectedCompany === undefined) {
        this.companyCode = 'unknown'
      } else {
        this.companyCode = null
        this.filteredOwnerCompany = null
        this.filteredCompany = selectedCompany
        this.groupOptions = this.filteredCompany ? await this.getGroupList({ companyIdx: this.filteredCompany }) : []
      }
      // } else {
      //   if (selectedCompany.children?.length) this.groupOptions = this.setGroupOptions(selectedCompany.children)
      //   else {
      //   // this.objectMap(this.disabled, () => { return true })
      //   // console.log('**', this.disabled)
      //   }
      // }
      // console.log('관계사 선택: ', selectedCompany)

      // this.filteredGroup = null
      // this.filteredProject = null

      this.changingData.company = this.allCompany.find(comp => comp.groupIdx === selectedCompany)

      // this.$emit('change', this.changingData)

      this.searchDataActive()
    },
    // /**
    //  * 필터 그룹 데이터 가공
    //  * @param {Object} company 관계사 정보
    //  * @param {Array} groups 관계사에 속한 조직들..
    //  */
    // setGroupOptions (groups) {
    //   const groupItem = groups.map(item => item)
    //   groupItem.forEach(group => {
    //     group.label = group.groupName
    //     group.value = group.groupIdx
    //     this.groupOptions.push(group)
    //     if (group.children?.length) this.setGroupOptions(group.children)
    //   })

    //   return this.groupOptions
    // },
    /**
     * 조직 선택 -> 프로젝트 정보 세팅
     */
    async setSelectGroup (selectedGroup) {
      if (isNaN(selectedGroup)) return

      this.filteredGroup = selectedGroup

      this.changingData.group = this.groupOptions.find(gr => gr.groupIdx === selectedGroup)
      // project: null

      if (selectedGroup === '') {
        this.filteredProject = ''
        this.projectOptions = []
      } else {
        const projects = this.filteredGroup
          ? await this.getProject({
            groupIdx: this.filteredGroup,
            isDeleted: false,
            cloudType: this.cloudType
          })
          : []

        this.projectOptions = await this.setCommonProjectOptions(projects)
        // 구성관리 - 네트워크 및 보안 필터 사용시 속성
        if (this.onlyActiveProject) this.projectOptions = this.projectOptions.filter(project => project.projectStatus !== 0)
        // this.$emit('change', this.changingData)
      }

      this.searchDataActive()
    },
    setSelectProject (selectedProject) {
      if (isNaN(selectedProject)) return
      this.filteredProject = selectedProject
      this.changingData.project = this.projectOptions.find(pr => pr.projectIdx === this.filteredProject)
      // this.$emit('change', this.changingData)

      this.searchDataActive()

      this.changeEvent()
    },
    /**
     * [공통] 프로젝트 정보를 가공, sorting 합니다.
     */
    setCommonProjectOptions (projects) {
      const projectOptions = projects.map(pr => {
        return {
          ...pr,
          label: pr.inCommon ? `[${this.$t('config.PROJECT.common')}] ` + pr.projectName : pr.projectName // 공통 프로젝트는 "[공통] project name"
        }
      })
        .sort((a, b) => {
          if (a.inCommon < b.inCommon) return 1
          else if (a.inCommon > b.inCommon) return -1
          else return 0
        })

      return [{ label: this.$t('main.DASHBOARD.all'), projectIdx: null }, ...projectOptions]
    },
    searchDataActive (value = this.tableData) {
      const payload = {
        ownerCompany: this.filteredOwnerCompany ? this.filteredOwnerCompany : null,
        companyIdx: this.filteredOwnerCompany ? null : (this.filteredCompany ? this.filteredCompany : null),
        groupIdx: this.filteredGroup ? this.filteredGroup : null,
        projectIdx: this.filteredProject ? this.filteredProject : null
      }
      if (this.companyCode) {
        Object.defineProperty(payload, 'companyCode', {
          value: this.companyCode,
          configurable: true,
          enumerable: true
        })
      }
      this.$emit('search', payload)

      // console.log('---필터테이블데이터: ', this.filteredGridData)
    },
    /**
     * 선택한 관-조-프 를 리셋합니다.
     */
    resetAllFilter () {
      // this.filteredOwnerCompany = null
      // this.filteredCompany = null
      // this.groupOptions = []
      this.companyCode = null
      this.setSelectCompany(null)
      // this.searchDataActive()
      this.$emit('reset')
    },
    /**
     * 오브젝트를 mapFn로 가공하여 리턴합니다. value 가공하여 새로운 오브젝트를 리턴할 때 사용합니다.
     * @param {Object} object 가공 할 오브젝트
     * @param {Function} mapFn 가공 적용 할 함수
     */
    objectMap (object, mapFn) {
      return Object.keys(object).reduce(function (result, key) {
        result[key] = mapFn(object[key])
        return result
      }, {})
    },
    changeEvent () {
      this.$emit('change', this.changingData, this)
    }
  },
  data () {
    return {
      loading: {
        company: false,
        group: false,
        project: false
      },
      searchText: {
        company: '',
        group: '',
        project: ''
      },
      companyCode: null,
      allCompany: [],
      groupOptions: [],
      projectOptions: [],

      filteredOwnerCompany: '',
      filteredCompany: null,
      filteredGroup: '',
      filteredProject: '',

      filteredGridData: [],

      disabled: {
        groupOptions: false,
        projectOptions: false

      },
      changingData: {
        company: null,
        group: null,
        project: null
      },
      hasPrefixSlot: () => {
        return !!this.$slots.prefix
      },
      hasSuffixSlot: () => {
        return !!this.$slots.suffix
      }
    }
  }
}
</script>

<style scoped lang="scss">
  .filter-form {
    display: flex;
    align-items: center;
    &:not(:last-of-type) {
      margin-right: $gap-m;
    }
    &.-small-gap:not(:last-of-type) { // 라벨 없을 때 간격
      margin-right: $gap-s;
    }
    .el-date-editor {
      width: 140px;
      border: none;
    }
    .filter-options {
      width: 200px;
    }
  }
  .filter-name {
    font-weight: 300;
    line-height: 15px;
    display: block;
    white-space: nowrap;
    margin-right: 10px;
  }
</style>

<style lang="scss">
  .resource-filter-component {
    .filtering-component.-prefix-wrap {
      > .filter-wrapper { flex-wrap: wrap; height: auto; }
      .prefix-wrap {
        display: flex;
        width: 100%;
        margin-bottom: 22px;
      }
      .suffix-wrap {
        display: flex;
        width: 100%;
        margin-top: 22px;
      }
    }
  }
</style>
