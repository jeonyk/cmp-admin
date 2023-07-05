<template>
  <div
    v-loading="isLoadingDetailData || isInfoUpdating"
    class="vm-template-detail"
    style="min-height: 700px;"
  >
    <div v-if="!isLoadingDetailData && detailInfo">
      <vm-template-item
        :data="detailInfo"
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
        v-if="detailInfo"
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
          @loaded-rows="onLoadedRows"
        />
        <!-- 이미지 -->

        <template #externalDisk>
          <ul
            class="external-disk-list"
            v-if="detailInfo.diskList && detailInfo.diskList.length"
          >
            <li
              class="external-disk-item"
              v-for="(disk, idx) in detailInfo.diskList"
              :key="idx"
            >
              <span>{{ disk.adapterType +'.'+ disk.deviceIndex }}</span>
              <span>{{ disk.diskSizeBytes | byte }}</span>
              <el-input
                v-if="disk.adapterType === 'SCSI'"
                placeholder="disk name"
                v-model="disk.diskName"
                class="disk-name-input"
              />
              <p
                v-else
                class="disk-name-input"
              >
                {{ disk.diskName||'-' }}<small class="reference-text">&nbsp; (파티션명 변경 불가능)</small>
              </p>
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
        <button
          class="button"
          type="is-anti"
          size="is-large"
          @click="deleteItem"
        >
          <!-- 삭제 -->
          {{ $t('common.BTN.delete') }}
        </button>
        <button
          class="button"
          size="is-large"
          @click="routeTo({ name: 'vm-template' })"
        >
          <!-- 목록 -->
          {{ $t('common.BTN.list') }}
        </button>
        <button
          class="button"
          type="is-primary"
          size="is-large"
          @click="updateFn"
        >
          <!-- 저장 -->
          {{ $t('common.BTN.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import API, { VerticalTable, SelectInstallProgramGrid } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import { isEmpty, groupBy, cloneDeep } from 'lodash'

import VmTemplateItem from './VmTemplateItem.vue'
import { Tooltip } from '@grapecity/wijmo'

export default {
  name: 'VmTemplateDetail',
  components: {
    VerticalTable,
    SelectInstallProgramGrid,
    VmTemplateItem
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
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
        this.osSystem = null
        this.defaultOsSystem = null
        this.installProgramList = []
      }
    },
    init (isInit = false) {
      Promise.all([
        this.getOvaDetail(),
        this.getImages() // 이미지 목록 조회
        // this.getUsableInstallList() // 설치프로그램 목록 조회
      ]).then(async () => {
        if (this.detailInfo) {
          await this.setDetailData()
          if (isInit) this.addBreadcrumbs(this.detailInfo.name)
        }
      })
    },
    async getOvaDetail () {
      try {
        this.isLoadingDetailData = true
        const { data } = await API.compute.getDetailOVA(this.$route.params.uuid)
        this.detailInfo = data
        // console.log('⭐️', this.detailInfo)
      } catch (error) {} finally {
        this.isLoadingDetailData = false
      }
    },

    async setDetailData (data = this.detailInfo) {
      const { imageId, installProgramList, summary, isPub } = data.userInfo
      const selectImage = imageId !== undefined ? this.images.find(img => img.userImageIdx === imageId) : null
      if (selectImage) await this.selectImageFunction(selectImage)

      const diskList = (data.diskList || data.spec.diskList)?.filter(dsk => !(dsk.adapterType === 'SCSI' && dsk.deviceIndex === 0))

      const detailInstallData = installProgramList ? JSON.parse(installProgramList) : []
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
        diskList,
        summary,
        installProgramList: list,
        isPub: !!isPub
      }
      this.detailInfo = settedData

      this.setImageGridPage(this.detailInfo.selectImage)
    },

    async deleteItem () {
      this.$confirm(this.$t('common.CONFIRM.BASE.032'))
        .then(async () => {
          try {
            this.isInfoUpdating = true
            const { ovaUuid } = this.detailInfo

            // 관-조-프 IDX 같은 값 고정으로... 업무를 타지도, 긴급도 따로 없어서 임의이 값을 넣어도 무관
            const reqObj = {
              beforePrice: 0,
              groupIdx: 0,
              groupName: '0',
              isUrgent: false,
              price: 0,
              projectIdx: 0,
              requestData: {},
              service: 'NX_VM_TEMPLATE',
              userId: this.user.userId,
              userName: this.user.userName
            }
            const result = await API.work_v3.deleteNxOVA(ovaUuid, reqObj)
            if (result) this.$alert(this.$t('common.ALERT.BASE.017'), { callback: () => this.routeTo({ name: 'vm-template' }) }) // 삭제하였습니다.
          } catch (error) {
            console.log(error)
            this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
          } finally {
            this.isInfoUpdating = false
          }
        }).catch(() => false)
    },
    updateFn () {
      const { createTime, diskList, selectImage, isPub, ovaUuid, installProgramList, summary } = this.detailInfo

      const onlyScsiDisks = diskList.filter(disk => disk.adapterType === 'SCSI')

      const isAllDiskName = () => { // Local Disk 이름이 모두 설정되어 있는지?
        return onlyScsiDisks.every(item => item.diskName?.trim())
      }

      const isDuplicatedDiskName = () => {
        const diskNames = onlyScsiDisks.map(item => item.diskName)
        return diskNames.length === new Set(diskNames).size
      }

      // 예약 파티션 명인지 검사
      const availableDiskName = () => {
        if (!this.defaultOsSystem) return false
        else if (!this.diskInfo[this.defaultOsSystem]) return true
        else return onlyScsiDisks.every(item => !item.diskName || !this.diskInfo[this.defaultOsSystem]?.unauthorized?.includes(item.diskName))
      }

      const checkValidItems = [
        { image: selectImage }, // 이미지 - 생성 검사
        { isExternalDiskName: isAllDiskName() }, // Local Disk - 생성 검사
        { duplicateDiskName: isDuplicatedDiskName() }, // Local Disk - 중복 검사
        { availableDiskName: availableDiskName() } // Local Disk - 예약 파티션 명 포함 검사
        // { externalDiskDefault: isExternalDiskDefault } // Local Disk Default - 생성 검사
      ]
      if (!this.noEmptyContents(checkValidItems)) return

      const payload = {
        createTime,
        // createUser,
        diskList: onlyScsiDisks,
        imageId: selectImage.userImageIdx,
        ovaUuid,
        installProgramList: JSON.stringify(installProgramList),
        isPub,
        summary,
        updateTime: +new Date(Date.now()),
        updateUser: this.user.userId
      }
      this.updateOVAInfo(payload)
    },
    async updateOVAInfo (payload) {
      const message = this.$t('common.CONFIRM.PROJECT.022') // '자원을 수정하시겠습니까?'
      this.$confirm(message).then(async () => {
        try {
          this.isInfoUpdating = true
          await API.compute.updateOVA(this.detailInfo.ovaUuid, payload)
          this.$alert(this.$t('common.ALERT.BASE.043'), { callback: () => this.init() })
        } catch (error) {
          console.error(error)
          this.$alert(this.$t('common.ALERT.LOGGING.005'), { dangerouslyUseHTMLString: true }) // 수정에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        } finally {
          this.isInfoUpdating = false
        }
      }).catch(() => false)
    },
    /**
     * API: 이미지 조회
     */
    async getImages () {
      try {
        this.isGetImages = true
        this.images = []
        const data = await API.compute.getImages({ isManage: true })
        this.images = data
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.images = []
        return this.$alert(message)
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

        // const softwareList = groupBy(data, 'osType')

        // for (const [key, value] of Object.entries(softwareList)) {
        //   const uniqBySwIdData = uniqBy(value, 'id')

        //   const installList = []

        //   uniqBySwIdData.forEach(sw => {
        //     const versionOptions = value.filter(item => item.id === sw.id)
        //       .map(version => { return { versionId: version.versionId, versionName: version.version, swIdx: version.swIdx } })

        //     const item = {
        //       softwareName: sw.name,
        //       softwareId: sw.id,

        //       osType: sw.osType,
        //       selectedVersion: sw.selectedVersion || versionOptions.length ? versionOptions[0].versionId : '',
        //       versionOptions
        //     }

        //     installList.push(item)
        //   })

        //   origin[key] = installList
        // }

        // this.installListByOsType = origin

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
      const diskList = this.detailInfo.diskList

      for (let i = 0; i < diskList.length; i++) {
        const name = diskList[i].diskName
        const re = name?.match(this.regex[this.defaultOsSystem])
        if (name.indexOf(' ') !== -1 || re === null) {
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
      if (!this.checkDiskNamePath()) return

      const message = {
        image: 'common.ALERT.NUTA.008', // 이미지를 선택해주세요.
        isExternalDiskName: 'common.ALERT.SERVICE.030', // Local Disk 명을 모두 설정해주세요.
        duplicateDiskName: 'common.ALERT.SERVICE.031', // 중복된 Local Disk 이름이 있습니다.,
        availableDiskName: 'common.ALERT.SERVICE.032', // 시스템 예약 파티션 명은 사용할 수 없습니다.,
        externalDiskDefault: 'common.ALERT.PROJECT.071' // Local Disk 필수 경로 (${this.diskInfo[this.detailInfo.selectImage?.osType]?.default})를 설정해주세요.
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
          if (key === 'externalDiskDefault' && this.defaultOsSystem) this.$alert(this.$t(message[key], { path: this.diskInfo[this.defaultOsSystem]?.default }))
          else this.$alert(this.$t(message[key]))
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
    }
  },
  data: () => ({
    osSystem: null,
    defaultOsSystem: null,
    isLoadingDetailData: true,
    isInfoUpdating: false,
    isGetImages: false, // 로딩: 이미지 목록 조회
    detailInfo: null,
    images: [], // 이미지 목록
    installProgramList: [], // 설치프로그램 목록
    checkInstallDataList: [], // 선택한 설치프로그램
    installListByOsType: {
      LINUX: [],
      WINDOWS: []
    },
    regex: {
      /** 기존 정규식
       * WINDOWS: /^[a-zA-Z]:\\[\\\S|*\S]?.*$/g,
       * LINUX: /^(\/|([\\/][\w\s@^!#$%&-]+)+(\.[a-z]+[\\/]?)?)$/i,
       * UBUNTU: /^(\/|([\\/][\w\s@^!#$%&-]+)+(\.[a-z]+[\\/]?)?)$/i,
       * CENTOS: /^(\/|([\\/][\w\s@^!#$%&-]+)+(\.[a-z]+[\\/]?)?)$/i,
       * RHEL: /^(\/|([\\/][\w\s@^!#$%&-]+)+(\.[a-z]+[\\/]?)?)$/i
       */
      WINDOWS: /^[a-zA-Z]:\\[\\\S|*\S]?.*$/g,
      LINUX: /^(([\\/][\w\s@^!#$%&-]+)(\.[a-z]+[\\/]?)?){1,2}$/i,
      UBUNTU: /^(([\\/][\w\s@^!#$%&-]+)(\.[a-z]+[\\/]?)?){1,2}$/i,
      CENTOS: /^(([\\/][\w\s@^!#$%&-]+)(\.[a-z]+[\\/]?)?){1,2}$/i,
      RHEL: /^(([\\/][\w\s@^!#$%&-]+)(\.[a-z]+[\\/]?)?){1,2}$/i
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
        { binding: 'osName', header: '이미지 이름', keyPath: 'common.GRID.COMPUTE.imageName' },
        { binding: 'osDesc', header: '설명', keyPath: 'common.GRID.explain' },
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
      > span { width: 60px; }
      .disk-name-input {
        margin-left: $gap-s;
        width: 250px;
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
