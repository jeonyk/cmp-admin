<!--
  * 파일명 : OrgItsm.vue
  * 파일 기능 : 인사/조직 연동 정보 ITSM 연동 정보 리스트 노출 및 관리(추가, 변경, 삭제)
  * 작성자 : 이경환 외 4명
  * 최종 작성일 : 2021-01-27
  * License By Shinsegae I&C
  * 2021-01-27 fix: 그리드 데이터 로딩 UI 개선
 -->

<template>
  <div class="org-itsm">
    <section class="table-top-wrap">
      <total-count :total-count="totalResultCnt" />

      <div class="button-area">
        <button
          class="button"
          type="is-anti"
          @click="applyRemove"
          :disabled="!selectedRow"
        >
          {{ $v('삭제') }}
        </button>
        <button
          class="button"
          :disabled="!selectedRow"
          @click="e => applyUpdateItem(selectedRow._data)"
        >
          {{ $v('변경') }}
        </button>
        <button
          class="button"
          type="is-primary"
          :disabled="tableData.length >= 1"
          @click="e => applyUpdateItem()"
        >
          {{ $v('추가') }}
        </button>
      </div>
    </section>

    <section
      class="table-area"
      v-loading="loading"
      :element-loading-text="$t('common.PLACEHOLDER.loading')"
    >
      <cmp-grid
        :loading="loading"
        :item-source="tableData"
        :columns="columns"
        selectable
        @selectedRow="setSelectedRow"
        :init-custom-action="init"
        :column-data-map="columnDataMap"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template
          v-for="column in columns"
          :slot="column.binding"
          slot-scope="props"
        >
          <div :key="column.binding">
            <span>{{ props.row[column.binding] }}</span>
          </div>
        </template>

        <template #name>
          <div>
            신세계 Insight
          </div>
        </template>
        <template #userId="{row}">
          <div> {{ row.userId | maskingName }}</div>
        </template>
        <template #password>
          <div>
            **********
          </div>
        </template>
        <template #url="props">
          <a class="-link">{{ props.row.url }}</a>
        </template>
        <template #lastSyncTime="{row}">
          <div> {{ !row.lastSyncTime ? "-" : row.lastSyncTime }}</div>
        </template>
        <!-- URL -->
      </cmp-grid>
    </section>

    <!-- 모달 -->
    <!-- 항목 생성/수정 모달 -->
    <el-dialog
      :title="modalTitle"
      :visible.sync="newItemModal"
      class="new-item-modal"
      width="40%"
      @close="newItemModal = false"
    >
      <section
        class="modal-body"
        style="border-top: 1px solid #3D435E"
      >
        <register-contents
          :title="$v('이름')"
          required
        >
          <el-input
            :placeholder="$v('이름을 입력해주세요.')"
            v-model="updateItem.name"
          />
        </register-contents>
        <register-contents
          title="URL"
          required
        >
          <el-input
            :placeholder="$v('URL을 입력해주세요.')"
            v-model="updateItem.url"
          />
        </register-contents>
        <register-contents
          :title="$v('아이디')"
          required
        >
          <el-input
            :placeholder="$v('아이디를 입력해주세요.')"
            v-model="updateItem.userId"
          />
        </register-contents>
        <register-contents
          :title="$v('비밀번호')"
          required
        >
          <el-input
            :placeholder="$v('비밀번호를 입력해주세요.')"
            v-model="updateItem.password"
            type="password"
          />
        </register-contents>
        <!-- URL -->
      </section>

      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="newItemModal = false"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button -modal-button"
          @click="saveUpdateAction(updateItem)"
          type="is-primary"
        >
          {{ $v('확인') }}
        </button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'

export default {
  name: 'OrgItsm',
  components: {
  },
  watch: {
    newItemModal () {
      // 변경 vs 추가 모달 타이틀 설정
      // 생성 시 : "항목 추가" vs "항목 변경"
      const title = this.updateItem.crud === 'update' ? this.$v('항목 변경') : this.$v('항목 추가')
      this.modalTitle = title
    }
  },
  created () {
    this.getTableData()
  },
  methods: {
    async getTableData () {
      try {
        this.loading = true
        this.gridSetInit()

        const response = await API.work_v3.getConfigItsm()
        // 등록된 정보가 없는 경우 호출 시 // data = ''
        if (typeof response === 'string') {
          this.tableData = []
          return
        }

        const configData = {
          ...response,
          createdTime: this.$options.filters.date(response.createdTime, 'YYYY.MM.DD HH:mm:ss'),
          lastSyncTime: this.$options.filters.date(response.lastSyncTime, 'YYYY.MM.DD HH:mm:ss')
        }
        this.tableData = [configData]
      } catch (error) {
        this.tableData = []
        console.error('@@ getTableData : ', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * 템플릿 편집 -> 편집 전 데이터를 this.initData에 담아주고,
     * 업데이트 아이템을 세팅해줍니다. (생성/수정 구분을 위함)
     */
    applyUpdateItem (item) {
      this.updateItem = this.setUpdateItem(item)
      this.newItemModal = true
    },

    /**
     * 업데이트 아이템 세팅
     * @return {Object} [변경]을 누르면 체크된 친구가 updateItem, [항목 추가]를 누르면 새로운 데이터 세팅
     */
    setUpdateItem (data) {
      if (data) {
        this.updateItem = cloneDeep(data)
        this.updateItem.crud = 'update'
        return this.updateItem
      } else {
        const newTemp = {
          crud: 'create',
          id: Math.random().toString(36).substr(2),
          isActive: undefined
        }
        return newTemp
      }
    },
    applyRemove () {
      // 해당 항목을 삭제하시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.BASE.032'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      })
        .then(() => this.deleteITSM(this.selectedRow))
        .catch(() => false)
    },

    /**
     * 선택된 로우들을 삭제합니다.
     */
    async deleteITSM ({ dataItem }) {
      try {
        this.loading = true
        await API.work_v3.deleteConfigItsm()
        this.$alert(this.$t('common.ALERT.BASE.057', { type: this.$t('common.BTN.delete') }), {
          callback: () => this.getTableData()
        })
      } catch (error) {
        console.error('@@ deleteITSM : ', error)
      } finally {
        this.loading = false
      }
    },

    // =========================
    // ======== 생성/수정 =========
    // =========================
    /**
     * 항목 생성/수정 모달에서 [확인]을 눌렀을 때 해당 로우 저장
     */
    saveUpdateAction (item = this.updateItem) {
      const url = new RegExp(/http(s?:\/\/([a-zA-Z0-9]{2,}:[0-9]{1,})|(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|s?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|([a-zA-Z0-9]+\.[^\s]{2,}))/, 'gi')
      const lastFormatCheck = new RegExp(/[\u3131-\u314e|\u314f-\u3163|\uac00-\ud7a3]|\/$|[!?=]|\s/, 'gi')

      const conditions = [
        // 1. 이름, 2. URL, 3.UserName, 4.Password
        { condition: item.name !== undefined, message: this.$v('유저명을 입력해주세요.') }, // URL을 입력해주세요.
        { condition: item.name !== '', message: this.$v('유저명을 입력해주세요.') }, // URL을 입력해주세요.
        { condition: item.url !== undefined, message: 'common.ALERT.ORG.013' }, // URL을 입력해주세요.
        { condition: item.url !== '', message: 'common.ALERT.ORG.013' }, // URL을 입력해주세요.
        { condition: url.test(item.url), message: 'common.ALERT.ORG.010' }, // 잘못된 URL입니다.
        { condition: !lastFormatCheck.test(item.url), message: '도메인 주소 및 IP 만 입력해주세요.' }, // 도메인 주소 및 IP 만 입력해주세요.
        { condition: item.userId !== undefined, message: this.$v('아이디를 입력해주세요.') },
        { condition: item.userId !== '', message: this.$v('아이디를 입력해주세요.') },
        { condition: item.password !== undefined, message: this.$v('비밀번호를 입력해주세요.') },
        { condition: item.password !== '', message: this.$v('비밀번호를 입력해주세요.') }
      ]

      const validator = conditions.every(({ condition, message }) => {
        if (!condition) this.$alert(this.$t(message), { callback: () => false })
        return condition
      })

      if (!validator) return false

      // 내용을 저장하시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.BASE.001'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        const payload = {
          createdTime: null,
          lastSyncTime: null,
          name: item.name,
          password: item.password,
          url: item.url,
          userId: item.userId
        }
        this.saveITSM(payload)
      }).catch(() => false)
    },
    /**
     * ITSM 변경 / 저장
     */
    async saveITSM (payload) {
      try {
        await API.work_v3.updateConfigItsm(payload)
        this.$alert(this.$t('common.ALERT.BASE.049'), {
          callback: () => {
            this.newItemModal = false
            this.getTableData()
          }
        })
      } catch (error) {
        const message = this.$v('작업을 진행할 수 없습니다. <br> 관리자에게 문의하세요.')
        this.$alert(message, {
          dangerouslyUseHTMLString: true
        })
        console.error('@@ saveITSM', error)
      }
    },

    gridSetInit () {
      // if (this.grid) {
      //   const cv = this.grid.collectionView
      //   cv.refresh()
      // }
      this.selectedRow = null
    },
    activeSync () {
      this.lastSync = new Date()
    },
    alertResult (result, type) {
      if (result) {
        this.$alert(this.$t('common.ALERT.BASE.057', { type }))
      } else {
        this.$alert(this.$t('common.ALERT.BASE.058', { type }))
      }
    },
    init (grid) {
      this.grid = grid
    },
    setSelectedRow (row) {
      this.selectedRow = row
    }
  },
  data () {
    return {
      totalResultCnt: 0,
      otp: false,
      otpModalActive: false,
      selectedRow: null,
      modalTitle: '',
      newItemModal: false,
      tableData: [],
      initData: null,
      updateItem: {},
      loading: false,

      // 테이블 정보
      columns: [
        { header: '이름', binding: 'name', customHtml: true },
        { header: 'URL', binding: 'url', customHtml: true, width: 400 },
        { header: '아이디', binding: 'userId', customHtml: true },
        { header: '비밀번호', binding: 'password', customHtml: true },
        { header: this.$v('생성 시간'), binding: 'createdTime' },
        { header: this.$v('동기화 시간'), binding: 'lastSyncTime', customHtml: true }
      ],

      // 상태 옵션
      userStateOptions: [
        { field: true, label: this.$t('admin.ACCOUNT.active') },
        { field: false, label: this.$t('admin.ACCOUNT.inactive') }
      ],
      columnDataMap: {
        isActive: [
          { value: true, caption: this.$t('admin.ACCOUNT.active') },
          { value: false, caption: this.$t('admin.ACCOUNT.inactive') }
        ]
      }

    }
  }
}
</script>
<style lang="scss">
  .org-itsm {
    .table-area {
      margin-top: $gap;
      .wj-cell {
        overflow: visible;
      }
      .text-url {
        color: $main-blue;
        &:hover {text-decoration: underline;}
      }
    }
  }
</style>
