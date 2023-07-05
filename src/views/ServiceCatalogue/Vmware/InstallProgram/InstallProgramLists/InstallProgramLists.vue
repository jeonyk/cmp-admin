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
    <div class="option-section">
      <search-bar
        @input="value => getinstallProgramSwList(value)"
        @reset="value => getinstallProgramSwList(value)"
      />
      <button
        class="button"
        type="is-primary"
        @click="viewInstallhistory = true"
      >
        <!-- 설치 이력 조회 -->
        {{ $t('service.INSTALL.history') }}
      </button>
    </div>
    <!-- /. 검색창, 설치이력 조회 -->

    <article class="programs-list">
      <a
        class="item -add-item"
        @click="updateProgram('add', `S/W ${$t('common.BTN.add')}`)"
      >
        <span class="-add-icon" />
        <p>
          <!-- 추가 가능한 설치프로그램이 <br>
          <span><b>{{ installCnt }}</b>건</span> 존재합니다. -->
          {{ $t('service.INSTALL.ALERT.001') }} <br>
          <span><b>{{ installCnt }}</b>{{ $t('main.DASHBOARD.count') }}</span>
          {{ $t('service.INSTALL.ALERT.002') }}
        </p>
      </a>
      <a
        v-for="item in tableData"
        class="item"
        :key="item.id"
        @click="$router.push({ name:'install-program-detail-vmw', params: { idx: item.id, name: item.name } })"
      >
        <div class="-image">
          <img :src="item.thumbnailImage ? item.thumbnailImage : require('/src/assets/images/spharos-logo-sol-dark.png')">
        </div>

        <div class="-info">
          <label>
            <span
              v-if="(86400000 > (Date.now() - item.createDate))"
              class="new"
            >N</span>
            {{ item.name }}
          </label>

          <span class="-edit">
            <i
              class="-edit-icon"
              @click.stop="updateProgram('update', `${item.name} ${$t('common.BTN.change')}`, item)"
            />
            <i
              class="-delete-icon"
              @click.stop="setDeleteProgram(true, item)"
            />
          </span>
        </div>
      </a>
      <a
        v-if="tableData.length <= 0"
        class="item -empty"
      >
        <p>데이터가 없습니다.</p>
      </a>
    </article>
    <!-- /. 프로그램 리스트 -->

    <!-- /////////// -->
    <!-- /// 모달 /// -->
    <!-- /////////// -->
    <install-program-history
      :visible="viewInstallhistory"
      @close="viewInstallhistory = false"
      :title="$t('service.INSTALL.history')"
      width="1450px"
      top="50px"
    />
    <!-- /. 설치 이력 조회 모달 -->

    <install-program-update
      :visible="setSwModal.visible"
      :type="setSwModal.type"
      :title="setSwModal.title"
      :data="setSwModal.data"
      width="990px"
      top="50px"
      @close="setSwModal.visible = false"
      @update="updateSwAction"
    />
    <!-- /. SW 추가/수정 모달 -->

    <install-program-delete
      :status="deleteSwModal"
      @delete="deleteProgram"
    />
  </section>
</template>

<script>
import API from '@sd-fe/cmp-core'
import SearchBar from '@/components/SearchBar/SearchBar'
import InstallProgramHistory from './InstallProgramHistory'
import InstallProgramUpdate from '../InstallProgramConfig/InstallProgramUpdate'
import InstallProgramDelete from '../InstallProgramConfig/InstallProgramDelete'
import { mapState } from 'vuex'

export default {
  name: 'InstallProgramLists',
  components: {
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
  watch: {
  },
  created () {
    this.init()
  },
  methods: {
    init () {
      console.clear()
      this.getSwnewCnt()
      this.getinstallProgramSwList()
    },
    /**
     * 설치프로그램 관리 목록 조회
     */
    async getinstallProgramSwList (name) {
      try {
        this.loading = true
        const response = await API.sw.getinstallProgramSwList({ name })

        // console.log(response)
        this.tableData = response
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
     * [추가 가능한 설치프로그램] 갯수 가져오기
     */
    async getSwnewCnt () {
      try {
        const count = await API.sw.getSwnewCnt()
        this.installCnt = count
      } catch (error) {
        console.error('@@ getSwnewCnt : ', error)
      }
    },
    /**
     * [SW 추가 / 수정]
     * [추가] type: 'add', title: 'S/W 추가'
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
          await API.sw.deleteSw(this.deleteSwModal.item.id)
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
    // ========= [SW 추가] =========
    // ============================

    /**
     * [SW 추가] 시 payload 를 정의합니다.
     * @param { Object } items 변경된 데이터 입력
     */
    addSw ({ swIdx, supportOs, osBits, swVersion, desc, thumbnailImage, thumbnailName, ...items }) {
      const payload = {
        createUserIdx: this.user.userIdx,
        versionList: [
          {
            swIdx,
            osType: supportOs,
            bitType: osBits,
            version: swVersion,
            description: desc,
            thumbnailName,
            thumbnailImage // base64 encode
          }
        ]
      }

      // console.log(JSON.stringify(payload))
      return this.addSwVersion(payload)
    },
    /**
     * [SW 추가] API 정의
     * 동일한 조건(SW 라이선스, 지원 OS, OS bits)에 등록하는경우 차단
     * 동일한 SW 라이선스 밑에 지원하는 다른 OS 를 설정한 경우는 해당 SW 라이선스 versionList 아래로 들어감
     */
    async addSwVersion (payload) {
      try {
        await API.sw.addSwVersion(payload)
        this.init()
        this.closeSetSwModal()
      } catch (error) {
        console.error('@@ addSwVersion : ', error)
        // SW 추가에 실패했습니다. <br> 다시 시도해주세요
        this.$alert(this.$t('service.INSTALL.ALERT.006'), '', { dangerouslyUseHTMLString: true, callback: () => false })
      }
    },

    // ============================
    // ======== [{SW} 변경] ========
    // ============================

    /**
     * [{SW} 변경] 시 payload 를 정의합니다.
     * @param { Object } items 변경된 데이터 입력
     */
    updateSw ({ swIdx, supportOs, osBits, swVersion, versionId, softwareId, desc, thumbnailName, thumbnailImage, ...items }) {
      const payload = {
        id: versionId,
        bitType: osBits,
        osType: supportOs,
        swIdx,
        version: swVersion,
        softwareId,
        description: desc,
        thumbnailName,
        thumbnailImage, // base64 encode
        updateUserIdx: this.user.userIdx
      }

      // console.log(JSON.stringify(payload))
      return this.updateSwVersion(payload)
    },

    /**
     * [{SW} 변경] API 정의
     */
    async updateSwVersion (payload) {
      try {
        await API.sw.updateSwVersion(payload)
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
     * [SW 추가 / 변경] 시 실행할 활동을 정의합니다.
     * @param { Object } item 내부 모달에서 정의한 내용
     */
    updateSwAction (item) {
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
    }
  },
  data () {
    return {
      loading: false,
      installCnt: 0,
      tableData: [],
      viewInstallhistory: false, // 설치 이력 조회 모달 on/off
      setSwModal: {
        visible: false, // SW 추가 모달 on/off
        type: undefined // SW 추가 :: add / 수정 :: update
      },
      deleteSwModal: { // 삭제할 SW
        visible: false,
        item: null,
        value: undefined,
        disabled: true
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.option-section {
  margin-bottom: $gap-m;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.programs-list {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: 220px;
  height: 700px;
  overflow-y: auto;
  row-gap: 20px;
  padding-right: 10px;
  column-gap: 20px;
  width: calc(100% + 10px);

  .item {
    display: block;
    background-color: #080B20;
    width: 250px;
    height: 220px;
    overflow:hidden;
    border-radius: $radius-m;
    transition: .3s ease;
    position: relative;
    &:hover { box-shadow: 0 0 20px 0px #0A102299; }

    .-image {
      width: 100%;
      height: calc(100% - 50px);
      // background-color: #656988;
      background-color: $white;
      padding-bottom: 50px;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        display: block;
        width: 80%;
        height: 80%;
        object-fit: contain;
      }
    }

    .-info {
      background-color: #080B20;
      height: 50px;
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      box-sizing: border-box;
      padding: 0 $gap;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      font-weight: 700;

      label { display: flex; }

      .-edit {
        display: flex;
        align-items: center;

        > i {
          display: block;
          margin-left: $gap-s;
        }
      }
    }

    // 프로그램 추가
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
