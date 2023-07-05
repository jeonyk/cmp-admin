<!--
  * 파일명 : ManageProfileDetail.vue
  * 파일 기능 : 프로파일 관리 > 변경 (상세)
  * 작성자 : 이경환 외 3명
  * 최종 작성일 : 2021-01-27
  * License By Shinsegae I&C
  * 2021-01-27 fix: 그리드 데이터 로딩 UI 개선
 -->

<template>
  <div class="manage-profile-detail">
    <section class="meta-profile-area">
      <h4 class="mid-title">
        <!-- 프로파일 정보 -->
        {{ $t('admin.PREF.profileInfo') }}
      </h4>

      <vertical-table
        :data="userProfileInfo"
        :columns="checkUserProfileType()"
        class="profile-vertical-table"
      >
        <template #profileName>
          <el-input
            v-model="userProfileInfo.profileName"
            v-if="isEdit"
            class="vertical-table-input"
            placeholder="name"
            @keyup.native.enter="e => saveUserProfileInfo()"
          />
          <span v-else>
            {{ userProfileInfo.profileName }}
          </span>
        </template>
        <!-- /. 이름 -->

        <template
          v-for="column in checkUserProfileType()"
          :slot="column.binding"
        >
          <div :key="column.binding">
            <el-select
              v-if="isEdit"
              v-model="userProfileInfo[column.binding]"
              :placeholder="$t('common.PLACEHOLDER.selectName', { name: column.header })"
              :popper-append-to-body="false"
              class="vertical-table-input"
            >
              <el-option
                v-for="item in options[column.binding]"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>

            <el-select
              v-else-if="column.binding === 'engineSwIdx'"
              v-model="userProfileInfo[column.binding]"
              :placeholder="$t('common.PLACEHOLDER.selectName', { name: column.header })"
              :popper-append-to-body="false"
              class="vertical-table-input"
            >
              <el-option
                v-for="item in filterdDbSwLicenseList"
                :key="item.swIdx"
                :label="`${item.name} (${item.version}, ${item.osType})`"
                :value="item.swIdx"
              />
            </el-select>
            <!-- /. Engine S/W 라이선스 -->

            <el-select
              v-else-if="column.binding === 'osVendorSwIdx'"
              v-model="userProfileInfo[column.binding]"
              :placeholder="$t('common.PLACEHOLDER.selectName', { name: column.header })"
              :popper-append-to-body="false"
              class="vertical-table-input"
            >
              <el-option
                v-for="item in filterdOsSwLicenseList"
                :key="item.swIdx"
                :label="`${item.name} (${item.version}, ${item.osType})`"
                :value="item.swIdx"
              />
            </el-select>
            <!-- /. OS Vendor S/W 라이선스 -->

            <span v-else>
              {{ userProfileInfo[column.binding] }}
            </span>
          </div>
        </template>
      </vertical-table>
    </section>

    <section class="era-profile-area">
      <dashboard-panel
        class="profile-panel"
        :title="profileTypeName"
        v-loading="isGetProfileList"
        :element-loading-text="$t('common.PLACEHOLDER.loading')"
      >
        <section class="table-top-wrap">
          <total-count :total-count="unregistTableData.length" />
        </section>
        <section class="table-area">
          <cmp-grid
            :loading="isGetProfileList"
            class="profile-table"
            :item-source="unregistTableData"
            :columns="checkEraProfileType()"
            :init-custom-action="initUnregistGrid"
            @checkedRowsData="settingUnregistCheckedItems"
            header-checkbox
            :init-auto-select-row="registTableData"
            init-auto-select-row-key="profileIdx"
            paging-type="list"
            :height="440"
          />
        </section>
      </dashboard-panel>
      <!-- Era Profile 그리드 -->
    </section>
    <!-- 미등록, 등록 영역 -->

    <div class="button-area -form-bottom -center">
      <button
        class="button"
        size="is-large"
        type="is-anti"
        @click="$router.go(-1)"
      >
        <!-- 목록 -->
        {{ $t('common.BTN.list') }}
      </button>
      <button
        class="button"
        size="is-large"
        type="is-primary"
        @click="save"
      >
        <!-- 저장 -->
        {{ $t('common.BTN.save') }}
      </button>
    </div>
  </div>
</template>
<script>
import API, { DashboardPanel, VerticalTable } from '@sd-fe/cmp-core'

export default {
  name: 'ManageProfileDetail',
  components: {
    'dashboard-panel': DashboardPanel,
    VerticalTable
  },
  async created () {
    const path = this.$route.path.split('/')
    // [프로파일 관리] breadcrumbs 를 누르는 등 정보가 없다면 뒤로가기
    if (path[4] === undefined) return this.$router.go(-1)

    this.profileType = path[4].toUpperCase()
    this.profileTypeName = path[4][0].toUpperCase() + path[4].slice(1) + ' Profile'
    this.userProfIdx = path[5]
    this.$store.commit('common/ADD_PARAMETERS', { label: this.profileTypeName + ` ${this.$v('변경')}` })

    try {
      this.isGetProfileList = true

      await this.getUserProfile()
      await this.getSwLicenseList(this.profileType)
      await this.getUnregisteredEraProfiles(this.profileType)
    } catch (error) {
      console.error(error)
      this.$alert(error, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
    } finally {
      this.isGetProfileList = false
    }
  },
  methods: {
    async getUserProfile () {
      const response = await API.database.getUserProfile(this.userProfIdx)
      const result = { edit: true }
      const { profileName, vcpu, memory, engineType, engineVersion, osVendor, osType, osVersion, osPlatform } = response.data.userProfMap
      if (this.profileType === 'COMPUTE') {
        result.profileName = profileName
        result.vcpu = vcpu
        result.memory = memory
      } else {
        result.profileName = profileName
        result.engineType = engineType
        const swIdxList = JSON.parse(response.data.swIdxList)
        result.engineSwIdx = swIdxList[0]
        result.engineVersion = engineVersion
        result.osVendor = osVendor
        result.osType = osType
        result.osVendorSwIdx = swIdxList[1]
        result.osVersion = osVersion
        result.osPlatform = osPlatform
      }

      this.userProfileInfo = result
      this.registTableData = await response.data.registeredEraProfiles.map(item => {
        const result = { ...item }
        result.vcpuNum = result.propertyMap.CORE_PER_CPU * result.propertyMap.CPUS
        return result
      })
      this.registTableData.forEach(item => this.unregistTableData.push(item))

      // console.log('@@ this.registTableData : ', this.registTableData)
      // console.log('@@ this.unregistTableData : ', this.unregistTableData)
    },
    async getUnregisteredEraProfiles (params) {
      const parameter = { type: params }
      if (params === 'COMPUTE') parameter.isLatest = true
      const response = await API.database.getProfiles(parameter)
      if (!response) return

      let result = response[params].filter(item => !item.userProfIdx)
      if (params === 'SOFTWARE') {
        result = result.filter(item => item.profileOsInfo?.osVendor && item.profileOsInfo?.osVersion)
      }

      const temp = result.filter(item =>
        item.engineType.startsWith(this.userProfileInfo.engineType) &&
        item.propertyMap.VERSION.startsWith(this.userProfileInfo.engineVersion) &&
        item.profileOsInfo.osVendor.startsWith(this.userProfileInfo.osVendor) &&
        item.profileOsInfo.osVersion.startsWith(this.userProfileInfo.osVersion) &&
        item.profileOsInfo.osPlatform.startsWith(this.userProfileInfo.osPlatform)
      )
      temp.forEach(item => this.unregistTableData.push(item))
      // console.log('@@ this.unregistTableData 2 : ', this.unregistTableData)
    },
    checkUserProfileType () {
      if (this.profileType === 'COMPUTE') return this.computeColumnData
      else return this.softwareColumnData
    },
    checkEraProfileType () {
      if (this.profileType === 'COMPUTE') return this.eraComputeProfileColumnData
      else return this.eraSwProfileColumnData
    },
    initUnregistGrid (grid) {
      this.unregistGrid = grid
    },
    gridRefresh (grid = this.registGrid) {
      const cv = grid.collectionView
      cv.refresh()
    },
    /**
     * 상단 유저 프로파일 정보 변경 후 [확인] 눌렀을 때
     */
    async saveUserProfileInfo () {
      this.isEdit = false
      this.$confirm(this.$t('common.CONFIRM.BASE.006'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.isEdit = false
        this.beforeProfileInfo = this.userProfileInfo

        const response = API.database.updateUserProfile({
          userProfIdx: this.userProfIdx,
          req: {
            userProfType: this.profileType,
            userProfMap: this.userProfileInfo
          }
        })
        if (response.status === 200) {
          this.getUserProfile()
        }
      }).catch(() => {
        this.userProfileInfo = this.beforeProfileInfo
        return false
      })
    },
    /**
     * 프로파일에서 체크된 친구들을 담아줍니다.
     */
    settingUnregistCheckedItems (checkedItemArr) {
      // console.log('@@ settingUnregistCheckedItems : ', checkedItemArr)
      this.checkedUnregists = checkedItemArr
    },
    /**
     * 최종 [저장]
     */
    save () {
      // 1 개 이상의 프로파일을 선택해주세요.
      if (!this.checkedUnregists.length) return this.$alert(this.$t('common.ALERT.NUTA.041'))

      const payload = {
        userProfIdx: this.userProfIdx,
        req: {
          userProfType: this.profileType,
          userProfMap: this.userProfileInfo,
          eraProfiles: this.checkedUnregists.map(item => {
            const result = {
              profileIdx: item.profileIdx,
              userProfIdx: item.userProfIdx
            }
            return result
          })
        }
      }

      if (this.profileType === 'SOFTWARE') {
        payload.req.swIdxList = JSON.stringify([this.userProfileInfo.engineSwIdx, this.userProfileInfo.osVendorSwIdx])
      }
      this.$confirm(this.$t('common.CONFIRM.BASE.018'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.updateUserProfile(payload)
      }).catch(() => false)
    },
    async updateUserProfile (item) {
      const response = await API.database.updateUserProfile(item)
      if (response.status === 200) {
        if (response.data) return this.$alert(this.$t('common.ALERT.BASE.032'), { callback: () => this.$router.go(-1) })
        else this.$alert(this.$t('common.ALERT.BASE.033'))

        this.unregistTableData = []
        this.getUserProfile()
        this.getUnregisteredEraProfiles(this.profileType)
      }
    },
    /**
     * 각 라이선스 셀렉트 옵션들을 설정합니다.
     */
    async getSwLicenseList (type = this.profileType, userProfileInfo = this.userProfileInfo) {
      if (type === 'COMPUTE') return
      this.dbSwLicenseList = await API.config.getSwLicenseList({ category: 'database' })
      // this.osSwLicenseList = await API.config.getSwLicenseList({ category: 'image' })

      // Engine S/W 라이선스 옵션
      this.filterdDbSwLicenseList = this.dbSwLicenseList
      // OS Vender S/W 라이선스 옵션
      this.filterdOsSwLicenseList = this.dbSwLicenseList.filter(sw => {
        const lowerCaseUserProfileOs = (userProfileInfo.osType || '').toLowerCase()
        const lowerCaseLicenseOs = (sw.osSystem || '').toLowerCase()

        return lowerCaseUserProfileOs === lowerCaseLicenseOs
        // const splitedStr = userProfileInfo.osType.split(' ')
        // let isContains = false
        // for (const i in splitedStr) {
        //   if (sw.name.toLowerCase().indexOf(splitedStr[i].toLowerCase()) > -1) {
        //     isContains = true
        //   }
        //   if (sw.osType.toLowerCase().indexOf(splitedStr[i].toLowerCase()) > -1) {
        //     isContains = true
        //   }
        // }
        // if (isContains) return sw
      })
    }
  },
  data () {
    return {
      totalResultCnt: 0,
      isGetProfileList: false,
      isEdit: false,
      userProfileInfo: {},
      checkedUnregists: [],
      checkedRegists: [],
      profileType: undefined,
      profileTypeName: undefined,
      eraProfileInfo: { // 라우터로 가져오는 데이터
        field: '',
        data: null,
        columns: null
      },
      options: {
        engineType: [],
        version: [],
        osVendor: [],
        osVersion: [],
        osBit: []
      },

      beforeProfileInfo: null,
      softwareColumnData: [
        { binding: 'profileName', header: '이름', keyPath: 'common.REGCON.name' },
        { binding: 'engineType', header: 'Engine' },
        { binding: 'engineVersion', header: 'Version' },
        { binding: 'engineSwIdx', header: 'Engine S/W 라이선스', required: true, keyPath: 'admin.PREF.engineSw' },
        { binding: 'osVendor', header: 'OS Vendor' },
        { binding: 'osVendorSwIdx', header: 'Os Vendor S/W 라이선스', required: true, keyPath: 'admin.PREF.osVendorSw' },
        { binding: 'osVersion', header: 'OS Version' },
        { binding: 'osPlatform', header: 'OS Bit' }
      ],

      computeColumnData: [
        { binding: 'profileName', header: '이름', keyPath: 'common.REGCON.name' },
        { binding: 'vcpu', header: 'VCPU (개)', keyPath: 'service.vCpu' },
        { binding: 'memory', header: 'MEMORY (GB)' }
      ],

      // 테이블 임시 데이터
      registTableData: [],
      eraSwProfileColumnData: [
        { binding: 'profileName', header: '이름', keyPath: 'common.REGCON.name' },
        { binding: 'eraConfig.eraName', header: 'Era 이름', keyPath: 'common.GRID.NUTA.eraName' },
        { binding: 'engineType', header: 'Engine' },
        { binding: 'propertyMap.VERSION', header: 'Version' },
        { binding: 'profileOsInfo.osVendor', header: 'OS Vendor' },
        { binding: 'profileOsInfo.osVersion', header: 'OS Version' },
        { binding: 'profileOsInfo.osPlatform', header: 'OS Bit' }
      ],
      eraComputeProfileColumnData: [
        { binding: 'profileName', header: '이름', keyPath: 'common.REGCON.name' },
        { binding: 'eraConfig.eraName', header: 'Era 이름', keyPath: 'common.GRID.NUTA.eraName' },
        { binding: 'vcpuNum', header: 'VCPU (개)', keyPath: 'service.vCpu' },
        { binding: 'propertyMap.MEMORY_SIZE', header: 'MEMORY (GB)' }
      ],
      unregistTableData: [],
      dbSwLicenseList: [],
      osSwLicenseList: [],
      filterdDbSwLicenseList: [],
      filterdOsSwLicenseList: []
    }
  }
}
</script>
<style lang="scss">
  .manage-profile-detail {
    display: flex;
    flex-direction: column;
    > .meta-profile-area {
      position: relative;
      .profile-vertical-table {
        .vertical-table-input {width: 300px;}
      }
      > .button {
        position: absolute;
        top: -10px;
        right: 0;
      }
    }

    > .era-profile-area {
      margin-top: 40px;
      .profile-panel {
        // width: 50%;
        .panel-body {
          position: relative;
          padding: $gap;
          background: $ticket-back-color;
          height: 500px;
          border-top: 0;
          .button-area {
            position: absolute;
            top: $gap-m;
            right: $gap;
          }
        }
      }
      .db-arrow-icon {
        display: inline-block;
        margin: 0 $gap-m;
        min-width: 27px;
        height: 32px;
        background-position: center;
        background-size: contain;
        background-repeat: no-repeat;
        background-image: url('../../../assets/images/icon-dbarrow-left@3x.png');
        transform: rotate(180deg);
        &.-reverse {
          transform: rotate(0deg);
        }
      }
    }
    .-arrow-buttons {
      > button {cursor: default;}
    }
  }
</style>
