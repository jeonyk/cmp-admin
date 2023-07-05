<!--
  * 파일명 : MarketPlaceContents.vue
  * 파일 기능 : 서비스 카탈로그 > 마켓플레이스 리스트 정보, 필터링(OS타입 / 서비스타입 / 사용자 포탈 등록 여부 / BP명) 기능, 사용자 포탈 노출 ON/OFF 기능 제공
  * 작성자 : 이경환 외 3명
  * 최종 작성일 : 2021-02-26
  * License By Shinsegae I&C
  * 2021-02-26 fix: 마켓플레이스 사용자 포탈 노출 버튼 ON/OFF 관련 버그 수정
 -->

<template>
  <div class="marketplace-contents">
    <filtering-component @reset-data="resetTags">
      <article class="filter-wrapper">
        <div
          v-for="filters in filterModalContents"
          :key="filters.title"
          :class="[filters.className, '-types']"
        >
          <strong>{{ $t(filters.keyPath) || filters.title }}</strong>
          <ul class="marketplace-filtering">
            <li
              v-for="(type, idx) of filters.options"
              :key="`${type.osType}_${idx}`"
            >
              <el-checkbox
                v-model="checkedFilters[type.value]"
                class="mp-filter-checkbox"
                :label="$t(type.keyPath) || type.label"
                @change="filteringData"
              />
            </li>
          </ul>
        </div>
        <div>
          <strong style="width: 35px;">{{ $t('service.bpName') }}</strong>
          <div class="flex-wrap">
            <el-input
              v-model="searchBpName"
              class="bp-name-input"
              @keyup.enter.native="filteringData"
            />
            <button
              class="button"
              type="is-icon"
              @click="filteringData"
            >
              <a class="magnify-icon" />
            </button>
          </div>
        </div>
      </article>
    </filtering-component>
    <!-- /. MP 필터링 -->

    <div class="table-top-wrap">
      <total-count
        :total-count="osTypeData.length"
        class="total-count-wrap"
      />
    </div>

    <section
      class="marketplace-list-area"
      v-loading="mpContentsLoaded"
    >
      <ul class="marketplace-wrap">
        <li
          v-for="(osType, idx) in copiedOsTypeData"
          :key="osType + idx"
          class="marketplace-lists"
          :class="{'-disabled': !osType.bpInfo.iconImage || !osType.bpInfo.category || !osType.bpInfo.summary ||
            !(osType.selectedSwLicenseList && osType.selectedSwLicenseList.length)}"
          @click="routeTo(osType)"
        >
          <div
            class="-user-regist"
            v-if="osType.bpInfo.iconImage && osType.bpInfo.category && osType.bpInfo.summary && (osType.selectedSwLicenseList && osType.selectedSwLicenseList.length)"
          >
            <span style="margin-right: 10px;">{{ $t('service.portal') }}</span>
            <el-switch
              v-model="osType.bpInfo.isPub"
              @change="registerBp(osType, !osType.bpInfo.isPub)"
              @click.native="(e) => {
                e.stopPropagation()
              }"
            />
          </div>
          <div
            class="-user-regist -empty-info"
            v-else
          >
            <i class="mdi mdi-information-outline" />
            <span style="margin-left: 10px;">{{ $t('service.requireRegister') }}</span>
          </div>

          <div class="server-image">
            <span
              v-if="!osType.bpInfo.iconImage"
              class="no-img"
              style="width: 90px; height: 90px;"
            >
              <i class="add-icon -image" />
            </span>

            <div
              class="server-img"
              v-else
            >
              <img
                width="90"
                :src="osType.bpInfo.iconImage"
              >
            </div>
          </div>
          <!-- 이미지 -->

          <div class="list-info">
            <dt class="-sv-name">
              <cmp-status-tag
                class="category-tag"
                line-style
              >
                <span v-if="osType.bpInfo.category">{{ osType.bpInfo.category }}</span>
                <div
                  class="flex-wrap"
                  v-else
                >
                  <span>{{ $t('common.BTN.select') }}</span>
                  <i
                    class="mdi mdi-chevron-down"
                    style="margin-left: 5px; width: 10px;"
                  />
                </div>
              </cmp-status-tag>
              <span>{{ osType.bpName }}</span>
            </dt>

            <div class="-sv-detail">
              <span v-if="osType.pgVersion">
                <b>Version</b> {{ osType.pgVersion }}
                <small v-if="osType.createTime">&nbsp;({{ osType.createTime | date }})</small>
              </span>
              <span v-if="osType.osInfo">
                <b>{{ $v('이미지') + ' (OS)' }}</b>
                <!--
                {{ osType.osInfo }} -->
              </span>

              <section class="detail-contents">
                <dashboard-panel :padding-top="0">
                  <template>
                    <div
                      v-if="osType.osInfo"
                      class="flex-wrap after-data os-wrap"
                    >
                      <set-os-icon :os-name="osType.osInfo" />
                      <span v-if="osType.osInfo">{{ osType.osInfo }}</span>
                    </div>
                    <span
                      v-else
                      class="empty-content"
                    >-</span>
                    <div class="os-list-wrap">
                      <register-contents
                        title="OS Bit"
                        :title-width-px="100"
                      >
                        <div
                          v-if="osType.bpImg.osBit"
                          class="flex-wrap after-data"
                        >
                          <span v-if="osType.bpImg.osBit">{{ osType.bpImg.osBit }}</span>
                        </div>
                        <span
                          v-else
                          class="empty-content"
                        >-</span>
                      </register-contents>
                      <register-contents
                        title="OS Type"
                        :title-width-px="100"
                      >
                        <div
                          v-if="osType.osType"
                          class="flex-wrap after-data"
                        >
                          <span v-if="osType.osType">{{ osType.osType }}</span>
                        </div>
                        <span
                          v-else
                          class="empty-content"
                        >-</span>
                      </register-contents>
                    </div>
                  </template>
                </dashboard-panel>
              </section>

              <div class="flex-wrap -sw-license">
                <b>{{ $t('service.sw') }}</b>
                <div class="flex-wrap sw-license-wrap">
                  <el-tag
                    v-for="item in osType.selectedSwLicenseList"
                    :key="item.swIdx"
                    size="small"
                    class="sw-license-tag"
                  >
                    <span v-if="item.version === null">{{ item.name }}</span>
                    <span v-else> {{ item.name + ' (' + item.version + ')' }}</span>
                  </el-tag>
                </div>
              </div>
            </div>
            <dd class="-description">
              <div v-if="osType.bpInfo.summary">
                {{ osType.bpInfo.summary }}
              </div>
              <div
                class="empty-description"
                v-else
              >
                <span>{{ $t('service.enterDetail') }}</span>
              </div>
            </dd>
          </div>

          <div
            class="no-data-wrap"
            v-if="!osType.bpInfo.iconImage || !osType.bpInfo.category || !osType.bpInfo.summary || !(osType.selectedSwLicenseList && osType.selectedSwLicenseList.length)"
          >
            <i class="add-icon" />
            <span style="margin-left: 10px;">{{ $t('service.requiredTemplate') }}</span>
          </div>
        </li>
      </ul>
    </section>
    <!-- 마켓플레이스 리스트 -->

    <section
      v-if="!mpContentsLoaded && !copiedOsTypeData.length"
      class="empty-data"
    >
      {{ $t('common.PLACEHOLDER.noData') }}
    </section>

    <section
      v-if="copiedOsTypeData.length"
      class="pagination-wrap"
    >
      <el-pagination
        layout="prev, pager, next"
        :total="osTypeData.length"
        :page-size="initDataCount"
        :current-page="currentPage"
        @current-change="changingPage"
      />
    </section>
  </div>
</template>

<script>
import API, { FilteringComponent, DashboardPanel } from '@sd-fe/cmp-core'
import BlockRouteMixins from '@/components/Utils/BlockRoute.mixins'

export default {
  name: 'MarketPlaceContents',
  mixins: [BlockRouteMixins],
  components: {
    FilteringComponent,
    'dashboard-panel': DashboardPanel
  },
  watch: {
    osTypeData (newVal) {
      this.copiedOsTypeData = JSON.parse(JSON.stringify(newVal))
      this.changingPage(this.currentPage)
    }
  },
  async created () {
    await this.getOsTypeGroup()
    await this.getSwLicenseList()
    await this.getBlueprints(this.filterCollections)
    this.filteringData()
  },
  mounted () {
    if (this.osTypeData?.length) {
      this.copiedOsTypeData = JSON.parse(JSON.stringify(this.osTypeData))
      this.changingPage(this.currentPage)
      // this.copiedOsTypeData = [...this.copiedOsTypeData].splice(0, this.initDataCount)
    }
  },
  methods: {
    /**
     * @function
     * @param {Object} - 이동할 route에 대한 parameter
     * @return {void}
     */
    routeTo (parameter) {
      if (parameter) {
        this.$router.push({
          name: 'marketplace-detail',
          params: parameter
        })
      }
    },
    /**
     * 필터링을 reset 할 경우 작동합니다
     */
    resetTags () {
      this.checkedFilters = {
        linux: false,
        windows: false,
        was: false,
        web: false,
        db: false,
        app: false,
        true: false,
        false: false
      }
      this.filterCollections = {}
      this.searchBpName = ''
      console.log('%c ## 필터 리셋!', 'color: #9c9c64')

      this.filteringData()
      return this.checkedFilters
    },
    /**
     * @function - 체크박스가 클릭될 때 데이터를 입력합니다.
     */
    filteringData () {
      const filters = this.checkedFilters
      const keys = Object.keys(filters)
      const chkData = keys.filter(key => filters[key] ? key : false)
      const collection = {
        os: this.osTypeGroup,
        svc: ['was', 'web', 'db', 'app'],
        pub: ['true', 'false'],
        bpName: ''
      }

      let collections = { os: [], svc: [], pub: [], bpName: '' }

      // chkData 에 데이터가 있을경우
      if (chkData.length || this.searchBpName) {
        for (const i in collection) {
          chkData.forEach(data => {
            // checked된 data가 collection.os / .svc / pub 내용에 있다면...
            if (collection[i].includes(data)) collections[i].push(data)
          })
        }

        // 체크되지 않은 타입 key를 걸러줍니다
        const temp = {}
        for (const k in collections) {
          if (collections[k].length) temp[k] = collections[k]
        }

        collections = { ...temp }
        // BP명 검색 기능 추가
        if (this.searchBpName && this.searchBpName.length) {
          collections.bpName = this.searchBpName
        }
      } else collections = {}

      this.filterCollections = { ...collections }
      this.getBlueprints(this.filterCollections)
      return console.log(`%c 선택된 필터 ### ${JSON.stringify(this.filterCollections)}`, 'color: #42c856')
    },
    async getBlueprints (params) {
      const response = await API.market.getBlueprints(params)
      this.osTypeData = response
      this.getBpDescInfo()
    },
    getBpDescInfo () {
      this.osTypeData = this.osTypeData.map(os => {
        let osInfo = null
        if (os.bpImg && os.bpImg.osType) osInfo = `${os.bpImg?.osType}`
        if (os.bpImg && os.bpImg.osName) osInfo += `${os.bpImg?.osName}`
        if (os.bpImg && os.bpImg.osBit) osInfo += `${os.bpImg?.osBit}`
        const result = { ...os }
        result.osInfo = osInfo
        if (os.bpInfo.swIdxList) {
          result.selectedSwLicenseList = []
          const list = JSON.parse(os.bpInfo.swIdxList)
          for (const i in this.swLicenseList) {
            for (const j in list) {
              if (this.swLicenseList[i].swIdx === list[j]) {
                result.selectedSwLicenseList.push(this.swLicenseList[i])
              }
            }
          }
        }
        return result
      })
    },
    changingPage (pageNumber) {
      this.mpContentsLoaded = true
      const copyData = JSON.parse(JSON.stringify(this.osTypeData))
      const changeData = copyData.slice(this.initDataCount * (pageNumber - 1), this.initDataCount * pageNumber)

      this.copiedOsTypeData = changeData
      this.currentPage = pageNumber
      this.mpContentsLoaded = false
    },
    async registerBp (osType, state) {
      //  state = osType.isPub
      console.log(state, osType)
      let alarmMsg = ''
      if (osType.bpInfo.isPub) {
        alarmMsg = this.$t('common.CONFIRM.SERVICE.001')
      } else {
        alarmMsg = this.$t('common.CONFIRM.SERVICE.002')
      }
      this.$confirm(alarmMsg, '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        const payload = { ...osType.bpInfo }
        payload.displayName = this.$t('service.expoPortal')

        const response = await API.market.updateBlueprintInfo(payload)
        if (response?.data) {
          this.getBlueprints(this.filterCollections)
          this.$alert(this.$t('common.ALERT.SERVICE.015'))
        } else {
          this.$alert(this.$t('common.ALERT.SERVICE.014'))
        }
      }).catch((err) => {
        console.log(err)
        // osType.isPub = state
        osType.bpInfo.isPub = state
      })
    },
    async getSwLicenseList () {
      const installationSwLicenseList = await API.config.getSwLicenseList({ isDeleted: true })
      const osSwLicenseList = await API.config.getSwLicenseList({ isDeleted: false })

      this.swLicenseList = installationSwLicenseList.concat(osSwLicenseList)
    },
    async getOsTypeGroup () {
      try {
        const response = await API.enum.getOsTypeGroup()
        this.filterModalContents[0].options = response.map(item => {
          const label = item.name.toLowerCase()

          this.osTypeGroup.push(label)

          return {
            label,
            value: item.codeVal.toLowerCase()
          }
        })
      } catch (error) {
        console.error('OS Type 조회 오류: ', error)
      }
    }
  },
  data () {
    return {
      mpContentsLoaded: true,
      searchBpName: '',
      checkedFilters: this.resetTags(),
      filterCollections: {},
      filterModalContents: [ // filter 모달에 들어갈 내용
        {
          title: 'OS 타입',
          keyPath: 'service.osType',
          className: 'os-type',
          field: 'os',
          options: [
            { label: 'Linux', value: 'linux' },
            { label: 'Windows', value: 'windows' }
          ]
        },
        {
          title: '서비스 타입',
          keyPath: 'service.serviceType',
          className: 'service-type',
          field: 'svc',
          options: [
            { label: 'WAS', value: 'was' },
            { label: 'WEB', value: 'web' },
            { label: 'DB', value: 'db' },
            { label: 'APP', value: 'app' }
          ]
        },
        {
          title: '등록 여부',
          keyPath: 'service.register',
          className: 'register-state',
          field: 'pub',
          options: [
            { label: '등록', value: true, keyPath: 'service.PLACEHOLDER.enroll' },
            { label: '미등록', value: false, keyPath: 'service.PLACEHOLDER.unEnroll' }
          ]
        }
      ],
      osTypeGroup: [],

      // 페이지네이션 데이터
      initDataCount: 10,
      appendDataCount: 10,
      currentPage: 1,
      copiedOsTypeData: [],
      beforeState: null,
      swLicenseList: [],

      // 리스트 임시 데이터
      osTypeData: [
        // { id: 'jeus', name: 'JEUS7-RHEL7', versionDt: 'Ver jeus-7.0', date: '', subTitle: 'Red Hat Enterprise Linux Server release 7.6 (Maipo)', category: 'WAS', desc: 'JEUS는 웹 환경에서 애플리케이션을 개발하고 운영할 수 있는 플랫폼인 웹 애플리케이션 서버입니다.웹 애플리케이션 서버는 프로그램 실행 환경과 데이터베이스 접속 기능을 제공합니다.또한 여러 개의 트랜잭션을 효율적으로 관리하며, 업무를 처리하는 비즈니스 로직을 수행합니다. JEUS는 세계 상용 최초로 국제 표준인 J2EE 1.4, Java EE 5, Java EE 6와 Java EE 7을 인증 받으며 세계적으로 기술력을 인정 받은 제품입니다. 국제적으로 기술에 대한 리더쉽과 국내적으로 시장 1위 제품이라는 성과를 보여주고 있습니다. 어플리케이션의 트랜잭션 관리, 세션 유지, 부하 분산 등 다양한 기능을 제공합니다. 또한 계층화 된 구조로 유연성과 기능 확장성이 우수해 비즈니스 로직을 쉽고 효과적으로 구현할 수 있습니다.', images: require('@/assets/images/jeus_logo.png'), by: 'SSG', javaVersion: '1.6.0' },
        // { id: 'test1', name: 'WEBTOB5-RHEL7', versionDt: 'Ver webtob-5.0', date: '', subTitle: 'Red Hat Enterprise Linux Server release 7.6 (Maipo)', category: 'WEB', desc: 'WebtoB는 웹의 HTTP를 사용하여 웹 페이지가 들어 있는 파일을 사용자들에게 제공하는 웹 서버 입니다.WebtoB는 기존 웹서버가 가지고 있는 구조적인 문제를 혁신적으로 개선하여 성능 및 안정성에서 탁월한 기능을 제공하는 차세대 웹서버 제품입니다. 웹 상에서의 대규모 트랜잭션 처리에 적합하도록 설계되어 처리 속도 지연, 서버 다운 등 웹 시스템상의 문제들을 효과적으로 해결합니다. 웹서버로서의 기본 기능 외에 보안, 장애 대응, 대용량 처리 시 강력한 성능을 제공합니다.', images: require('@/assets/images/webtob_logo.png'), by: 'SSG', javaVersion: '1.6.0' },
        // { id: 'test2', name: 'WordPress Certified by Bitnami and Automattic', versionDt: 'Ver 2020.03.18', date: '13:54:04', subTitle: 'Windows, Windows Server 2019 Base 10 - 64-bit Amazon Machine Image (AMI)', category: '', desc: '', images: require('@/assets/images/marketplace_ico_02.svg'), by: 'SSG', javaVersion: '' },
        // { id: 'test3', name: 'GitLab Community Edition', versionDt: 'Ver 2020.03.18', date: '13:54:04', subTitle: 'Windows, Windows Server 2019 Base 10 - 64-bit Amazon Machine Image (AMI)', category: 'DB', desc: 'WebtoB는 웹의 HTTP를 사용하여 웹 페이지가 들어 있는 파일을 사용자들에게 제공하는 웹 서버 입니다.WebtoB는 기존 웹서버가 가지고 있는 구조적인 문제를 혁신적으로 개선하여 성능 및 안정성에서 탁월한 기능을 제공하는 차세대 웹서버 제품입니다. 웹 상에서의 대규모 트랜잭션 처리에 적합하도록 설계되어 처리 속도 지연, 서버 다운 등 웹 시스템상의 문제들을 효과적으로 해결합니다. 웹서버로서의 기본 기능 외에 보안, 장애 대응, 대용량 처리 시 강력한 성능을 제공합니다.', images: require('@/assets/images/marketplace_ico_03.svg'), by: 'SSG', javaVersion: '' },
        // { id: 'test4', name: 'Redmine Certified by Bitnami', versionDt: 'Ver 2020.03.18', date: '13:54:04', subTitle: 'Windows, Windows Server 2019 Base 10 - 64-bit Amazon Machine Image (AMI)', category: '', desc: 'WebtoB는 웹의 HTTP를 사용하여 웹 페이지가 들어 있는 파일을 사용자들에게 제공하는 웹 서버 입니다.WebtoB는 기존 웹서버가 가지고 있는 구조적인 문제를 혁신적으로 개선하여 성능 및 안정성에서 탁월한 기능을 제공하는 차세대 웹서버 제품입니다. 웹 상에서의 대규모 트랜잭션 처리에 적합하도록 설계되어 처리 속도 지연, 서버 다운 등 웹 시스템상의 문제들을 효과적으로 해결합니다. 웹서버로서의 기본 기능 외에 보안, 장애 대응, 대용량 처리 시 강력한 성능을 제공합니다.', images: require('@/assets/images/marketplace_ico_01.svg'), by: 'SSG', javaVersion: '' }
      ]
    }
  }
}
</script>

<style lang="scss">
.filter-wrapper {
  display: flex;
  width: 100%;
  > div {
    display: flex;
    align-items: center;
    margin-right: $gap-m;

    > strong {
      line-height: 20px;
      display: block;
      font-size: 13px;
      font-style: normal;
      font-weight: normal;
      letter-spacing: -0.65px;
      color: $white;
      margin-right: $gap-s;
    }

    .bp-name-input {
      border-bottom: 1px solid #64676b;
      height: 30px;
      line-height: 30px;
    }

    .magnify-icon {
      display: inline-block;
      position: relative;
      top: 0px;
      right: 0;
      width: 16px;
      height: 16px;
      transition: all .3s;
      &::before,
      &::after {
        content: '';
        position: absolute;
      }
      &::before {
        top: 0;
        left: 0;
        width: 10px;
        height: 10px;
        border: 2px solid $white;
        border-radius: 50%;
      }
      &::after {
        bottom: 1px;
        right: -1px;
        width: 7px;
        height: 2px;
        background-color: $white;
        border-radius: 2px;
        transform: rotate(45deg);
      }

      &:hover {
        &::before {
          border-color: $primary;
        }
        &::after {
          background-color: $primary;
        }
      }
    }

    ul.marketplace-filtering {
      display: flex;
      > li {
        margin-right: 15px;
        &:last-child { margin-right: 0; }
      }
      .mp-filter-checkbox {
        .el-checkbox__label { text-transform: capitalize; }
      }
    }
  }
}

.marketplace-contents {
  .filter-form {
    > .filter-options.type-filter {
      display: flex;
      align-items: center;
    }
  }
  .marketplace-list-area {
    margin-top: $gap;
  }

  .marketplace-lists {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    padding: $gap-m ($gap * 2);
    // min-height: 160px;
    cursor: pointer;
     & + .marketplace-lists {
      border-top: 1px solid $border-color;
    }
    &.-disabled {
      position: relative;
      &::before {
        content:'';
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: $black;
        opacity: .3;
        z-index: 1;
      }
    }
    // &:not(.-disabled):hover {
    //   .-sv-name {
    //     > span {
    //       position: relative;
    //       &::before {
    //         content: '';
    //         position: absolute;
    //         bottom: -3px;
    //         left: 3px;
    //         right: 3px;
    //         height: 1px;
    //         background-color: $color-lightgrey;
    //       }
    //     }
    //   }
    // }

    .-user-regist {
      position: absolute;
      top: $gap-m;
      right: $gap * 2;
      display: flex;
      align-items: center;
      &.-empty-info { color: $color-lightgrey;}
    }

    .server-image {
      display: flex;
      align-items: center;
      margin-right: 50px;
      width: 100px;
      height: 100px;
      > .no-img {
        position: relative;
        display: inline-block;
        margin-left: $gap-s;
        width: 100px;
        height: 100px;
        border: 1px dotted #515458;
        border-radius: $radius-s;
      }
      .server-img {
        width: 100px;
        height: 100px;
        > img {
          display: block;
          margin: 0 auto;
        }
      }
    }

    .list-info {
      width: calc(100% - 150px);
      > .-sv-name {
        display: flex;
        align-items: center;
        > .category-tag {
          min-width: 36px;
          font-size: 12px;
        }
        >span {
          margin-left: 10px;
          font-weight: 500;
          font-size: 18px;
        }
      }

      > .-sv-detail {
        // font-size: 14px;
        line-height: 1.57;
        color: $text-color;
        padding: $gap 0;
        width: 100%;
        letter-spacing: -0.35px;
        > span { display: flex; align-items: center; }

        b {
          display: block;
          min-width: 90px;
        }
        small {
          font-size: 13px;
        }
        .-sw-license {
          margin-top: $gap-s;
          align-items: center;
          .sw-license-wrap {
            flex-wrap: wrap;
          }
        }
      }

      >.-description {
        // border-top: 1px solid $main-black;
        overflow: hidden;
        text-overflow: ellipsis;
        position: relative;
        font-size: 14px;
        line-height: 1.57;
        text-align: left;
        color: $input-placeholder;
        padding-top: calc(#{$gap} + 1px);
        max-height: 40px;
        &:before {
          content :'';
          position: absolute;
          top: 0;
          left: 0;
          width: 15px;
          height: 1px;
          background-color: #b3b3b3;
        }
        > .empty-description {
          padding: 5px $gap-s;
          height: auto;
          border: 1px solid $gray;
          border-radius: $radius-s;
          color: $input-placeholder;
        }
      }
    }
    // .list-info

    .no-data-wrap {
      position: absolute;
      top: 50%;
      left: 50%;
      display: flex;
      align-items: center;
      color: $color-lightgrey;
      transform: translate(-50%, -50%);
      z-index: 2;
      >span {
        &:hover {text-decoration: underline;}
      }
    }
  }
  .add-icon {
    display: inline-block;
    width: 24px;
    height: 24px;
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
    background-image: url('../../../../../assets/images/icon-add-circle.svg');
    &.-image {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
}

.category-select-popper {

}

.os-wrap {
  padding-bottom: 10px !important;

  .set-os-type {
    margin-right: 5px;
  }
}
.os-list-wrap {
  border-top: 1px solid $common-border !important;
}
</style>
