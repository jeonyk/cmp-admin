<template>
  <div class="container">
    <filtering-component @reset-data="reset">
      <div class="filtering-list">
        <span class="filter-name">{{ $v('관계사') }}</span>
        <div class="filter-options">
          <el-select
            :placeholder="$t('common.BTN.select')"
            v-model="selectedCompany"
            @change="onFilter"
          >
            <el-option
              v-for="company in UNIQUE_COMPANIES"
              :key="company"
              :label="company"
              :value="company"
            />
          </el-select>
        </div>
      </div>

      <div class="filtering-list">
        <span class="filter-name">{{ $v('조직') }}</span>
        <div class="filter-options">
          <el-select
            :placeholder="$t('common.BTN.select')"
            v-model="selectedOrganization"
            @change="onFilter"
          >
            <el-option
              v-for="company in UNIQUE_ORGANIZATIONS"
              :key="company"
              :label="company"
              :value="company"
            />
          </el-select>
        </div>
      </div>
    </filtering-component>
    <el-input
      class="search-input"
      :placeholder="$v('프로젝트명을 입력하세요.')"
      suffix-icon="el-icon-search"
      v-model="searchKeyword"
      @input="onFilter"
    />
    <total-count :total-count="taskData.length" />
    <cmp-grid
      :item-source="taskData"
      :columns="tableColumns"
      @selectedRow="param => selectItem(param.dataItem)"
      selectable
    >
      <template #common="{row}">
        <el-tooltip
          class="item"
          effect="light"
          placement="top"
          :disabled="row.distributeGroup.length === 1"
        >
          <div
            v-if="row.distributeGroup.length > 1"
            slot="content"
          >
            <ul>
              <li
                :key="idx"
                v-for="(group,idx) in row.distributeGroup"
              >
                {{ group.groupName }}
              </li>
            </ul>
          </div>
          <!-- content="Top Left prompts info" -->
          <div>  {{ getCommonCompany(row) }}</div>
        </el-tooltip>
      </template>
    </cmp-grid>
  </div>
</template>

<script>

import API from '@sd-fe/cmp-core'
import { mapGetters, mapState } from 'vuex'
import { cloneDeep } from 'lodash'
import dayjs from 'dayjs'

export default {
  mounted () {
    this.getProjectList()
    const updateWaitingCountFromTabs = this.$parent.$parent
    if (updateWaitingCountFromTabs)updateWaitingCountFromTabs.getWaitingProjectCount()
  },
  computed: {
    ...mapGetters({
      moduleType: 'cloud/getCloud'
    }),
    ...mapState({
      csp: state => state.cloud.cloud // nutanix, vmware, aws
    }),
    routeDestinationByCsp () {
      return {
        nutanix: 'set-project-list-detail',
        vmware: 'set-project-list-detail-vmw'
      }[this.csp]
    },
    taotal () {
      return this.taskData.length
    },
    UNIQUE_COMPANIES () {
      return [this.$v('전체'), ...new Set(this.clonedList.map(x => x.companyName))]
    },
    UNIQUE_ORGANIZATIONS () {
      let result = [...new Set(this.clonedList.map(x => x.groupName))]

      if (this.selectedCompany && this.selectedCompany !== this.$v('전체')) {
        result = result.filter(org => this.clonedList.some(x => x.groupName === org && x.companyName === this.selectedCompany))
      }

      return [this.$v('전체'), ...result]
    }
  },
  watch: {
    selectedCompany: {
      handler (newVal) {
        if (newVal) {
          this.selectedOrganization = this.$v('전체')
        }
      }
    }
  },
  methods: {
    getTime (time) {
      return dayjs(time).format('YYYY.MM.DD hh:mm:ss')
    },
    reset () {
      this.selectedCompany = ''
      this.selectedOrganization = ''
      this.searchKeyword = ''
      this.taskData = this.clonedList
    },
    onFilter () {
      console.log('onFilter')
      let result = [...this.clonedList]
      if (this.selectedCompany !== this.$v('전체') && this.selectedCompany) result = result.filter(x => x.companyName === this.selectedCompany)
      if (this.selectedOrganization !== this.$v('전체') && this.selectedOrganization) result = result.filter(x => x.groupName === this.selectedOrganization)

      if (this.searchKeyword) result = result.filter(x => x.projectName.includes(this.searchKeyword))

      this.taskData = result
    },
    getCommonCompany (row) {
      const { distributeGroup } = row
      if (distributeGroup.length === 1) return distributeGroup[0].groupName
      if (distributeGroup.length > 1) return `${distributeGroup[0].groupName} 외 ${distributeGroup.length - 1}`
      return ''
    },
    selectItem (params) {
      this.$router.push({
        name: this.routeDestinationByCsp,
        params
      })
    },
    async getProjectList () {
      try {
        const csp = {
          nutanix: 'NX',
          vmware: 'VMWARE'
        }[this.csp]
        const response = await API.iam.getCommonProjects({
          moduleType: csp
        })
        this.clonedList = cloneDeep(response)
        this.taskData = response
      } catch (error) {
        console.log(error)
      }
    }
  },
  data () {
    return {
      clonedList: [],
      selectedCompany: '',
      selectedOrganization: '',
      searchKeyword: '',
      taskData: [],
      tableColumns: [
        { binding: 'companyName', header: this.$v('관계사') },
        { binding: 'groupName', header: this.$v('조직') },
        { binding: 'projectName', header: this.$v('프로젝트명') },
        { binding: 'common', header: this.$v('1차 배부관계사'), customHtml: true },
        { binding: 'requesterName', header: this.$v('요청자') },
        { binding: 'userPosition', header: this.$v('직급') },
        { binding: 'createTime', header: this.$v('요청일'), customHtml: true }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  &::v-deep {
    .filtering-component {
      margin-bottom:20px;
    }
    .search-input {
      width:200px;
      .el-input__inner {
        border:none;
        width:200px;
        border-bottom:1px solid #3D435E;
      }
      .el-input__icon {
        color: #3D435E !important;
      }
    }
  }
}

</style>
