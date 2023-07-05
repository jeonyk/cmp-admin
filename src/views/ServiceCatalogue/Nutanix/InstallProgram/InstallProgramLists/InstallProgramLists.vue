<!--

  * 파일명 : InstallProgramLists.vue
  * 파일 기능 : 서비스 카탈로그 > 설치프로그램 정보 리스트, 설치프로그램 추가/수정/삭제 기능, 필터링(OS / 사용 여부)
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-01-15
  * License By Shinsegae I&C
  * 2021-01-15 Update: lodash 사용방식 변경
 -->

<template>
  <section
    class="install-program"
    v-loading="loading"
  >
    <filtering-component
      @reset-data="resetSearch"
    >
      <div class="filtering-list">
        <span class="filter-name">{{ $v('카테고리') }}</span>
        <div class="filter-options">
          <el-select
            v-model="filter.category"
            :placeholder="$t('common.BTN.select')"
            :popper-append-to-body="false"
            @change="category => getinstallProgramSwList(category, filter.name)"
          >
            <el-option
              v-for="{ label, value } in filterCategories"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </div>
      </div>

      <search-bar
        ref="searchbar"
        :user-reset-icon="false"
        :placeholder="$v('설치프로그램명을 입력해주세요')"
        @input="name => getinstallProgramSwList(filter.category, name)"
        @reset="name => getinstallProgramSwList(filter.category, name)"
      />
    </filtering-component>
    <!-- /. 검색창, 설치이력 조회 -->

    <article>
      <div class="option-section">
        <total-count :total-count="tableData.length" />
        <div class="script-action-buttons flex-wrap -space-between">
          <button
            class="button"
            type="is-primary"
            @click="updateProgram('add', `${$v('설치프로그램')} ${$t('common.BTN.add')}`)"
          >
            {{ $v('추가') }}
          </button>
          <button
            class="button"
            type="is-primary"
            @click="viewInstallhistory = true"
          >
            {{ $v('Script 실행 이력조회') }}
          </button>
        </div>
      </div>

      <cmp-grid
        :item-source="tableData"
        :columns="columns"
        :use-column-filter="false"
        selectable
        @selectedRow="routeTo"
      >
        <template #category="{ row }">
          <el-tooltip
            v-if="row.category.length > 0"
            effect="light"
            placement="right"
            :disabled="row.category.length > 1"
          >
            <span>{{
              row.category.length > 1 ? `${row.category[0]} 외 ${row.category.length - 1}` : row.category[0]
            }}</span>

            <template #content>
              <p
                v-for="category in row.category"
                :key="category"
              >
                {{ category }}
              </p>
            </template>
          </el-tooltip>

          <span v-else>-</span>
        </template>
        <!-- /. SW 라이선스 카테고리 -->

        <template #osTypes="{ row }">
          <el-tooltip
            v-if="row.osTypes.length > 1"
            effect="light"
            placement="right"
          >
            <span>{{ `${row.osTypes[0]} 외 ${row.osTypes.length - 1}` }}</span>

            <template #content>
              <p
                v-for="osType in row.osTypes"
                :key="osType"
              >
                {{ osType }}
              </p>
            </template>
          </el-tooltip>

          <span v-else>{{ row.osTypes[0] }}</span>
        </template>
        <!-- /. 운영체제 -->

        <template #edit="{ row }">
          <span class="-edit">
            <i
              class="-edit-icon"
              @click.stop="updateProgram('update', `${row.name} ${$t('common.BTN.change')}`, row)"
            />
            <i
              class="-delete-icon"
              @click.stop="setDeleteProgram(true, row)"
            />
          </span>
        </template>
      </cmp-grid>
    </article>

    <!-- /////////// -->
    <!-- /// 모달 /// -->
    <!-- /////////// -->
    <install-program-history
      :visible="viewInstallhistory"
      @close="viewInstallhistory = false"
      :title="$v('Script 실행 이력조회')"
      width="1450px"
      top="50px"
    />
    <!-- /. Script 실행 이력조회 모달 -->

    <install-program-update
      :visible="setSwModal.visible"
      :type="setSwModal.type"
      :title="setSwModal.title"
      :data="setSwModal.data"
      width="800px"
      @close="setSwModal.visible = false"
      @update="updateSwAction"
    />
    <!-- /. 설치프로그램 추가/수정 모달 -->

    <install-program-delete
      :status="deleteSwModal"
      @delete="deleteProgram"
    />
  </section>
</template>

<script>
import API, { FilteringComponent } from '@sd-fe/cmp-core'
import SearchBar from '@/components/SearchBar/SearchBar'
import InstallProgramMixins from '../InstallProgramMixins.script'
import InstallProgramHistory from './InstallProgramHistory'
import InstallProgramUpdate from '../InstallProgramConfig/InstallProgramUpdate'
import InstallProgramDelete from '../InstallProgramConfig/InstallProgramDelete'
import { mapState } from 'vuex'

export default {
  name: 'InstallProgramLists',
  mixins: [InstallProgramMixins],
  components: {
    'filtering-component': FilteringComponent,
    'search-bar': SearchBar,
    'install-program-history': InstallProgramHistory,
    'install-program-update': InstallProgramUpdate,
    'install-program-delete': InstallProgramDelete
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  created () {
    this.init()
  },
  methods: {
    init () {
      console.clear()

      this.getMeteringCategory()
      this.getinstallProgramSwList()
    },
    /**
     * [카테고리] 필터링 옵션 목록 세팅
     */
    async getMeteringCategory () {
      try {
        const response = await API.metering.getSWLicenseCategory()

        this.filterCategories = response.map(({ categoryIdx, categoryName }) => {
          return { label: this.$v(categoryName), value: categoryIdx }
        })
      } catch (error) {
        console.error('@@ getMeteringCategory', error)
      }
    },
    /**
     * 설치프로그램 관리 목록 조회 (with. 검색 기능)
     * @param {String} category 카테고리
     * @param {String} name 검색어
     */
    async getinstallProgramSwList (category = undefined, name = undefined) {
      try {
        this.loading = true

        const date = date => this.$options.filters.date(date, 'YYYY.MM.DD')

        const response = await API.sw.getinstallProgramSwList({ category, name })

        this.tableData = response.map(({
          id, name, description,
          versionList, createDate, updateDate,
          createUserName, updateUserName
        }) => {
          const cates = [] // SW 라이선스 카테고리
          const setOsType = [] // 운영체제

          versionList.forEach(({ swList, osType }) => {
            setOsType.push(osType) // 운영체제 세팅
            swList.forEach(({ name }) => cates.push(name)) // 라이선스 카테고리 세팅
          })

          // console.log(cates, setOsType)
          const categories = [...new Set(cates)]
          const osTypes = [...new Set(setOsType)]
          // console.log(categories)

          return {
            id,
            name,
            description,
            category: categories, // S/W 라이선스 카테고리
            versionCnt: versionList.length, // 등록 버전 수
            osTypes: osTypes.length > 0 ? osTypes : '-', // 운영체제
            createDate: date(createDate),
            createUserName,
            updateDate: date(updateDate),
            updateUserName
          }
        })

        this.loading = false
      } catch (error) {
        this.tableData = []
        console.error('@@ getinstallProgramSwList : ', error)
        // 설치프로그램 목록을 불러오는데 실패했습니다. 다시 시도해주세요.
        this.$alert(this.$t('service.INSTALL.ALERT.003'), { callback: () => false })
      } finally {
        this.loading = false
      }
    },

    /**
     * 검색 조건 리셋
     */
    resetSearch () {
      this.filter = { category: undefined }
      this.$refs.searchbar.refresh()
    },

    /**
     * [설치프로그램 추가 / 수정]
     * [추가] type: 'add', title: '설치프로그램 추가'
     * [수정] type: 'update', title: '{SW Name} 변경'
     */
    updateProgram (type, title, item = null) {
      this.setSwModal = {
        visible: true,
        type,
        title,
        data: item
      }
    },
    /**
     * [SW 삭제]시 세팅
     */
    setDeleteProgram (status, item = null) {
      // 설치프로그램은 최고관리자만 수행 가능합니다. 최고관리자에게 문의바랍니다
      if (this.user.userPermLevel !== 0) {
        // 설치프로그램 삭제는 <br>최고 관리자만 수행 가능합니다.<br>최고관리자에게 문의 바랍니다.
        this.$alert(this.$t('service.INSTALL.ALERT.004'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
        return
      }

      this.deleteSwModal = {
        visible: status,
        item,
        value: undefined,
        disabled: true,
        name: item ? item.name : null // 삭제시 입력할 이름
      }
    },
    /**
     * 삭제 시에는 true 를 내보내주어 액션을 취하고,
     * 아닐경우에는 그냥 삭제 모달 close 만 합니다.
     */
    async deleteProgram (action) {
      if (action === true) {
        try {
          const { userIdx } = this.user
          await API.sw.deleteSw(this.deleteSwModal.item.id, userIdx)
          // `${this.deleteSwModal.item.name}(이)가 삭제되었습니다.
          this.$alert(this.$t('service.INSTALL.ALERT.005', { name: this.deleteSwModal.item.name }), {
            callback: () => {
              this.init()
              return false
            }
          })
        } catch (error) {
          console.error('@@ deleteProgram : ', error)
        }
      }
      return this.setDeleteProgram(false)
    },

    // ============================
    // ========= [설치프로그램 추가] =========
    // ============================

    /**
     * [설치프로그램 추가] 시 payload 를 정의합니다.
     * @param { Object } items 변경된 데이터 입력
     */
    addSw ({ name, description, ...items }) {
      const { userIdx } = this.user
      const payload = {
        name,
        createUserIdx: userIdx,
        description
      }

      // console.log(JSON.stringify(payload))
      return this.addSwVersion(payload)
    },
    /**
     * [설치프로그램 추가] API 정의
     * 동일한 조건(SW 라이선스, 지원 OS, OS bits)에 등록하는경우 차단
     * 동일한 SW 라이선스 밑에 지원하는 다른 OS 를 설정한 경우는 해당 SW 라이선스 versionList 아래로 들어감
     */
    async addSwVersion (payload) {
      try {
        await API.sw.createinstallProgram(payload)

        this.init()
        this.closeSetSwModal()
      } catch (error) {
        this.catchMessage(error, this.$v('설치프로그램 추가에 실패했습니다. <br> 다시 시도해주세요'))
        console.error('@@ addSwVersion : ', error)
      }
    },

    // ============================
    // ======== [설치프로그램 변경] ========
    // ============================

    /**
     * [설치프로그램 변경] 시 payload 를 정의합니다.
     * @param { Object } items 변경된 데이터 입력
     */
    updateSw ({ name, description, softwareId, ...items }) {
      const { userIdx } = this.user
      const payload = {
        name,
        updateUserIdx: userIdx,
        description,
        id: softwareId
      }

      // console.log(JSON.stringify(payload))
      return this.updateSwVersion(payload)
    },

    /**
     * [설치프로그램 변경] API 정의
     */
    async updateSwVersion (payload) {
      try {
        await API.sw.updateinstallProgram(payload)
        // await API.sw.updateSwVersion(payload)
        this.init()
        this.closeSetSwModal()
      } catch (error) {
        console.error('@@ updateSwVersion : ', error)
        // SW 변경에 실패했습니다. <br> 다시 시도해주세요
        this.$alert(this.$t('service.INSTALL.ALERT.007'), '', { dangerouslyUseHTMLString: true, callback: () => false })
      }
    },

    // ==========================
    // ========== [공용] =========
    // ==========================

    /**
     * [설치프로그램 추가 / 변경] 시 실행할 활동을 정의합니다.
     * @param { Object } item 내부 모달에서 정의한 내용
     */
    updateSwAction (item) {
      // console.log(item)
      const type = {
        add: () => this.addSw(item),
        update: () => this.updateSw(item)
      }

      return type[this.setSwModal.type]()
    },

    /**
     * 모달 닫기
     */
    closeSetSwModal () {
      this.setSwModal = {
        visible: false,
        type: undefined
      }
    },

    /**
     * 클라우드 타입에 따라 이동 경로 다르게함
     */
    routeTo ({ dataItem }) {
      const name = {
        VMWARE: 'install-program-detail-vmw',
        NUTANIX: 'install-program-detail'
      }[this.cloud]

      return this.$router.push({ name, params: { idx: dataItem.id, name: dataItem.name } })
    }
  },
  data () {
    return {
      loading: false,
      categoryKeys: {},
      filterCategories: [],
      filter: {
        category: undefined,
        name: undefined,
        startDate: undefined,
        endDate: undefined
      },
      installCnt: 0,
      rawData: [],
      tableData: [],
      columns: [
        { header: '설치프로그램 이름', binding: 'name' },
        { header: this.$v('S/W 라이선스 카테고리'), binding: 'category', customHtml: true },
        { header: this.$v('설명'), binding: 'description' },
        { header: this.$v('등록 버전 수'), binding: 'versionCnt' },
        { header: this.$v('운영체제'), binding: 'osTypes', customHtml: true },
        { header: this.$v('등록일'), binding: 'createDate' },
        { header: this.$v('등록관리자명'), binding: 'createUserName' },
        { header: this.$v('수정일'), binding: 'updateDate' },
        { header: this.$v('수정관리자명'), binding: 'updateUserName' },
        { header: ' ', binding: 'edit', width: 100, customHtml: true }
      ],
      viewInstallhistory: false, // 설치 이력 조회 모달 on/off
      setSwModal: {
        visible: false, // 설치프로그램 추가 모달 on/off
        type: undefined // 설치프로그램 추가 :: add / 수정 :: update
      },
      deleteSwModal: { // 삭제할 SW
        visible: false,
        item: null,
        value: undefined,
        disabled: true
      },
      page: 1,
      initDataCount: 18
    }
  }
}
</script>

<style lang="scss" scoped>
.option-section {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  > .script-action-buttons {
    button:first-child { margin-right: $gap-s; }
  }
}

.-edit {
  display: flex;
  align-items: center;
  width: 50px;
  justify-content: space-between;
  margin: 0 auto;

  > i {
    display: block;
  }
}

.programs-list {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: 140px;
  max-height: 700px;
  overflow-y: auto;
  row-gap: 20px;
  padding-right: 10px;
  column-gap: 20px;
  width: calc(100% + 10px);

  .item {
    display: block;
    background-color: #080B20;
    width: 250px;
    height: 140px;
    overflow:hidden;
    transition: .3s ease;
    position: relative;
    border-radius: 0px 0px $radius-m $radius-m;
    border-top: 2px solid #C0D7ED;
    box-sizing: border-box;
    &:hover { box-shadow: 0 0 20px 0px #0A102299; }

    .-info {
      background-color: #080B20;
      width: 100%;
      box-sizing: border-box;
      font-size: 14px;
      font-weight: 700;

      > label {
        display: block;
        font-size: 18px;
        margin-bottom: $gap;
        padding: 20px 20px 0 20px;

        > strong {
          display: block;
          font-weight: normal;
          font-size: 12px;
          color: $sea-blue;
          margin-bottom: $gap-s;
        }
      }
      > .-detail {
        color: #9D9D9D;
        font-size: 12px;
        display: flex;
        > p {
          padding: 0 20px;
          flex: 1 1 125px;
          display: flex;
          flex-direction: column;

          &:last-child { border-left: 1px solid #2A2D44; }
        }
        small {
          &:last-child { margin : 0 }
          margin-bottom: $gap-s;
          font-weight: normal;
        }
      }
    }

    // 프로그램 추가 (❌)
    &.-add-item {
      background-color: transparent;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .-add-icon {
        border: 1px dotted $input-placeholder;
        display: inline-block;
        width: 75px;
        height: 75px;
        border-radius: 50%;
        margin-bottom: $gap;
        position: relative;

        &::before,
        &::after {
          content: '';
          position: absolute;
          background-color: $input-placeholder;
        }
        &::before {
          top: calc(50% - 11px); left: 50%;
          height: 25px;
          width: 1px;
        }
        &::after {
          left: calc(50% - 11px); top: 50%;
          width: 26px;
          height: 1px;
        }
      }
      p {
        text-align: center;
        font-size: 15px;
        line-height: 20px;
        span {
          color: $primary
        }
      }
    }

    .new {
      width: 16px; height: 16px;
      display: block;
      line-height: 18px;
      text-align: center;
      background-color: $primary;
      border-radius: 1px;
      margin-right: 5px;
      font-size: 11px;
      transition: .3s ease color;
    }

    &.-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      color: $input-placeholder;
    }
  }
}

</style>
