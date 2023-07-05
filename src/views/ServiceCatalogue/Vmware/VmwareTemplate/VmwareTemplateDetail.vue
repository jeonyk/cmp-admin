<template>
  <div
    v-loading="isLoadingDetailData || isInfoUpdating"
    class="vm-template-detail"
    style="min-height: 700px;"
  >
    <div v-if="!isLoadingDetailData && !isEmpty(detailInfo)">
      <vmware-template-item
        :data="!isEmpty(detailInfo) ? detailInfo : null"
        theme="dark"
        @refresh="init()"
        @changeIsPub="value => detailInfo.isPub = value"
        editable
      />

      <p class="small-title">
        {{ $t('common.GRID.resChangeableInfo') }}
        <!-- 자원 변경 가능 정보 -->
      </p>

      <vertical-table
        v-if="!isEmpty(detailInfo)"
        :data="detailInfo"
        :columns="columns.updateColumns"
      >
        <!-- table-type="input" -->
        <cmp-grid
          v-loading="isGetImages"
          slot="image"
          class="form-common"
          :item-source="images"
          selectable
          @selectedRow="(rowGroup) => {
            const row = rowGroup ? rowGroup._data : null
            selectImageFunction(row)
          }"
          :columns="columns.imageColumns"
          :init-auto-select-row="detailInfo.selectImage"
          init-auto-select-row-key="userImageIdx"
          :use-excel-download="false"
          ref="imageGridRef"
        />
        <!-- @loaded-rows="onLoadedRows" -->
        <!-- 이미지 -->

        <template #externalDisk>
          <ul
            class="external-disk-list"
            v-if="detailInfo.externalDiskList && detailInfo.externalDiskList.length"
          >
            <li
              class="external-disk-item"
              v-for="disk in detailInfo.externalDiskList"
              :key="disk.diskKey"
            >
              <span v-if="disk.unitNumber === 0 && disk.controllerKey === 1000">
                {{ disk.name }}
                <small>(SCSI 0:0)</small>
              </span>
              <el-input
                v-else
                :placeholder="$v('디스크명')"
                v-model="disk.diskName"
                class="disk-name-input"
              />
              <small>{{ `(SCSI ${disk.busNumber}:${disk.unitNumber})` }}</small>
              <span>{{ disk.size }}&nbsp;GB</span>
            </li>
          </ul>
          <span v-else>-</span>
        </template>
        <!-- Local Disk -->

        <template #installProgram>
          <select-install-program-grid
            v-if="!isEmpty(detailInfo.selectImage)"
            class="form-common"
            :item-source="osSystem ? installProgramList : []"
            @change="items => {
              detailInfo.installProgramList = items
            }"
            :sync-data="detailInfo.installProgramList"
            ref="installProgramRef"
          />
          <span
            v-else
            class="empty-data"
          >{{ $v('이미지를 선택해주세요.') }}</span>
        </template>
        <!-- 설치프로그램 -->

        <el-input
          slot="summary"
          v-model="detailInfo.summary"
          resize="none"
          type="textarea"
          :placeholder="$t('admin.PREF.explain')"
          :autosize="{ minRows: 3, maxRows: 6}"
        />
        <!-- 설명 -->
      </vertical-table>

      <div class="button-area -form-bottom -center">
        <el-tooltip
          :disabled="!isUnregistered"
          placement="top"
          effect="light"
        >
          <div
            slot="content"
            v-html="'등록 템플릿만 삭제 가능합니다.'"
          />
          <span style="margin-right: 10px;">
            <button
              class="button"
              type="is-anti"
              size="is-large"
              :disabled="isUnregistered"
              @click="deleteItem"
            >
              {{ $v('삭제') }}
            </button>
          </span>
        </el-tooltip>

        <button
          class="button"
          size="is-large"
          @click="routeTo({ name: 'vm-template-list-vmw' })"
        >
          {{ $v('목록') }}
        </button>
        <button
          class="button"
          type="is-primary"
          size="is-large"
          @click="updateFn"
        >
          {{ $v('저장') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import API, { VerticalTable, SelectInstallProgramGrid } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import { isEmpty, groupBy, cloneDeep } from 'lodash'
import VmwareTemplateItem from './VmwareTemplateItem.vue'
import { Tooltip } from '@grapecity/wijmo'

export default {
  name: 'VmwareTemplateDetail',
  components: {
    VerticalTable,
    SelectInstallProgramGrid,
    VmwareTemplateItem
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    }),
    isUnregistered () { // 미등록 템플릿?
      if (isEmpty(this.detailInfo)) return false
      return !this.detailInfo.templateIdx
    }
  },
  watch: {
    // osType (newOS, oldOS) {
    //   if (!oldOS) return

    //   this.detailInfo.installProgramList = []
    //   if (newOS) {
    //     const installListData = this.installListByOsType[newOS]
    //     if (installListData) installListData.forEach(row => { row.checked = false })
    //   }
    // },
    defaultOsSystem () {
      this.setPartionNameDescTooltip(this.defaultOsSystem) // 파티션명 양식 툴팁 설정
    }
  },
  async created () {
    await this.init(true)
  },
  methods: {
    async selectImageFunction (row) {
      if (row) {
        this.detailInfo.selectImage = row
        const { osType, osSystem, osBit, osVersion } = row

        this.osSystem = osSystem
        if (this.osSystem) {
          this.defaultOsSystem = ['WINDOWS', 'LINUX'].find(os => osSystem.includes(os))
          await this.getUsableInstallList({
            osType,
            osSystem,
            osVersion,
            bitType: osBit
          })
        }
      } else {
        this.detailInfo.selectImage = null
        this.osType = null
        this.defaultOsSystem = null
        this.installProgramList = []
      }
      this.$forceUpdate()
    },
    init (isInit = false) {
      Promise.all([
        this.getVmwareTemplateDetail(),
        this.getVMwareImages() // 이미지 목록 조회
        // this.getUsableInstallList() // 설치프로그램 목록 조회
      ]).then(async () => {
        await this.setDetailData()
        if (isInit) {
          this.addBreadcrumbs(
              this.detailInfo?.templateName
                ? this.detailInfo.templateName
                : '상세'
          )
        }
      })
    },
    async getVmwareTemplateDetail () {
      try {
        this.isLoadingDetailData = true

        const key = {
          idx: 'templateIdx',
          uuid: 'vmUuid'
        }[this.$route.params.key]

        const payload = {}
        payload[key] = this.$route.params.id

        const { data } = await API.vmware.template.getVmwareTemplateDetail(payload)
        this.originInfo = data
        console.log('⭐️this.originInfo: ', this.originInfo)
      } catch (error) {} finally {
        this.isLoadingDetailData = false
      }
    },

    async setDetailData (data = this.originInfo) {
      const {
        vm,
        vcpu,
        memory,
        installProgramList,
        imageId,
        isPub,
        summary,
        externalDiskList
      } = data
      const selectImage = imageId !== undefined ? this.images.find(img => img.userImageIdx === imageId) : null
      if (selectImage) await this.selectImageFunction(selectImage)

      // Local Disk
      let allDisks = []
      if (vm?.diskList) {
        allDisks = this.joinExternalDisks(vm.diskList, externalDiskList, vm?.scsiControllerList)
      }
      const rootDisk = vm?.diskList.find(disk => disk.unitNumber === 0 && disk.controllerKey === 1000)

      const detailInstallData = installProgramList || []
      const list = []
      if (detailInstallData?.length && this.osSystem && this.installProgramList?.length) {
        detailInstallData.forEach(program => {
          this.installProgramList.forEach(item => {
            if (`${program.softwareId}` === `${item.softwareId}`) {
              item.selectedVersion = program.versionId
              list.push(item)
            }
          })
        })
      }

      const settedData = {
        ...data,
        ...this.detailInfo,
        vcpu: (vcpu || vm?.cpuCores)
          ? (vcpu || vm?.cpuCores) + ' Core'
          : '-',
        memory: (memory || vm?.memorySize)
          ? (memory || this.$options.filters.MB(vm?.memorySize))
          : '-',
        rootDiskSize: (rootDisk?.diskSize || 0) + ' GB',
        // selectImage,
        externalDiskList: [...allDisks],
        installProgramList: list,
        summary,
        osSystem: selectImage?.osSystem,
        osType: selectImage?.osType,
        osBit: selectImage?.osBit,
        isPub: !!isPub
      }
      this.detailInfo = settedData

      this.setImageGridPage(this.detailInfo.selectImage)

      const ref = this.$refs?.installProgramRef
      if (ref) ref.gridRefresh()
    },
    /**
   * 삭제
   */
    async deleteItem () {
      this.$confirm(this.$t('common.CONFIRM.BASE.032'))
        .then(async () => {
          try {
            this.isInfoUpdating = true
            const key = {
              idx: 'templateIdx',
              uuid: 'vmUuid'
            }[this.$route.params.key]

            // 관-조-프 IDX 같은 값 고정으로... 업무를 타지도, 긴급도 따로 없어서 임의이 값을 넣어도 무관
            const reqObj = {
              beforePrice: 0,
              groupIdx: 0,
              groupName: '0',
              isUrgent: false,
              price: 0,
              projectIdx: 0,
              requestData: {
                reqUserId: this.user.userId,
                ...(key === 'templateIdx' && { templateIdx: this.detailInfo.templateIdx }),
                ...(key === 'vmUuid' && { vmUuid: this.detailInfo?.vm?.vmUuid })
              },
              service: 'VMW_VM_TEMPLATE',
              userId: this.user.userId,
              userName: this.user.userName
            }

            const result = await API.work_v3.deleteVmwareOVA(reqObj)

            if (result) this.$alert(this.$v('삭제하였습니다.'), { callback: () => this.routeTo({ name: 'vm-template-list-vmw' }) })
          } catch (error) {
            console.log(error)
            this.$alert(this.$v('삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), { dangerouslyUseHTMLString: true })
          } finally {
            this.isInfoUpdating = false
          }
        }).catch(() => false)
    },
    updateFn () {
      const { createTime, externalDiskList, selectImage, isPub, vm, installProgramList, summary } = this.detailInfo

      const extraDisk = externalDiskList?.filter(disk => disk.unitNumber !== 0) // 루트 디스크가 아닌 디스크들
      const isAllDiskName = () => { // Local Disk 이름이 모두 설정되어 있는지?
        if (!extraDisk?.length) return true
        return extraDisk?.every(item => item.diskName?.trim())
      }

      const isDuplicatedDiskName = () => {
        if (!extraDisk?.length) return true

        const diskNames = extraDisk?.map(item => item.diskName)
        return diskNames?.length === new Set(diskNames).size
      }

      // 예약 파티션 명인지 검사
      const availableDiskName = () => {
        if (!extraDisk?.length) return true

        if (!this.defaultOsSystem) return true
        else if (!this.diskInfo[this.defaultOsSystem]) return true
        else return extraDisk?.every(item => !item.diskName || !this.diskInfo[this.defaultOsSystem]?.unauthorized?.includes(item.diskName))
      }

      const checkValidItems = [
        { image: selectImage }, // 이미지 - 생성 검사
        { isExternalDiskName: isAllDiskName() }, // Local Disk - 생성 검사
        { duplicateDiskName: isDuplicatedDiskName() }, // Local Disk - 중복 검사
        { availableDiskName: availableDiskName() } // Local Disk - 예약 파티션 명 포함 검사
      ]
      if (!this.noEmptyContents(checkValidItems)) return

      const key = {
        idx: 'templateIdx',
        uuid: 'vmUuid'
      }[this.$route.params.key]

      const payload = {
        createTime,
        externalDiskList,
        imageId: selectImage?.imageId || selectImage?.userImageIdx,
        vmUuid: vm?.vmUuid,
        installProgramList: installProgramList,
        isPub,
        reqUserId: this.user.userId,
        summary,
        updateTime: +new Date(Date.now()),
        ...(key === 'templateIdx' && { templateIdx: this.detailInfo.templateIdx })
      }
      this.updateVmwareTemplate(payload)
    },
    async updateVmwareTemplate (payload) {
      const message = this.$v('자원을 수정하시겠습니까?')
      this.$confirm(message).then(async () => {
        try {
          this.isInfoUpdating = true
          const { data: result } = await API.vmware.template.updateVmwareTemplate(payload)
          if (result?.isSuccess) {
            this.$alert(this.$v('수정되었습니다.'), {
              callback: () => {
                if (!this.isUnregistered) this.init() // 기등록
                else { // 미등록 최초 업데이트 후
                  if (result?.data) {
                    const afterUpdateTemplateData = JSON.parse(result.data)
                    if (afterUpdateTemplateData?.templateIdx) {
                      this.$router.replace({
                        name: 'vm-template-detail-vmw',
                        params: {
                          key: 'idx',
                          id: afterUpdateTemplateData?.templateIdx
                        }
                      })
                      this.init(true)
                    }
                  } else this.init()
                }
              }
            })
          } else throw result
        } catch (error) {
          console.error(error)
          this.$alert(this.$v('수정에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), { dangerouslyUseHTMLString: true })
        } finally {
          this.isInfoUpdating = false
        }
      }).catch(() => false)
    },
    /**
     * API: 이미지 조회
     */
    async getVMwareImages () {
      try {
        this.isGetImages = true
        this.images = []
        const data = await API.vmware.image.getVMwareImageList({ isDisplay: true })
        this.images = data
      } catch (error) {
        console.error('VMware 이미지 조회에 문제가 발생했습니다.', error)
        this.images = []
      } finally {
        this.isGetImages = false
      }
    },
    /**
     * API: 설치프로그램 조회
     */
    async getUsableInstallList (params) {
      try {
        this.isGetInstall = true
        const data = await API.sw.getUsableInstallList({
          onlyUsable: true,
          ...params
        })
        const installsGroupedById = groupBy(data, 'id')
        const installList = []

        for (const [key, value] of Object.entries(installsGroupedById)) {
          // 이미 선택된 설치프로그램인지 판단
          const findPreInstallItem = this.detailInfo?.installProgramList?.find(item => item.softwareId === key)

          const versionOptions = value.map(version => {
            return {
              versionId: version.versionId,
              versionName: version.version,
              swIdx: version.swIdx,
              swList: version.swList,
              installType: version.installType
            }
          })

          const sw = value[0]

          const item = {
            checked: !!findPreInstallItem,
            softwareName: sw.name,
            softwareId: key,

            osSystem: sw.osSystem,
            osType: sw.osType,
            osBit: sw.bitType,
            selectedVersion: findPreInstallItem?.versionId || (versionOptions.length ? versionOptions[0].versionId : ''),
            versionOptions
          }
          installList.push(item)
        }

        this.installProgramList = installList
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.installProgramList = []
        return this.$alert(message)
      } finally {
        this.isGetInstall = false
      }
    },
    checkDiskNamePath () {
      let pass = true
      const diskList = this.detailInfo.externalDiskList
      for (let i = 0; i < diskList.length; i++) {
        const name = diskList[i].diskName
        const re = name?.match(this.regex[this.defaultOsSystem])
        if (re === null) {
          this.$alert(this.$t('common.ALERT.PROJECT.046', { path: name }), () => false)
          // Local Disk Path로 '${this.customMemoryName}'은(는) 적합하지 않습니다.
          pass = false
          break
        }
      }
      return pass
    },
    /**
     * 빈 항목이 있으면 alert 메세지 출력
     * @param {Array} checkItems 체크할 키 : 값 모음
     * @return {Boolean} 빈 항목이 유무 리턴, 빈 항목이 있으면 false 반환
     */
    noEmptyContents (checkItems) {
      if (!checkItems?.length) return
      // if (!this.checkDiskNamePath()) return

      const message = {
        image: '이미지를 선택해주세요.',
        isExternalDiskName: 'Local Disk 명을 모두 설정해주세요.',
        duplicateDiskName: '중복된 Local Disk 이름이 있습니다.',
        availableDiskName: '시스템 예약 파티션 명은 사용할 수 없습니다.'
      }

      let pass = true

      for (let i = 0; i < checkItems.length; i++) {
        const key = Object.keys(checkItems[i])[0]
        const value = checkItems[i][key]
        const flag = value === '' ||
          value === false ||
            value === null ||
            value === undefined ||
            (value && typeof value === 'object' && isEmpty(value)) ||
            (Array.isArray(value) && !value.length) ||
            (Object.keys(checkItems[i]).includes('flag') && !checkItems[i].flag)

        if (flag) { // value가 비어있을 때 alert창을 띄워줍니다. flag가 있을때.. flag 조건 추가
          this.$alert(this.$v(message[key]), () => false)
          pass = false
          break
        }
      }
      return pass
    },
    addBreadcrumbs (name) {
      this.$store.commit('common/ADD_PARAMETERS', {
        label: name,
        path: ''
      })
    },
    isEmpty (value) {
      if (!value) return true
      return isEmpty(value)
    },
    routeTo (to) {
      this.$router.push(to)
    },
    /**
     * 초기 이미지 그리드 선택된 페이지 세팅 (임시)
     */
    setImageGridPage (image) {
      if (!image?.index) return

      const ref = this.$refs.imageGridRef
      if (!ref) return

      const curPage = parseInt(Number(image.index) / 10)

      return ref.changingPage(curPage + 1)
    },
    /**
    * disabled row 설정 -> WINDOWS 계열의 이미지는 선택 불가능하게 처리
    */
    onLoadedRows (grid) {
      this.$nextTick(function () {
        for (let i = 0; i < grid.rows.length; i++) {
          const row = grid.rows[i]
          const item = row.dataItem
          const cssList = cloneDeep(row.cssClass)

          const osSystem = item.osSystem
          if (!osSystem) continue

          if (osSystem.includes('WINDOWS')) {
            item.isSelectable = false
            row.cssClass = cssList + ' is-disable-row'
          } else {
            item.isSelectable = true
            row.cssClass = cssList?.replace(' is-disable-row', '') || ''
          }
        }

        // 툴팁 추가 (선택 불가능 사유)
        grid.formatItem.addHandler((s, e) => {
          const rowData = s.rows[e.row]?._data
          if (rowData?.osSystem?.includes('WINDOWS')) {
            this.imageTooltip.setTooltip(e.cell,
              '<small>* WINDOWS는 지원하지 않습니다.</small>')
          }
        })
      })
    },
    /**
     * 파티션명 양식 설명 설정
     */
    setPartionNameDescTooltip (os) {
      if (!os || !this.diskInfo[os]?.unauthorized) {
        this.columns.updateColumns[1].titleHelp = ''
        return
      }

      this.columns.updateColumns[1].titleHelp = `
      Local Disk 이름 예시:&ensp;/app
      <br/><br/>
      <small>
        * 사용 불가 이름 (시스템 예약 파티션)
        <br/>${this.diskInfo[os]?.unauthorized.join(', ')}
      </small>
      `
    },
    /**
   * [vmware] ExternalDisk List를 조인 후 리턴합니다. (diskName을 찾기 위함)
   * @param {Array} diskList 1. 진짜 하드디스크 목록 (기준)
   * @param {Array} userDiskList 2. 사용자 지정한 하드디스크 목록 (diskName을 부여)
   * @param {Array} scsiControllerList 컨트롤러 목록
   * @return {Array} joinedDiskList
   */
    joinExternalDisks (diskList, userDiskList, scsiControllerList) {
      const joinedDiskList = (diskList || []).map(disk => {
        const controllerInfo = scsiControllerList ? scsiControllerList.find(c => (c.scsiControllerKey || c.controllerKey) === disk.controllerKey) : null

        const findedDisk = (userDiskList || []).find(item =>
          (item.controllerKey === disk.controllerKey) &&
          (item.unitNumber === disk.unitNumber))

        const diskSize = disk?.capacityB
          ? Math.floor((disk.capacityB / 1024 / 1024 / 1024))
          : (disk?.size || 0)

        return {
          ...disk,
          size: diskSize,
          diskName: findedDisk?.diskName || '',
          ...(controllerInfo && {
            busNumber: controllerInfo?.busNumber || 0
          })
        }
      })

      return joinedDiskList
    }
  },
  data: () => ({
    osSystem: null,
    defaultOsSystem: null,
    isLoadingDetailData: true,
    isInfoUpdating: false,
    isGetImages: false, // 로딩: 이미지 목록 조회
    originInfo: null,
    detailInfo: {},
    images: [], // 이미지 목록
    installProgramList: [], // 설치프로그램 목록
    checkInstallDataList: [], // 선택한 설치프로그램
    regex: {
      WINDOWS: /^[a-zA-Z]:\\[\\\S|*\S]?.*$/g,
      LINUX: /^(\/|([\\/][\w\s@^!#$%&-]+)+(\.[a-z]+[\\/]?)?)$/i,
      UBUNTU: /^(\/|([\\/][\w\s@^!#$%&-]+)+(\.[a-z]+[\\/]?)?)$/i,
      CENTOS: /^(\/|([\\/][\w\s@^!#$%&-]+)+(\.[a-z]+[\\/]?)?)$/i,
      RHEL: /^(\/|([\\/][\w\s@^!#$%&-]+)+(\.[a-z]+[\\/]?)?)$/i
    },
    diskInfo: {
      UBUNTU: {
        default: '/app',
        defaultSize: 50,
        unauthorized: [
          '/bin',
          '/boot',
          '/dev',
          '/etc',
          '/home',
          '/lib',
          '/lib64',
          '/media',
          '/mnt',
          '/opt',
          '/proc',
          '/root',
          '/run',
          '/sbin',
          '/snap',
          '/srv',
          '/sys',
          '/tmp',
          '/usr',
          '/var'
        ]
      },
      LINUX: {
        default: '/app',
        defaultSize: 50,
        unauthorized: [
          '/bin',
          '/boot',
          '/dev',
          '/etc',
          '/home',
          '/lib',
          '/lib64',
          '/media',
          '/mnt',
          '/opt',
          '/proc',
          '/root',
          '/run',
          '/sbin',
          '/srv',
          '/sys',
          '/tmp',
          '/usr',
          '/var'
        ]
      },
      CENTOS: {
        default: '/app',
        defaultSize: 50,
        unauthorized: [
          '/bin',
          '/boot',
          '/dev',
          '/etc',
          '/home',
          '/lib',
          '/lib64',
          '/media',
          '/mnt',
          '/opt',
          '/proc',
          '/root',
          '/run',
          '/sbin',
          '/snap',
          '/srv',
          '/sys',
          '/tmp',
          '/usr',
          '/var'
        ]
      },
      RHEL: {
        default: '/app',
        defaultSize: 50,
        unauthorized: [
          '/bin',
          '/boot',
          '/dev',
          '/etc',
          '/home',
          '/lib',
          '/lib64',
          '/media',
          '/mnt',
          '/opt',
          '/proc',
          '/root',
          '/run',
          '/sbin',
          '/snap',
          '/srv',
          '/sys',
          '/tmp',
          '/usr',
          '/var'
        ]
      },
      WINDOWS: {
        default: 'D:\\',
        defaultSize: 100,
        unauthorized: [
          'A:\\',
          'B:\\',
          'C:\\'
        ]
      }
    },
    columns: {
      imageColumns: [
        // { binding: '', header: null, width: 50, checkbox: true },
        { binding: 'userImageName', header: '이미지 이름', keyPath: 'common.GRID.COMPUTE.imageName' },
        { binding: 'userImageDesc', header: '설명', keyPath: 'common.GRID.explain' },
        { binding: 'osBit', header: '비트', keyPath: 'admin.PREF.bit' }
      ],
      installProgramColumns: [
        { binding: 'softwareName', header: 'S/W Name' },
        // { binding: 'installOs', header: 'OS' },
        { binding: 'versionName', header: 'VERSION' }
      ],
      updateColumns: [
        { header: '이미지', binding: 'image', keyPath: 'common.REGCON.image', required: true },
        { header: 'Local Disk 이름 설정', binding: 'externalDisk', keyPath: 'service.OVA.setExternalDiskName' },
        { header: '설치프로그램', binding: 'installProgram', keyPath: 'common.REGCON.install' },
        { header: '설명', binding: 'summary', keyPath: 'admin.PREF.explain' }
      ]
    },
    imageTooltip: new Tooltip({
      showAtMouse: true,
      showDelay: 200
    })
  })
}
</script>

<style lang="scss" scoped>
.vm-template-detail {
  .small-title {
    margin-top: $gap * 2;
  }
  .external-disk-list {
    display: flex;
    flex-direction: column;
    gap: $gap;
    .external-disk-item {
      display: flex;
      align-items: center;
      gap: $gap-s;
      font-size: 14px;
      > span {
        width: 150px;
        > small { color: $input-placeholder; }
      }
      .disk-name-input {
        width: 150px;
      }
      small.reference-text {
        margin-left: 5px;
        font-size: 12px;
        color: $input-placeholder;
      }
    }
  }
  .form-common { width: 800px; }
}
</style>
