<!--
  * 파일명 : ResourceOperationCompute.vue
  * 파일 기능 : 자원 운용 > Compute 자원 정보 (readOnly) 데이터를 보여주기만 할 뿐, 조작 하진 않습니다.
  * 작성자 : 김예담
  * 최종 작성일 : 2021-10-20
  * License By Shinsegae I&C
 -->

<template>
  <div class="operation-compute">
    <resource-title :count="totalResultCnt">
      VM
      <span v-if="deletable">
        &nbsp;
        ( Compute )
      </span>
    </resource-title>

    <button
      v-if="editable"
      class="button -common-button"
      :disabled="!checkedRows.length"
      @click="() => {
        updateVmData = [...checkedRows]
        modal.updateVm = true
      }"
    >
      공통사항 일괄 적용
    </button>

    <cmp-grid
      v-loading="loading"
      :item-source="gridData"
      :columns="gridColumns"
      :column-data-map="columnDataMap"
      :changing-page-reset="false"
      :init-custom-action="flex => {
        flex.rows.defaultSize = 90
        this.grid = flex
      }"
      :init-auto-select-row="initAutoSelectRow"
      :auto-row-heights="true"
      init-auto-select-row-key="vmUuid"
      header-checkbox
      page-keeping
      @checkedRowsData="checkHandler"
      @loaded-rows="onLoadedRows"
      @total-count="cnt => totalResultCnt = cnt"
      class="resource-operation-grid"
    >
      <template #companyName="{ row }">
        <span
          class="after-data"
          v-if="row.afterData && row.companyName"
        >{{ row.companyName }}</span>
        <span v-else>{{ row.companyName || '-' }}</span>
      </template>
      <!-- 관계사 -->

      <template #groupName="{ row }">
        <span
          class="after-data"
          v-if="row.afterData && row.afterData.groupName"
        >{{ row.afterData.groupName }}</span>
        <span v-else>{{ row.groupName || '-' }}</span>
      </template>
      <!-- 조직 -->

      <template #projectName="{ row }">
        <span
          class="after-data"
          v-if="row.afterData && row.afterData.projectName"
        >{{ row.afterData.projectName }}</span>
        <span v-else>{{ row.projectName || '-' }}</span>
      </template>
      <!-- 프로젝트 -->

      <template #appTaskUsersName="{ row }">
        <div v-if="row.afterData && row.afterData.appTaskUser && row.afterData.appTaskUser.length">
          <el-tooltip
            v-if="row.afterData.appTaskUser.length > 1"
            placement="top"
            effect="light"
          >
            <template #content>
              <span v-html="ArrayjoinWithHtml(row.afterData.appTaskUser, true)" />
            </template>
            <p class="after-data">
              {{ row.afterData.appTaskUser[0].appTaskUserName }}({{ row.afterData.appTaskUser[0].appTaskUserId | maskingName }}) <br>
              외 {{ row.afterData.appTaskUser.length - 1 }} 명
            </p>
          </el-tooltip>
          <span
            v-else
            class="after-data"
          >
            {{ row.afterData.appTaskUser[0].appTaskUserName }}({{ row.afterData.appTaskUser[0].appTaskUserId | maskingName }})
          </span>
        </div>

        <div v-else-if="row.appTaskUser && row.appTaskUser.length">
          <el-tooltip
            v-if="row.appTaskUser.length > 1"
            placement="top"
            effect="light"
          >
            <template #content>
              <span v-html="ArrayjoinWithHtml(row.appTaskUser, true)" />
            </template>
            <p>
              {{ row.appTaskUser[0].appTaskUserName }}({{ row.appTaskUser[0].appTaskUserId | maskingName }}) <br>
              외 {{ row.appTaskUser.length - 1 }} 명
            </p>
          </el-tooltip>

          <span v-else>{{ row.appTaskUser[0].appTaskUserName }}({{ row.appTaskUser[0].appTaskUserId | maskingName }})</span>
        </div>
        <span v-else>-</span>
      </template>
      <!-- 현재 APP 담당자 -->

      <template #createTime="{ row }">
        {{ row.userInfo.createTime | dateSimple }}
      </template>
      <!-- 자원 생성일 -->

      <template #hostname="{ row }">
        <div
          class="hostname-name-wrap"
          v-if="row.name"
        >
          <cmp-status-tag
            v-if="row.market"
            type="mp"
            contents="MP"
          />
          {{ row.name || row.vmName }}
        </div>
        <span v-else>-</span>
      </template>
      <!-- 호스트 명 -->

      <template #osName="{ row }">
        <set-os-icon
          v-if="row.afterData && row.afterData.osName"
          class="after-data"
          :os-name="row.afterData.osBit ? `${row.afterData.osName} (${row.afterData.osBit})` : row.afterData.osName"
        />
        <set-os-icon
          v-else-if="row.osName"
          :os-name="row.osBit ? `${row.osName} (${row.osBit})` : row.osName"
        />
        <span v-else>-</span>
      </template>
      <!-- OS Version(Bits) -->
      <template #networkList>
        <ul v-if="vmDetailData.networkList && vmDetailData.networkList.length > 0">
          <li
            v-for="(net, netIdx) in vmDetailData.networkList"
            :key="netIdx"
          >
            {{ net.deviceName || net.name }}&nbsp;{{ net.cateKey ? `(${net.cateKey})` : '' }}
          </li>
        </ul>
        <span
          v-else
          class="empty-content"
        >-</span>
      </template>

      <template #networkCateKey="{ row }">
        <div v-if="row.userInfo.networkList.length > 0">
          <span
            v-for="( item, index ) in row.userInfo.networkList"
            :key="index"
            class="hostname-name-wrap"
          >
            {{ item.cateKey }}
          </span>
        </div>
        <span v-else>-</span>
      </template>

      <!-- 네트워크 조직 -->

      <template #specInfo="{ row }">
        <p style="line-height: 1.6;">
          vCPU: {{ row.userInfo.vcpu || 0 }}Core,&ensp;
          RAM: {{ row.memory || 0 }}GB,&ensp;
          Disk: {{ row.rootDiskTd || '0GB' }}
        </p>
        <div
          class="external-disk-wrapper"
        >
          <span>Local Disk&nbsp;({{ row.externalDiskTotalCount }}EA) </span>
          <span
            v-show="row.externalDiskTotalCount !== 0"
            style="margin-right: 5px;"
          >: {{ row.externalDiskTotalSize + 'GB' }}</span>
          <!-- <p class="join-comma-list">
            <span
              v-for="(disk, idx) in row.userInfo.externalDiskList"
              :key="`disk${idx}`"
            >
              {{ disk.size + 'GB' }}
            </span>
          </p> -->
        </div>
      </template>
      <!-- 기본사양 -->

      <template #ips="{ row }">
        <div v-if="row.hostInfo.name && row.hostInfo.name.length">
          {{ row.hostInfo.name }}<!--{{ $t('common.TERMS.other') }} -->
          <!-- <el-tooltip
            v-if="row.hostInfo.name.length > 1"
            placement="bottom-end"
            popper-class="panel-title-popper"
            effect="light"
          >
            <template #content>
              <span v-html="ArrayjoinWithHtml(row.hostInfo.name)" />
            </template>
            <span>{{ row.hostInfo.name }} {{ $t('common.TERMS.other') }} {{ row.hostInfo.name.length - 1 }}</span>
          </el-tooltip> -->

          <!-- <span>{{ row.hostInfo.name }}</span> -->
        </div>
        <span v-else>-</span>
      </template>
      <!-- VM(Host)IP -->

      <template #installPrograms="{ row }">
        <el-tooltip
          v-if="row.afterData && row.afterData.userInfo.installProgramList && row.afterData.userInfo.installProgramList.length"
          placement="bottom-end"
          popper-class="panel-title-popper"
          effect="light"
        >
          <template #content>
            <span v-html="ArrayjoinWithHtml(row.afterData.userInfo.installProgramList)" />
          </template>
          <span class="after-data">{{ row.afterData.userInfo.installProgramList.length }}EA</span>
        </el-tooltip>

        <el-tooltip
          v-else-if="row.userInfo.installProgramList.length"
          placement="bottom-end"
          popper-class="panel-title-popper"
          effect="light"
        >
          <template #content>
            <span v-html="ArrayjoinWithHtml(row.userInfo.installProgramList)" />
          </template>
          <span> {{ row.userInfo.installProgramList.length }}EA</span>
        </el-tooltip>
        <span v-else>0EA</span>
      </template>
      <!-- install Program -->

      <!-- ///////////////////////// 미등록 자원 관리에 추가 /////////////////////// -->
      <template #loadbalance="{ row }">
        <span
          class="after-data"
          v-if="row.afterData && row.afterData.loadbalance"
        >{{ row.afterData.loadbalance === 'none' ? $v('선택 안 함') : row.afterData.loadbalance.toUpperCase() }}</span>
      </template>
      <!-- 로드밸런스 -->

      <template #appManageTeam="{ row }">
        <span
          class="after-data"
          v-if="row.afterData && row.afterData.appManageTeam"
        >{{ row.afterData.appManageTeam.groupName }}</span>
      </template>
      <!-- APP 운영팀 -->

      <template #serverManager="{ row }">
        <span
          class="after-data"
          v-if="row.afterData && row.afterData.roleName"
        >{{ row.afterData.roleName }}</span>
      </template>
      <!-- 서버담당자 -->

      <template #servicePartName="{ row }">
        <span
          class="after-data"
          v-if="row.afterData && row.afterData.servicePartName"
        >{{ row.afterData.servicePartName }}</span>
      </template>
      <!-- 서비스 구분 -->

      <template #serviceTypeName="{ row }">
        <span
          class="after-data"
          v-if="row.afterData && row.afterData.serviceTypeName"
        >{{ row.afterData.serviceTypeName }}</span>
      </template>
      <!-- 서비스 유형 -->

      <template #serviceDate="{ row }">
        <span
          class="after-data"
          v-if="row.afterData && row.afterData.serviceDate"
        >{{ row.afterData.serviceDate | date }}</span>
      </template>
      <!-- 서비스 개시일 -->

      <template #chargeDate="{ row }">
        <span
          class="after-data"
          v-if="row.afterData && row.afterData.chargeDate"
        >{{ row.afterData.chargeDate | date }}</span>
      </template>
      <!-- 과금 시작일 -->

      <template #deleting="{ row }">
        <div class="flex-wrap">
          <button
            v-if="editable"
            class="button"
            type="is-icon"
            @click.stop="() => {
              updateVmData = [{...row}]
              modal.updateVm = true
            }"
          >
            <i class="-edit-icon" />
          </button>
          <button
            v-if="deletable"
            class="button"
            type="is-icon"
            @click.stop="clickDelete(row)"
          >
            <i class="delete-icon" />
          </button>
        </div>
      </template>
    </cmp-grid>

    <!-- 자원 변경 -->
    <!-- <el-dialog
      :visible.sync="modal.updateVm"
      :title="$t('common.TERMS.resourceUpdate')"
      :before-close="beforeCloseModal"
      width="1300px"
      top="5vh"
      @close="modal.updateVm = false"
    >
      <compute-update-form
        v-if="modal.updateVm"
        v-loading="loading.createVm || loading.updateVm"
        @close="modal.updateVm = false"
        @save="confirmUpdateRow"
        :data="updateVmData"
      />
    </el-dialog> -->
  </div>
</template>

<script>
import { uniqBy } from 'lodash'
import ResourceTitle from './ResourceTitle.vue'
import GridUtils from '@/components/Utils/GridUtils'
import ResourceOperationMixins from './ResourceOperation.mixins.js'
import { SetOSIcon } from '@sd-fe/cmp-core'
// import ComputeUpdateForm from '@/components/Modal/UpdateResource/ComputeUpdateForm/ComputeUpdateForm'

export default {
  name: 'ResourceOperationCompute',
  mixins: [ResourceOperationMixins],
  components: {
    'set-os-icon': SetOSIcon,
    ResourceTitle
    // ComputeUpdateForm,
  },
  props: {
    data: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    deletable: { // row 식제 아이콘 노출 여부
      type: Boolean,
      default: false
    },
    editable: { // row 편집 아이콘 노출 여부
      type: Boolean,
      default: false
    },
    initAutoSelectRow: {
      type: Array,
      default: () => []
    },
    checkedResources: {
      type: Array,
      default: () => []
    },
    onlyRegister: { // 기등록 자원만 보고 싶을 때
      type: Boolean,
      default: false
    },
    onlyUnregister: { // 미등록 자원만 보고 싶을 때
      type: Boolean,
      default: false
    },
    columns: { // custom 컬럼 설정
      type: Array,
      default: undefined
    }
  },
  watch: {
    data: {
      immediate: true,
      handler (list) {
        // console.log('@COMPUTE: ', list)
        this.setGridInfo(list)
        // this.gridRefresh(this.grid)
      }
    }
  },
  computed: {
    gridColumns () {
      const baseColumns = this.columns || this.defaultColumns

      const deleteCol = { binding: 'deleting', header: ' ', customHtml: true, width: 100, sorting: false }

      if (this.deletable || this.editable) return [...baseColumns, { ...deleteCol }]
      else return baseColumns
    }
  },
  methods: {
    setGridInfo (data) {
      const mappedPkgNames = []

      const result = data.map(row => {
        // App 담당자
        row.appTaskUsersName = ''
        if (row.appTaskUser?.length) {
          row.appTaskUsersName = row.appTaskUser.map(usr => usr.appTaskUserName).join(',')
        }

        // 네트워크 조직
        row.networkCateKey = ''
        if (row.nics?.length) {
          row.networkCateKey = row.nics[0].cateKey
        }

        // Ip
        if (row.nicIps?.length) {
          // row.ips = row.nicIps.filter(ip => ip.nicIpType === 'ASSIGNED')
          row.ips = uniqBy(row.nicIps, 'ipAddress')
            .filter(item => item.ipAddress)
            .map(ip => { return ip.ipAddress })
        }

        // Local Disk
        row.externalDiskList = []
        if (row.disks) {
          row.rootDisk = {}
          for (let i = 0; i < row.disks.length; i++) {
            if (
              row.disks[i].isCdrom ||
              (row.disks[i].deviceType === 'CDROM' || row.disks[i].deviceBus === 'IDE')
            ) continue

            row.disks[i].diskSize = this.$options.filters.byteToGb(row.disks[i].vmDiskSize)

            if (
              (row.disks[i].deviceIndex === 0 || row.disks[i].diskIndex === 0) &&
              row.disks[i].deviceBus === 'SCSI'
            ) {
              row.rootDisk = row.disks[i]
            } else {
              row.externalDiskList.push(row.disks[i])
            }
          }
        }

        // RootDisk
        row.rootDiskTd = row.rootDisk?.diskSize // rootDisk
          ? this.$options.filters.GB(row.rootDisk.diskSize)
          : row.rootDiskSize
            ? row.rootDiskSize + 'GB'
            : 0

        // Install Program : 설치프로그램
        row.installPrograms = []
        if (row.installProgramList) {
          row.installPrograms = row.installProgramList.map(item => {
            mappedPkgNames.push({
              value: item.softwareName,
              caption: item.softwareName
            })
            return `${item.softwareName} ${item.versionName}`
          })
        }

        return {
          ...row,
          checked: this.setRowCheckState(row),
          hostname: row.hostname,
          companyName: row.companyName || '',
          groupName: row.groupName || '',
          projectName: row.projectName || '',
          osName: row.osName || '',
          ips: row.ips?.length ? row.ips : ''
        }
      })

      // columnDataMap 세팅
      this.columnDataMap = {
        installPrograms: Array.from(new Set(mappedPkgNames)),
        createTime: GridUtils.setColumnDataMap('createTime', this.gridData, 'date')
      }

      this.gridData = result
    },
    checkHandler (items) {
      const originCheckedData = this.checkedResources

      const temp = uniqBy([...this.gridData, ...originCheckedData], 'userVmIdx')
      const newCheckedRows = temp.filter(row => row.checked)

      this.$emit('checkedRowsData', newCheckedRows)

      this.checkedRows = newCheckedRows
    },
    /**
     * 배열 순회하며 <br/>로 묶어서 리턴
     * @param {Array} list 순회 할 배역
     * @param {Boolean} isUser App 담당자면 true
     */
    ArrayjoinWithHtml (list, isUser = false) {
      const startNum = isUser ? 1 : 0 // 첫번째 요소도 함께 노출되면 0, 빼고 노출되면 1
      if (startNum && list.length <= 1) return

      let revealText = ''

      for (let i = startNum; i < list.length; i++) {
        const unit = () => {
          if (i === startNum) return ''
          if (startNum) return (i % 2 ? ',<br>' : ', ')
          else return (i % 2 ? ', ' : ',<br>')
        }

        if (isUser) { // App 담당자?
          revealText += unit() + `${list[i]?.appTaskUserName}(${this.$options.filters.maskingName(list[i].appTaskUserId)})`
        } else revealText += (unit() + list[i])
      }
      return revealText
    },
    /**
     * row 삭제 시, 발생 이벤트
     */
    clickDelete (row) {
      if (!this.deletable) return false

      this.$emit('delete-row', row)
    },
    /**
    * 모달 닫기 전, 정말 취소하겠냐는 알람
    */
    beforeCloseModal (done) {
      this.$confirm(this.$v('내용을 저장하지 않고 취소하시겠습니까?'))
        .then(() => {
          done()
        }).catch(() => false)
    },
    gridRefresh (grid = this.grid) {
      const cv = grid?.collectionView
      if (cv) cv.refresh()
    }
  },
  data () {
    return {
      gridData: [],
      checkedRows: [],
      totalResultCnt: 0,
      defaultColumns: [
        { binding: 'companyName', header: '관계사', keyPath: 'common.TERMS.rel', customHtml: true },
        { binding: 'groupName', header: '조직', keyPath: 'common.TERMS.group', customHtml: true },
        { binding: 'projectName', header: '프로젝트', keyPath: 'common.TERMS.project', customHtml: true },
        // { binding: 'appTaskUsersName', header: '현재 App 담당자', keyPath: 'config.TRANSFER.curAppManager', customHtml: true },
        { binding: 'createTime', header: '자원생성일', customHtml: true, keyPath: 'common.REGCON.createTime' },
        { binding: 'hostname', header: 'VM(Host)명', keyPath: 'config.TRANSFER.vmHostName', customHtml: true, width: 180 },
        { binding: 'osName', header: 'OS Version(Bits)', customHtml: true },
        { binding: 'networkCateKey', header: '네트워크 조직', keyPath: 'common.GRID.COMPUTE.networkOrg', customHtml: true },
        { binding: 'ips', header: 'VM(Host)IP', customHtml: true },
        { binding: 'specInfo', header: '기본사양', keyPath: 'config.TRANSFER.defaultSpec', customHtml: true, width: 250, filtable: false },
        { binding: 'installPrograms', header: 'Install Program', customHtml: true }
      ],
      byteToGb: (size) => {
        if (size) return this.$options.filters.byteToGb(size)
        else return 0
      },
      columnDataMap: {
        appTaskUser: [],
        createTime: [],
        installPrograms: []
      },
      searchableColumns: [ // 검색시 사용. 지우지 마세요.
        { binding: 'hostname', label: this.$t('common.GRID.hostName') }, // 호스트 명
        { binding: 'appTaskUsersName', label: this.$t('config.TRANSFER.appManager') }, // APP 담당자
        { binding: 'ips', label: 'IP' }
      ],

      updateVmData: [],
      modal: {
        updateVm: false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .operation-compute {
    position: relative;
    .-common-button {
      position: absolute;
      top: -10px;
      right: 0;
    }
  }
  .external-disk-wrapper {
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .after-data { color: $sea-blue; }
</style>
