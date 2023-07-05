<template>
  <div
    class="set-resource-autoscale-group-list"
  >
    <!-- :element-loading-text="$t('common.PLACEHOLDER.loadingWait')" -->
    <resource-filter-component
      :table-data="filteredData"
      cloud-type="private"
      @reset="filteredStatus = ''"
    >
      <!-- @search="searchASG" -->
      <section class="filter-form">
        <!-- VM 상태 -->
        <span class="filter-name">{{ $t('autoScale.status') }}</span>
        <div class="filter-options">
          <el-select
            v-model="filteredStatus"
            :placeholder="$t('autoScale.status')"
            :popper-append-to-body="false"
            @change="filtering"
          >
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
      </section>
    </resource-filter-component>

    <section class="table-top-wrap">
      <total-count
        class="total-count-wrap"
        :total-count="totalResultCnt"
      >
        <search-component
          class="search-area"
          :placeholder="$t('autoScale.autoscaleGroupName')"
          @search="val => {
            filteredASGName = val
            filtering()
          }"
        />
      </total-count>
      <section class="button-area -right">
        <div
          v-if="checkedASG.length"
          v-loading="checkedASG ? checkedASG.map(v => v.vmStatus).includes('START') : false"
          :element-loading-text="$t('common.PLACEHOLDER.workingVm')"
          element-loading-spinner="el-icon-loading"
          element-loading-background="rgba(0, 0, 0, 0.8)"
        >
          <button
            class="button"
            type="is-primary"
            :disabled="checkedASG.length > 1"
            @click="e => {
              deleteASG()
            }"
          >
            삭제
          </button>
          <button
            v-loading="updateASGBtnLoading"
            class="button"
            type="is-primary"
            :disabled="checkedASG.length > 1"
            @click="e => {
              updateASG()
            }"
          >
            변경
          </button>
        </div>
        <button
          v-loading="createASGBtnLoading"
          class="button"
          type="is-primary"
          style="margin-left: 10px;"
          @click="clickCreateASGBtn"
        >
          오토스케일 그룹 추가
        </button>
      </section>
    </section>

    <section class="table-area">
      <!--  :column-data-map="columnDataMap"
        :init-custom-action="flex => this.grid = flex"
        :custom-init-filter="filter => this.gridFilter = filter"
        :init-auto-select-row="checkedASG"
        init-auto-select-row-key="userVmIdx" -->
      <cmp-grid
        v-loading="loading.isGetASGRequest"
        ref="asGroupGrid"
        class="route-detail-grid"
        :columns="columns"
        :item-source="filteredData"
        :use-excel-download="true"
        :changing-page-reset="false"
        :column-data-map="columnDataMap"
        @selectedRow="selectRow(...arguments, columns)"
        @total-count="cnt => totalResultCnt = cnt"
        @checkedRowsData="setCheckedItems"
        @changingPage="num => {
          activePageNum = num
        }"
        selectable
        use-checkbox
        header-checkbox
        page-keeping
      >
        <template #updateTime="props">
          {{ props.row.updateTime | date }}
        </template>
        <template #startTime="props">
          {{ props.row.startTime | date }}
        </template>
      </cmp-grid>
    </section>

    <!-- 모달 -->
    <!-- 자원 추가 -->
    <el-dialog
      v-loading="loading.createASG || loading.updateASG"
      :visible.sync="createModal"
      :title="updateASGData ? $t('autoScale.updateASG') : $t('autoScale.addASG')"
      width="1300px"
      top="5vh"
      @close="closeCreateModal"
    >
      <auto-scale-group-update-form
        ref="asgUpdateForm"
        :data="updateASGData"
        :vm-images="vmImages"
        :edit-mode="!!updateASGData"
        @save="confirmUpdate"
        @close="createModal = false"
        @done="getASGList(true)"
      />
      <!-- :selected-project="selectedProjectInfo" -->
    </el-dialog>
  </div>
</template>

<script>
import API, { ResourceFilterComponent } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import AutoScaleGroupUpdateForm from './AutoScaleGroupUpdateForm'

import GridUtils from '@/components/Utils/GridUtils'

export default {
  name: 'SetResourceAutoScaleGroupList',
  components: {
    AutoScaleGroupUpdateForm,
    ResourceFilterComponent
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType
    })
  },
  watch: {
    activePageNum: {
      handler (num) {
        sessionStorage.setItem('configServerGridPage', num)
      }
    }
  },
  async mounted () {
    // await this.getASGList()
    this.filteredData = [...this.tableData]
    this.$nextTick(function () {
      const initGridPage = sessionStorage.getItem('configServerGridPage')
      if (initGridPage && this.$refs.serverGrid) this.$refs.serverGrid.changingPage(Number(initGridPage))
    })
  },
  methods: {
    async updateASG () {
      this.updateASGBtnLoading = true
      this.updateASGData = { ...this.checkedASG[0] }
      console.log('@updateASG', this.updateASGData)
      await this.setVmImagesList()
    },
    async clickCreateASGBtn (e) {
      this.createASGBtnLoading = true
      this.updateASGData = null
      await this.setVmImagesList()
    },
    /**
     * vm 템플릿 이미지 리스트 데이터 세팅
     */
    async setVmImagesList () {
      const result = await API.compute.getOVAListAdmin({ isAutoScale: true })
      if (result.data) {
        const imageList = result.data.map(data => {
          return {
            templateName: data?.name || '-',
            parentVmName: data?.parentVmName || '-',
            osType: data.userInfo?.osType || '-',
            osName: data.userInfo?.osName || '-',
            osBit: data.userInfo?.osBit || '-',
            vCpu: data.spec?.numSockets ? data.spec.numSockets + ' Core' : '-',
            memory: data.spec?.memorySizeMib ? (data.spec?.memorySizeMib / 1024) + ' GB' : '-',
            rootDisk: data.userInfo?.osRootDiskSize ? data.userInfo?.osRootDiskSize + ' GB' : '-',
            ovaUuid: data?.ovaUuid || '-'
          }
        })
        this.vmImages = imageList
        this.createASGBtnLoading = false
        this.updateASGBtnLoading = false
        this.createModal = true
      }
    },
    /**
     * Auto Scale Group 추가/변경 모달 닫기
     */
    closeCreateModal () {
      this.$refs.asgUpdateForm.closeFunction()
      if (this.updateASGData) this.updateASGData = null
    },
    /**
     * Auto Scale Group 리스트 조회
     */
    async getASGList (param = false) {
      try {
        this.loading.isGetASGRequest = true
        const data = await API.compute.getAutoScaleGroupList()
        console.log('@getASGList:', data)

        this.asgInfoSetting(data, param)
      } catch (error) {
        console.error(error)
        this.tableData = []
      } finally {
        this.loading.isGetASGRequest = false
        this.$forceUpdate()
      }
    },
    /**
     * Auto Scale Group 데이터 가공
     */
    asgInfoSetting (data, param) {
      if (!data) {
        this.tableData = []
        return
      }
      data.sort((a, b) => {
        if (a.updateTime > b.updateTime) return -1
        if (a.updateTime < b.updateTime) return 1
        return 0
      })
      let statusKo
      const list = data.map(data => {
        switch (data.status) {
          case 'WAIT':
            statusKo = '대기'
            break
          case 'RUNNING':
            statusKo = '실행중'
            break
          case 'END':
            statusKo = '종료'
            break
          case 'SUCCESS':
            statusKo = '성공'
            break
          case 'FAIL':
            statusKo = '실패'
            break
        }
        return {
          autoScaleIdx: data.autoScaleIdx,
          autoScaleName: data.autoScaleName,
          ovaName: data.ova.name,
          status: data.status,
          statusKo: statusKo,
          companyName: data.companyName,
          groupName: data.groupName,
          projectName: data.projectName,
          autoScalePolicyCnt: data.autoScalePolicyList.length + ' 개',
          vmCount: data.vmCount + ' 개',
          currentVmCount: data.vmList.length ? data.vmList.length + ' 개' : '0 개',
          startTime: data.startTime,
          updateTime: data.updateTime,
          originData: data
        }
      })
      console.log('@asgInfoSetting', list)
      this.tableData = [...list]

      this.columnDataMap.startTime = GridUtils.setColumnDataMap('startTime', this.tableData, 'date')
      this.columnDataMap.updateTime = GridUtils.setColumnDataMap('updateTime', this.tableData, 'date')
      if (param) {
        this.filtering()
        this.checkedASG = []
      }
    },
    /**
     * 오토스케일 그룹명 필터링 이벤트
     */
    filtering () {
      console.log('@filtering', this.selectedProjectInfo, this.filteredStatus, this.filteredASGName)
      console.log(this.tableData)
      if (!this.selectedProjectInfo && !this.filteredStatus && !this.filteredASGName) {
        this.filteredData = this.tableData
      } else {
        this.filteredData = this.tableData.filter(item => {
          let result = true
          if (this.selectedProjectInfo?.companyIdx) {
            result = result && (item.originData.companyIdx === this.selectedProjectInfo.companyIdx)
          }
          if (this.selectedProjectInfo?.groupIdx) {
            result = result && (item.originData.groupIdx === this.selectedProjectInfo.groupIdx)
          }
          if (this.selectedProjectInfo?.projectIdx) {
            result = result && (item.originData.projectIdx === this.selectedProjectInfo.projectIdx)
          }
          if (this.filteredStatus) {
            result = result && (item.status === this.filteredStatus)
          }
          if (this.filteredASGName) {
            result = result && (item.autoScaleName?.toLowerCase().includes(this.filteredASGName?.toLowerCase()))
          }
          return result
        })
      }
    },
    /**
     * ASG 추가/변경 시, '저장'
     */
    confirmUpdate (payload) {
      let message
      payload.orderData.userVmIdx ? message = this.$t('common.CONFIRM.PROJECT.022') : message = this.$t('common.CONFIRM.PROJECT.013') // '자원을 수정하시겠습니까?' : ' 자원을 생성하시겠습니까?'
      this.$confirm(message).then(async () => {
        if (!payload.orderData.userVmIdx) {
          const result = await this.createVm(payload)
          if (result) this.createModal = false
        } else {
          const result = await this.updateVm(payload)
          if (result) {
            this.createModal = false
            this.setCheckedItems([])
          }
        }
      }).catch(() => false)
    },
    async searchASG (payload) {
      this.selectedProjectInfo = payload
      this.filtering()
    },
    routeTo (to) {
      this.$router.push(to)
    },
    selectRow (row, columns) {
      console.log('선택 row: ', row.dataItem.autoScaleIdx)
      this.routeTo({
        name: 'set-resource-autoscale-group-detail-vmw',
        params: {
          autoScaleGroupIdx: row.dataItem.autoScaleIdx
        }
      })
    },
    /**
     * 체크 된 항목 컨트롤
     */
    setCheckedItems (items) {
      console.log('@체크된 친구들: ', items)
      if (items.length) {
        this.checkedASG = [...items]
      } else {
        this.checkedASG = []
      }
    },
    /**
     * filteredData를 세팅합니다.
     * 세팅 전, 그리드의 sorting / filtering 상태를 기억했다가 filteredData 세팅 후 다시 설정해줍니다.
     */
    async deleteASG (checkedItems = this.checkedASG) {
      this.$confirm('선택한 오토스케일 그룹을 삭제하시겠습니까?').then(async () => {
        try {
          const res = await API.compute.deleteAutoScaleGroupByIdx(checkedItems[0].autoScaleIdx)
          if (res) {
            this.$alert('선택한 오토스케일 그룹이 삭제되었습니다.', {
              callback: () => {
                this.getASGList(true)
              }
            })
          }
        } catch (err) {
          if (err.code === 'COMMON0007') {
            this.$alert('생성 진행 중인 자원이 있습니다.<br>나중에 다시 시도해주세요.', {
              dangerouslyUseHTMLString: true
            })
          } else {
            this.$alert('삭제 실패했습니다.')
          }
        }
      }).catch(() => false)
    }
  },
  data () {
    return {
      createModal: false,
      loading: {
        isGetASGRequest: false,
        createASG: false,
        updateASG: false
        // convertVmPower: false,
        // cluster: false
      },

      ovaName: '', // OVA Name
      activePageNum: 1,
      totalResultCnt: 0,
      originGridState: null, // 인터벌 돌기 전, 그리드의 sorting/filtering 상태 저장

      filteredStatus: '', // 핉터링 > 상태
      filteredASGName: '', // 필터링 > 오토스케일 그룹명
      powerState: '', // 버튼 영역 > 파워 상태 선택

      checkedASG: [], // 체크한 vms
      // checkedASGUserVmIdx: [],
      modal: {
        controlVm: false, // vm 생성/변경 모달 active Handler
        cloneVm: false, // vm 복제
        migrateVm: false, // vm 이관
        ova: false // OVA Export
      },
      updateASGData: null, // 업데이트 할 ASG정보 (create일 때 null)
      cloneItemIsIpam: true, // 클론하는 vm이 IPAM 자원인지?

      // compute 데이터
      columns: [
        { binding: 'autoScaleName', header: '오토스케일 그룹명' },
        { binding: 'ovaName', header: '사용된 VM 이미지 명' },
        { binding: 'statusKo', header: '상태' },
        { binding: 'companyName', header: '관계사' },
        { binding: 'groupName', header: '조직' },
        { binding: 'projectName', header: '프로젝트' },
        { binding: 'autoScalePolicyCnt', header: '정책 수' },
        { binding: 'vmCount', header: '최소 VM 수' },
        { binding: 'currentVmCount', header: '현재 VM 수' },
        { binding: 'startTime', header: '그룹 시작 시간', customHtml: true },
        { binding: 'updateTime', header: '마지막 변경 시간', customHtml: true }
      ],
      tableData: [],
      filteredData: [],
      selectedProjectInfo: null,
      columnDataMap: {
        startTime: null,
        updateTime: null,
        externalDiskTotalSize: null
      },

      // 상태 옵션
      statusOptions: [
        { value: '', label: '전체' },
        { value: 'WAIT', label: '대기' },
        { value: 'RUNNING', label: '실행중' },
        { value: 'END', label: '종료' },
        { value: 'SUCCESS', label: '성공' },
        { value: 'FAIL', label: '실패' }
      ],
      createASGBtnLoading: false,
      updateASGBtnLoading: false,
      vmImages: [] // vm 템플릿 이미지 리스트
    }
  }
}
</script>

<style lang="scss" scoped>
.ova-export {
  .register-contents {
    &::v-deep .contents-title {
      min-width: 130px;
      width: 130px;
    }
  }
}

.set-resource-autoscale-group-list {
  .hostname-name-wrap {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .total-count-wrap {
    align-items: flex-start;
    flex-direction: column;
    .search-area { margin-top: $gap-s; }
  }

  // 카테고리 모달
  .el-popper.power-select-popper {
    padding-top: 5px;
    width: 120px;
    border-radius: $radius-s;
    background-color: transparent;
    border: none;
    > .el-scrollbar {
      > .el-select-dropdown__wrap.el-scrollbar__wrap {
        padding: 0;
        .el-select-dropdown__list {
          padding: 5px 0;
          > .el-select-dropdown__item {
            padding: 0 $gap-s;
            text-align: left;
            font-size: 12px;
          }
        }
      }
    }
  }
}

.new-tag-wh {
  display: inline-block;
  padding: 0 3px;
  width: 16px;
  min-height: 16px;
  line-height: 14px;
  text-align: center;
  color: $white;
  font-weight: bold;
  background-color: $primary;
  border: 1px solid $primary;
  // border-radius: 11px;
  font-size: 11px;
  &.-copy {
    background-color: #3C7D4F;
    border-color: #3C7D4F;
  }
  &.-delete {
    padding: 0 2px;
    width: auto;
    font-weight: normal;
    // color: $main-sred;
    background-color: $input-placeholder;
    border-color: $input-placeholder;
  }
}
</style>

<style lang="scss">
.set-resource-server-list {
  .button-area {
    > div.el-loading-parent--relative {
      .el-loading-mask { z-index: 1; }
      .el-loading-spinner {
        position: relative;
        top: auto;
        margin-top: 0;
        .el-icon-loading {
          position: absolute;
          left: 260px;
          margin-top: 2px;
          transform: translateX(-50%);
        }
        .el-loading-text { margin-top: 7px; }
      }
    }
  }

  // 인터벌 + 페이지네이션 때 알 수 없는 스크롤바 생김 방지
  .route-detail-grid {
    .wj-content {
      & > div {
        div[wj-part=root] {
          overflow: hidden !important;
        }
      }
    }
  }

  .power-state-select { // Power Off 영역
    width: 120px;
    margin: 0 $gap-s;
    > .el-input {
      &.el-input--suffix {
        > .el-input__inner {
            &:focus {
            background-color: darken($primary, 5%);
            color: $white;
          }
        }
      }
      &.is-focus {
        > .el-input__inner {
          background-color: darken($primary, 5%);
          color: $white;
            &:focus {
            color: $white;
            background-color: darken($primary, 5%);
          }
        }
      }
      > .el-input__inner {
        padding: 5px 10px 5px 15px;
        min-width: 30px;
        background-color: $primary;
        border: 1px solid $primary;
        font-size: 12px;
        text-align: left;
        color: $white;
        &::placeholder {
          color: $white;
        }
      }
      > .el-input__suffix {
        display: flex;
        align-items: center;
        right: 0;
        color: $white;
      }
    }

    .el-input.is-disabled {
      > .el-input__inner {
        background-color: $main-gray;
        border-color: $main-gray;
        opacity: .5;
        color:$color-grey;
        &:hover {
          background-color: $main-gray;
          border-color: $main-gray;
        }
      }
    }
  }
}
</style>
