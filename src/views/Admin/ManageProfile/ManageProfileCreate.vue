<!--
  * 파일명 : ManageProfileCreate.vue
  * 파일 기능 : 프로파일 관리 > 등록 (상세)
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2021-01-07
  * License By Shinsegae I&C
  * 2021-01-07 fix: [환경설정 > 뉴타닉스 설정] - 로딩 추가 및 ui 자잘한 수정
 -->

<template>
  <div class="manage-profile-create">
    <section class="meta-profile-area">
      <h4 class="mid-title">
        {{ $t('admin.PREF.profileInfo') }}
      </h4>
      <vertical-table
        :data="newProfile"
        :columns="checkUserProfileType()"
        class="profile-vertical-table"
      >
        <template #profileName>
          <el-input
            v-model="newProfile.profileName"
            class="vertical-table-input"
            @keyup.native.enter="e => save()"
          />
        </template>

        <template #engineType>
          <el-select
            v-model="newProfile.engineType"
            :placeholder="$t('common.PLACEHOLDER.selectName', { name: 'Engine Type' })"
            @change="item => filterChange('engine', item, 'engineType')"
            :popper-append-to-body="false"
            class="vertical-table-input"
          >
            <el-option
              v-for="item in options.engineType"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </template>

        <template #engineVersion>
          <el-select
            :disabled="newProfile.engineType === '' || !newProfile.engineType"
            v-model="newProfile.engineVersion"
            :placeholder="$t('common.PLACEHOLDER.selectName', { name: 'Engine version' })"
            @change="item => filterChange('engine', item, 'engineVersion')"
            :popper-append-to-body="false"
            class="vertical-table-input"
          >
            <el-option
              v-for="item in options.engineVersion"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </template>

        <template #engineSwIdx>
          <el-select
            :disabled="newProfile.engineType === '' || !newProfile.engineType"
            v-model="newProfile.engineSwIdx"
            :placeholder="$t('common.PLACEHOLDER.selectName', { name: $t('admin.PREF.engineSw') })"
            class="vertical-table-input"
          >
            <el-option
              v-for="item in dbSwLicenseList"
              :key="item.swIdx"
              :label="item.name + ' (' + item.version + ', ' + item.osType + ')'"
              :value="item.swIdx"
            />
          </el-select>
        </template>

        <template #osType>
          <el-select
            :disabled="newProfile.engineType === '' || !newProfile.engineType"
            v-model="newProfile.osType"
            :placeholder="$t('common.PLACEHOLDER.selectName', { name: 'OS Type' })"
            @change="item => filterChange('os', item, 'osType')"
            :popper-append-to-body="false"
            class="vertical-table-input"
          >
            <el-option
              v-for="item in options.osType"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </template>

        <template #osVendor>
          <el-select
            :disabled="newProfile.osType === '' || !newProfile.osType"
            v-model="newProfile.osVendor"
            :placeholder="$t('common.PLACEHOLDER.selectName', { name: 'OS Vendor' })"
            @change="item => filterChange('os', item, 'osVendor')"
            :popper-append-to-body="false"
            class="vertical-table-input"
          >
            <el-option
              v-for="item in options.osVendor"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </template>

        <template #osVendorSwIdx>
          <el-select
            :disabled="newProfile.osType === '' || !newProfile.osType"
            v-model="newProfile.osVendorSwIdx"
            :placeholder="$t('common.PLACEHOLDER.selectName', { name: $t('admin.PREF.osVendorSw') })"
            class="vertical-table-input"
          >
            <el-option
              v-for="item in filterdOsSwLicenseList"
              :key="item.swIdx"
              :label="item.name + ' (' + item.version + ', ' + item.osType + ')'"
              :value="item.swIdx"
            />
          </el-select>
        </template>

        <template #osVersion>
          <el-select
            :disabled="newProfile.osType === '' || !newProfile.osType"
            v-model="newProfile.osVersion"
            :placeholder="$t('common.PLACEHOLDER.selectName', { name: 'OS Version' })"
            @change="item => filterChange('os', item, 'osVersion')"
            :popper-append-to-body="false"
            class="vertical-table-input"
          >
            <el-option
              v-for="item in options.osVersion"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </template>

        <template #osPlatform>
          <el-select
            :disabled="newProfile.osType === '' || !newProfile.osType"
            v-model="newProfile.osPlatform"
            :placeholder="$t('common.PLACEHOLDER.selectName', { name: 'OS Vendor' })"
            @change="item => filterChange('os', item, 'osPlatform')"
            :popper-append-to-body="false"
            class="vertical-table-input"
          >
            <el-option
              v-for="item in options.osPlatform"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </template>

        <template #vcpu>
          <el-select
            v-model="newProfile.vcpu"
            :placeholder="$t('common.PLACEHOLDER.selectName', { name: 'vCPU' })"
            @change="item => filterChange(null, item, 'vcpu')"
            :popper-append-to-body="false"
            class="vertical-table-input"
          >
            <el-option
              v-for="item in options.vcpu"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </template>

        <template #memory>
          <el-select
            v-model="newProfile.memory"
            :placeholder="$t('common.PLACEHOLDER.selectName', { name: 'Memory' })"
            @change="item => filterChange(null, item, 'memory')"
            :popper-append-to-body="false"
            class="vertical-table-input"
          >
            <el-option
              v-for="item in options.memory"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </template>
      </vertical-table>
    </section>

    <section class="era-profile-area">
      <dashboard-panel
        class="profile-panel"
        :title="profileTypeName"
        v-loading="isGetProfileList"
      >
        <article class="table-top-wrap">
          <total-count :total-count="unregistTableData.length" />
        </article>
        <article class="table-area">
          <cmp-grid
            class="profile-table"
            :item-source="unregistTableData"
            :columns="checkEraProfileType()"
            :init-custom-action="initUnregistGrid"
            header-checkbox
            @checkedRowsData="settingUnregistCheckedItems"
            paging-type="list"
            :height="440"
          />
        </article>
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
// import axios from 'axios'

export default {
  name: 'ManageProfileCreate',
  components: {
    'dashboard-panel': DashboardPanel,
    VerticalTable
  },
  async created () {
    const path = this.$route.path.split('/')
    this.profileType = path[4].toUpperCase()
    this.profileTypeName = path[4][0].toUpperCase() + path[4].slice(1) + ' Profile'

    await this.getUnregisteredEraProfiles(this.profileType)
    await this.setProfileOption()
    this.getSwLicenseList()
    this.$store.commit('common/ADD_PARAMETERS', { label: this.profileTypeName + ` ${this.$v('등록')}` })
  },
  methods: {
    async getUnregisteredEraProfiles (params) {
      this.isGetProfileList = true
      const parameter = { type: params }
      if (params === 'COMPUTE') parameter.isLatest = true
      const response = await API.database.getProfiles(parameter)

      let result = response[params].filter(item => !item.userProfIdx)

      if (params === 'SOFTWARE') {
        result = result.filter(item => item.profileOsInfo?.osType && item.profileOsInfo?.osVersion)
          .map(item => {
            item.profileOsInfo.osTypeVendor = item.profileOsInfo.osVendor + ' (' + item.profileOsInfo.osType + ')'
            if (item.profileOsInfo.osType === 'LINUX') {
              item.profileOsInfo.osAdditionalInfo = item.profileOsInfo.osPlatform
            } else {
              item.profileOsInfo.osAdditionalInfo = item.profileOsInfo.osEdition
            }
            return item
          })
      } else {
        result = result.map(item => {
          item.vcpu = item.propertyMap.CORE_PER_CPU * item.propertyMap.CPUS
          item.memory = item.propertyMap.MEMORY_SIZE
          return item
        })
      }
      this.unregistTableData = result
      console.log('@@ this.unregistTableData : ', this.unregistTableData)
      this.unregistRawData = JSON.parse(JSON.stringify(result))

      this.isGetProfileList = false
    },
    initData () {
      this.profileName = ''
      this.newProfile = {
        profileName: '',
        engineType: '',
        engineVersion: '',
        engineSwIdx: '',
        osType: '',
        osVendor: '',
        osVendorSwIdx: '',
        osVersion: '',
        osPlatform: '',
        edit: true
      }
      this.filterObj = {
        engineType: '',
        engineVersion: '',
        osType: '',
        osVendor: '',
        osVersion: '',
        osPlatform: ''
      }
      this.setProfileOption()
    },
    /**
     * Profile 정보의 셀렉트 박스(options.*)에 최초로 세팅되는 정보를 구성합니다.
     */
    setProfileOption () {
      const engineTypeMap = new Map()
      // const osTypeMap = new Map()
      const vcpuMap = new Map()
      const memoryMap = new Map()
      this.unregistRawData.forEach(profile => {
        engineTypeMap.set(profile.engineType, {
          label: profile.engineType,
          value: profile.engineType
        })
        // osTypeMap.set(profile.profileOsInfo?.osType, {
        //   label: profile.profileOsInfo?.osType,
        //   value: profile.profileOsInfo?.osType
        // })
        vcpuMap.set(profile.vcpu, {
          label: profile.vcpu,
          value: profile.vcpu
        })
        memoryMap.set(profile.memory, {
          label: profile.memory,
          value: profile.memory
        })
      })
      this.options.engineType = [...engineTypeMap.values()]
      this.options.vcpu = [...vcpuMap.values()]
      this.options.memory = [...memoryMap.values()]
    },
    checkUserProfileType () {
      if (this.profileType === 'COMPUTE') {
        return this.computeColumnData
      } else {
        return this.softwareColumnData
      }
    },
    checkEraProfileType () {
      if (this.profileType === 'COMPUTE') {
        return this.eraComputeProfileColumnData
      } else {
        return this.eraSwProfileColumnData
      }
    },
    initUnregistGrid (grid) {
      this.unregistGrid = grid
    },
    routeTo (to) {
      this.$router.push(to)
    },
    gridRefresh (grid = this.registGrid) {
      const cv = grid.collectionView
      cv.refresh()
    },
    /**
     * 라우터로 넘어오는 칼럼의 형태에 따라 this.newProfile 오브젝트의 키 값을 세팅합니다.
     */
    setNewProfileObject () {
      if (!this.eraProfileInfo.columns?.length) return
      const columnData = this.eraProfileInfo.columns

      columnData.forEach(col => {
        this.$set(this.newProfile, col.binding, '')
      })

      return this.newProfile
    },

    /**
     * 미등록 프로파일에서 체크된 친구들을 담아줍니다.
     */
    settingUnregistCheckedItems (checkedItemArr) {
      this.checkedUnregists = checkedItemArr
    },
    /**
     * [확인] 클릭해서 새로운 프로파일을 등록합니다.
     */
    save () {
      console.log(this.checkedUnregists)
      const { profileName, vcpu, memory, engineType, engineVersion, engineSwIdx, osType, osVendor, osVendorSwIdx, osVersion, osPlatform } = this.newProfile

      let userProfMap = {}
      let validator = [
        { condition: profileName.trim(), message: this.$t('common.ALERT.NUTA.028') } // 등록할 Profile의 이름을 입력해주세요.
      ]
      if (this.profileType === 'COMPUTE') {
        validator = [
          ...validator,
          { condition: vcpu, message: this.$t('common.ALERT.NUTA.029') }, // 등록할 Profile의 CPU를 선택해주세요.
          { condition: memory, message: this.$t('common.ALERT.NUTA.033') } // 등록할 Profile의 Engine S/W 라이선스를 선택해주세요.
        ]
        userProfMap = { profileName, vcpu, memory }
      } else {
        validator = [
          ...validator,
          { condition: engineType, message: this.$t('common.ALERT.NUTA.031') }, // 등록할 Profile의 Engine Type을 선택해주세요.',
          { condition: engineVersion, message: this.$t('common.ALERT.NUTA.032') }, // 등록할 Profile의 Engine Version을 선택해주세요.',
          { condition: engineSwIdx, message: this.$t('common.ALERT.NUTA.030') }, // 등록할 Profile의 Engine S/W 라이선스를 선택해주세요.',
          { condition: osType, message: this.$t('common.ALERT.NUTA.039') }, // 등록할 Profile의 OS Type을 선택해주세요.',
          { condition: osVendor, message: this.$t('common.ALERT.NUTA.036') }, // 등록할 Profile의 OS Vendor를 선택해주세요.',
          { condition: osVendorSwIdx, message: this.$t('common.ALERT.NUTA.035') }, // 등록할 Profile의 Os Vendor S/W 라이선스를 선택해주세요.',
          { condition: osVersion, message: this.$t('common.ALERT.NUTA.037') }, // 등록할 Profile의 OS Version을 선택해주세요.',
          { condition: osPlatform, message: this.$t('common.ALERT.NUTA.034') } // 등록할 Profile의 OS Bit를 선택해주세요.',
        ]
        userProfMap = {
          profileName,
          engineType,
          engineVersion,
          engineSwIdx,
          osType,
          osVendor,
          osVendorSwIdx,
          osVersion,
          osPlatform
        }
      }

      validator.push(
        // 등록할 Era Profile을 선택해주세요.
        { condition: this.checkedUnregists && this.checkedUnregists.length, message: this.$t('common.ALERT.NUTA.027') }
        // if (!this.checkedUnregists || this.checkedUnregists.length <= 0) {
        //   return this.$alert(this.$t('common.ALERT.NUTA.027'))
        // }
      )
      const validation = validator.every(cond => {
        if (!cond.condition) this.$alert(cond.message)
        return cond.condition
      })
      if (!validation) return

      const payload = {
        userProfType: this.profileType,
        userProfMap: userProfMap,
        eraProfiles: this.checkedUnregists.map(item => { return { profileIdx: item.profileIdx } })
      }
      if (this.profileType !== 'COMPUTE') {
        payload.swIdxList = JSON.stringify([this.newProfile.engineSwIdx, this.newProfile.osVendorSwIdx])
      }
      this.$confirm(this.$t('common.CONFIRM.NUTA.006'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        // console.log('등록 프로파일 정보:', this.newProfile)
        this.createUserProfile(payload)
      }).catch(() => false)
    },
    async createUserProfile (item) {
      const response = await API.database.createUserProfile(item)
      if (response.status === 200) {
        if (response.data) {
          this.$alert(this.$t('common.ALERT.BASE.032')) // 등록 성공하였습니다.
          return this.$router.go(-1)
        } else this.$alert(this.$t('common.ALERT.BASE.033')) // 등록 실패하였습니다.
      }
      this.initData()
      this.unregistTableData = []
      await this.getUnregisteredEraProfiles(this.profileType)
    },
    /**
     * 필터링..
     */
    filterChange (arrType, filteredItem, column) {
      if (arrType) {
        this.profileOptionsReset(arrType, column)
      }
      // console.log('@@ this.unregistRawData : ', this.unregistRawData)
      this.checkedUnregists = []
      this.filterObj[column] = filteredItem // SQLSERVER
      // console.log('@@ this.filterObj : ', this.filterObj)
      if (column === 'engineType') {
        this.profileOptionsReset('os', 'all')
        const engineVersionMap = new Map()
        const osTypeMap = new Map()
        this.unregistRawData
          .filter(profile => this.filterFunction(profile))
          .forEach(profile => {
            engineVersionMap.set(profile.propertyMap?.VERSION.replace('\\\\n', ''), {
              label: profile.propertyMap?.VERSION.replace('\\\\n', ''),
              value: profile.propertyMap?.VERSION
            })
            osTypeMap.set(profile.profileOsInfo?.osType, {
              label: profile.profileOsInfo?.osType,
              value: profile.profileOsInfo?.osType
            })
          })
        this.options.engineVersion = [...engineVersionMap.values()]
        this.options.osType = [...osTypeMap.values()]
        // S/W 라이선스 목록 : 엔진별 필터링 적용하지 않고 데이터베이스면 다 보이게 변경
        // this.filteredDbSwLicenseList = this.dbSwLicenseList.filter(sw => sw.name.toLowerCase().indexOf(filteredItem.toLowerCase()) > -1)
      }

      if (column === 'osType') {
        // this.profileOptionsReset('osType')
        // osType에 따라 라이선스 목록 보여주게 수정
        const osVendorMap = new Map()
        const osVersionMap = new Map()
        const osPlatformMap = new Map()
        this.unregistRawData
          .filter(profile => this.filterFunction(profile))
          .forEach(profile => {
            osVendorMap.set(profile.profileOsInfo?.osVendor, {
              label: profile.profileOsInfo?.osVendor,
              value: profile.profileOsInfo?.osVendor
            })
            osVersionMap.set(profile.profileOsInfo?.osVersion, {
              label: profile.profileOsInfo?.osVersion,
              value: profile.profileOsInfo?.osVersion
            })
            // if (filteredItem === 'WINDOWS') {
            //   osPlatformMap.set(profile.profileOsInfo?.osEdition, {
            //     label: profile.profileOsInfo?.osEdition,
            //     value: profile.profileOsInfo?.osEdition
            //   })
            // } else {
            //   osPlatformMap.set(profile.profileOsInfo?.osPlatform, {
            //     label: profile.profileOsInfo?.osPlatform,
            //     value: profile.profileOsInfo?.osPlatform
            //   })
            // }
            osPlatformMap.set(profile.profileOsInfo?.osAdditionalInfo, {
              label: profile.profileOsInfo?.osAdditionalInfo,
              value: profile.profileOsInfo?.osAdditionalInfo
            })
          })
        this.options.osVendor = [...osVendorMap.values()]
        this.options.osVersion = [...osVersionMap.values()]
        this.options.osPlatform = [...osPlatformMap.values()]
        /*
        this.filterdOsSwLicenseList = this.osSwLicenseList.filter(sw => {
          const splitedStr = filteredItem.split(' ')
          let isContains = false
          for (const i in splitedStr) {
            if (sw.name.toLowerCase().indexOf(splitedStr[i].toLowerCase()) > -1) {
              isContains = true
            }
            if (sw.osType.toLowerCase().indexOf(splitedStr[i].toLowerCase()) > -1) {
              isContains = true
            }
          }
          if (isContains) return sw
        }) */
        this.filterdOsSwLicenseList = this.osSwLicenseList
      }

      if (column === 'vcpu') {
        this.unregistRawData.filter(profile => this.filterFunction(profile))
      }

      if (column === 'memory') {
        this.unregistRawData.filter(profile => this.filterFunction(profile))
      }

      this.unResistProfileFiltering()
    },
    profileOptionsReset (type, key) {
      const optionsKey = {
        engine: ['engineType', 'engineVersion', 'engineSwIdx'],
        os: ['osType', 'osVendor', 'osVendorSwIdx', 'osVersion', 'osPlatform']
      }
      if (key === 'all') {
        for (const item of optionsKey[type]) {
          this.newProfile[item] = ''
          this.filterObj[item] = ''
        }
      } else {
        const idx = optionsKey[type].indexOf(key)
        if (idx > -1) {
          for (let i = idx + 1; i < optionsKey[type].length; i++) {
            this.newProfile[optionsKey[type][i]] = ''
            this.filterObj[optionsKey[type][i]] = ''
          }
        }
      }
    },
    filterFunction (profile) {
      let result = true
      if (this.filterObj?.engineType) result = result && profile.engineType === this.filterObj.engineType
      if (this.filterObj?.engineVersion) result = result && profile.propertyMap.VERSION === this.filterObj.engineVersion
      if (this.filterObj?.osType) result = result && profile.profileOsInfo?.osType === this.filterObj.osType
      if (this.filterObj?.osVendor) result = result && profile.profileOsInfo?.osVendor === this.filterObj.osVendor
      if (this.filterObj?.osVersion) result = result && profile.profileOsInfo?.osVersion === this.filterObj.osVersion
      if (this.filterObj?.osAdditionalInfo) result = result && profile.profileOsInfo?.osAdditionalInfo === this.filterObj.osAdditionalInfo
      if (this.filterObj?.vcpu) result = result && profile.vcpu === this.filterObj.vcpu
      if (this.filterObj?.memory) result = result && profile.memory === this.filterObj.memory
      return result
    },
    unResistProfileFiltering () {
      this.unregistTableData = this.unregistRawData.filter(profile => this.filterFunction(profile))
    },
    async getSwLicenseList () {
      /*
      const config = {
        url: process.env.VUE_APP_ZUUL_URL
      }
      const dbSwLicenseList1 = (await axios.get(config.url + '/api/cmp/v3/metering/sw', { category: 'database' }))?.data
      const osSwLicenseList1 = await axios.get(config.url + '/api/cmp/v3/metering/sw', { category: 'image' })?.data */

      const dbSwLicenseList2 = await API.config.getSwLicenseList({ category: 'database' })
      const osSwLicenseList2 = await API.config.getSwLicenseList({ category: 'image' })

      console.log('swLicenseList:', // s11, dbSwLicenseList1, 12, osSwLicenseList1,
        21, dbSwLicenseList2, 22, osSwLicenseList2)
      this.dbSwLicenseList = dbSwLicenseList2
      this.osSwLicenseList = osSwLicenseList2
      this.$forceUpdate()
    }
  },
  data () {
    return {
      totalResultCnt: 0,
      isGetProfileList: false, // 로딩

      filterObj: {
        engineType: '',
        engineVersion: '',
        osType: '',
        osVendor: '',
        osVersion: '',
        osPlatform: ''
      },
      checkedUnregists: [],
      checkedRegists: [],
      profileType: undefined,
      profileTypeName: undefined,
      eraProfileInfo: { // 라우터로 가져오는 데이터
        field: '',
        data: null,
        columns: null
      },
      newProfile: {
        profileName: '',
        engineType: '',
        engineVersion: '',
        engineSwIdx: '',
        osType: '',
        osVendor: '',
        osVendorSwIdx: '',
        osVersion: '',
        osPlatform: '',
        edit: true
      },
      options: {
        engineType: [],
        engineVersion: [],
        osType: [],
        osVendor: [],
        osVersion: [],
        osPlatform: [],
        vcpu: [],
        memory: []
      },
      /// ////////////
      softwareColumnData: [
        { binding: 'profileName', header: '이름', required: true, keyPath: 'common.REGCON.name' },
        { binding: 'engineType', header: 'Engine', required: true },
        { binding: 'engineVersion', header: 'Version', required: true },
        { binding: 'engineSwIdx', header: 'Engine S/W 라이선스', required: true, keyPath: 'admin.PREF.engineSw' },
        { binding: 'osType', header: 'OS Type', required: true },
        { binding: 'osVendor', header: 'OS Vendor', required: true },
        { binding: 'osVendorSwIdx', header: 'OS Vendor S/W 라이선스', required: true, keyPath: 'admin.PREF.osVendorSw' },
        { binding: 'osVersion', header: 'OS Version', required: true },
        { binding: 'osPlatform', header: 'OS Bit', required: true }
      ],

      computeColumnData: [
        { binding: 'profileName', header: '이름', required: true, keyPath: 'common.REGCON.name' },
        { binding: 'vcpu', header: 'VCPU (개)', required: true, keyPath: 'service.vCpu' },
        { binding: 'memory', header: 'MEMORY (GB)', required: true }
      ],

      registTableData: [],
      // 테이블 임시 데이터
      eraSwProfileColumnData: [
        { binding: 'profileName', header: '이름', keyPath: 'common.REGCON.name' },
        { binding: 'eraConfig.eraName', header: 'Era 이름', keyPath: 'common.GRID.NUTA.eraName' },
        { binding: 'engineType', header: 'Engine' },
        { binding: 'propertyMap.VERSION', header: 'Version' },
        { binding: 'profileOsInfo.osTypeVendor', header: 'OS Vendor' },
        { binding: 'profileOsInfo.osVersion', header: 'OS Version' },
        { binding: 'profileOsInfo.osAdditionalInfo', header: 'OS Bit' }
      ],
      eraComputeProfileColumnData: [
        { binding: 'profileName', header: '이름', keyPath: 'common.REGCON.name' },
        { binding: 'eraConfig.eraName', header: 'Era 이름', keyPath: 'common.GRID.NUTA.eraName' },
        { binding: 'vcpu', header: 'VCPU (개)', keyPath: 'service.vCpu' },
        { binding: 'memory', header: 'MEMORY (GB)' }
      ],
      unregistTableData: [],
      unregistRawData: [],
      dbSwLicenseList: [],
      osSwLicenseList: [],
      // filteredDbSwLicenseList: [],
      filterdOsSwLicenseList: []
    }
  }
}
</script>
<style lang="scss">
  .manage-profile-create {
    display: flex;
    flex-direction: column;
    > .meta-profile-area {
      .profile-vertical-table {
        .vertical-table-input {width: 300px;}
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
          .profile-table {
            // overflow-y: auto;
            height: 430px;
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
  }
</style>
