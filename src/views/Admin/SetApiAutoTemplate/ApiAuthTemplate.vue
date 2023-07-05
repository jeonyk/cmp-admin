<template>
  <div class="api-auth-template">
    <section
      class="select-auth-wrapper"
      v-loading="authListLoading"
    >
      <cmp-grid
        :item-source="authList"
        :columns="columns"
        :height="610"
        :use-column-filter="false"
        :init-custom-action="setGrid"
        class="auth-grid"
        paging-type="list"
        :selectable="!editingList"
        keep-select
        @selectedRow="selectedRow"
        :init-auto-select-row="initSelectedTemplate"
        init-auto-select-row-key="authorityIdx"
      >
        <template #authName="props">
          <el-input
            v-if="props.row._grid && props.row._grid.edit"
            v-model="props.row.authName"
            maxlength="10"
            show-word-limit
            class="auth-name-fix-input"
            :ref="'nameInput_' + props.cell.index"
            :placeholder="$t('admin.TEMPLATE.PLACEHOLDER.001')"
          />
          <!-- /. 권한명 입력 -->
          <div
            class="auth-ticket"
            v-else
          >
            <div class="-left">
              <strong
                :class="['-status', { '-y': props.row.isUse }]"
                @click.stop="editTemplate(props.row)"
              >
                {{ props.row.isUse ? 'Y' : 'N' }}
              </strong>
              <p class="-info">
                <span>{{ props.row.authorityName }}</span>
                <small>
                  <span>
                    <!-- 생성일 : -->
                    {{ $t('admin.TEMPLATE.createTime') }} :
                    {{ props.row.createTime | date('YYYY-MM-DD') }}
                  </span>
                  <span>{{ props.row.userName }}({{ props.row.userId | maskingName }})</span>
                </small>
              </p>
            </div>

            <span
              class="button-area -right"
              v-if="!editingList"
            >
              <a
                class="-icon -copy-icon"
                @click.stop="copyAuth(props.row)"
              />
              <a
                class="-icon -delete-icon"
                @click.stop="deleteAuth(props.row)"
              />
            </span>
            <!-- /. 복사/편집/삭제 버튼 -->
          </div>
        </template>
      </cmp-grid>
      <!-- /. 권한 템플릿 리스트 -->

      <div class="button-area -select-auth-btns">
        <button
          class="button"
          type="is-primary"
          size="is-large"
          @click="addAuth"
          :disabled="editingList"
        >
          <!-- 권한 템플릿 등록 -->
          {{ $t('admin.TEMPLATE.add_auth_template') }}
        </button>
      </div>
    </section>
    <!-- /. 권한 템플릿 리스트 (좌측) -->

    <i class="mdi mdi-chevron-double-right" />

    <section
      class="select-auth-wrapper button-wrapper"
      v-loading="templateLoad"
    >
      <project-auth-tree
        :height="editingList ? '600' : '670'"
        :data="apiTemplates"
        :read-only="!editingList"
        @change="changeTemplate"
      />
      <p
        class="alert-left"
        v-if="editingList"
        v-html="$t('admin.TEMPLATE.ALERT.005')"
      >
        <!-- Read 권한은 Create, Update, Delete 권한 부여 시 자동으로 부여됩니다. <br>
        또한 Read 권한 해제 시 Create, Update, Delete 권한은 자동으로 해제됩니다. -->
      </p>
      <div
        class="button-area -right"
        v-if="editingList"
      >
        <button
          class="button"
          type="is-anti"
          @click="cancelAuth"
        >
          <!-- 취소 -->
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="saveNewAuth"
        >
          <!-- 확인 -->
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
    </section>
    <!-- /. 우측 템플릿 -->
  </div>
</template>

<script>
import { mapState } from 'vuex'
import ProjectAuthTree from './ProjectAuthTree'
import API from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'
import BlockRouteMixins from '@/components/Utils/BlockRoute.mixins'

export default {
  name: 'ApiAuthTemplate',
  mixins: [BlockRouteMixins],
  components: {
    'project-auth-tree': ProjectAuthTree
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  mounted () {
    this.init()
  },
  watch: {
    authList (data) {
      // 리스트 편집중인지 확인
      this.editingList = !!data[0]?.editing
      if (data.length === 0) this.selectedTemplate = null

      this.$nextTick(() => {
        // 좌측 템플릿 목록 height 설정
        if (this.grid) this.grid.rows.forEach(row => (row.height = 80))
      })
    },
    async selectedTemplate (templateRow) {
      if (templateRow) {
        this.apiTemplates = await this.getAuthorityTemplate(templateRow.dataItem)
      } else {
        this.apiTemplates = []
      }
    }
  },
  methods: {
    /**
     * 페이지 로드 시 발생 이벤트
     * 권한 템플릿 가져오기
     */
    async init () {
      this.authList = await this.getAuthority({ isTemplate: true })
      this.initSelectedTemplate = this.authList[0]

      if (this.grid) this.grid.scrollIntoView(0, 0)
    },

    /**
     * 권한 탬플릿 호출
     * @param {Array} params 권한 템플릿 리스트
     */
    async getAuthority (params) {
      try {
        this.authListLoading = true
        const response = await API.iam.getAuthority(params)
        return JSON.parse(JSON.stringify(response))
      } catch (error) {
        console.error('@@ getAuthority : ', error)
      } finally {
        this.authListLoading = false
      }
    },

    /**
     * 선택한 템플릿에 대한 권한 설정 목록을 가져옵니다.
     * @param {Object} template
     */
    async getAuthorityTemplate (template) {
      try {
        this.templateLoad = true
        const response = await API.iam.getAuthorityTemplate(template?.authorityIdx)
        const deSerializedTemplates = await this.deSerializeTemplate(response.apiAuthorities)
        return this.setTreeTemplates(deSerializedTemplates)
      } catch (error) {
        console.error('@@ getAuthorityTemplate : ', error)
      } finally {
        this.templateLoad = false
      }
    },

    /**
     * 직렬화된 템플릿을 트리화 시킵니다
     */
    deSerializeTemplate (templates) {
      // disabled 설정
      const disabledOnly = [
        [0, 1], // Create, isRead
        [2, 3, 4], // Create, isRead, Delete
        [5], // Create, Read, Update
        [14], // Update, Delete
        [17] // Create, Update, Delete
      ]

      // depth 설정
      const setDepth = [0, 1, 2, 2, 2, 2, 1, 2, 2, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0]

      templates.forEach((template, index) => {
        // 해당하는 것만 disabled 설정
        for (let i = 0; i < disabledOnly.length; i++) {
          const check = disabledOnly[i].indexOf(index)

          if (check >= 0) {
            if (i === 0) {
              template.isCreate = 'disabled'
              template.isRead = 'disabled'
            }
            if (i === 1) {
              template.isCreate = 'disabled'
              template.isRead = 'disabled'
              template.isDelete = 'disabled'
            }
            if (i === 2) {
              template.isCreate = 'disabled'
              template.isRead = 'disabled'
              template.isUpdate = 'disabled'
            }

            if (i === 3) {
              template.isUpdate = 'disabled'
              template.isDelete = 'disabled'
            }
            if (i === 4) {
              template.isCreate = 'disabled'
              template.isUpdate = 'disabled'
              template.isDelete = 'disabled'
            }
          }
        }

        Object.defineProperty(template, 'depth', {
          value: setDepth[index],
          writable: false
        })
      })

      // console.log(templates)

      return templates
    },

    /**
     * 데이터로 트리 만들기
     */
    setTreeTemplates (templates) {
      let depth1 = []
      let depth2 = []

      const result = []

      templates.reverse().forEach((template, idx) => {
        if (template.depth === 2) {
          depth2.push(template)
        }
        if (template.depth === 1) {
          if (depth2.length) template.children = depth2.reverse()
          depth2 = []
          depth1.push(template)
        }
        if (template.depth === 0) {
          if (depth1.length) template.children = depth1.reverse()
          depth1 = []
          result.push(template)
        }
      })

      return result.reverse()
    },

    // ===
    // ===
    // ===

    /**
     * [권한 등록] 이벤트
     * 좌측 api 목록에 기본 템플릿으로 등록합니다.
     */
    addAuth () {
      const row = {
        editing: true,
        authName: '',
        _grid: { edit: true }
      }
      if (this.authList.length) {
        const first = this.authList[0]
        if (first._grid?.edit && first.idx === undefined) return
      }

      this.authList.unshift(row)

      this.apiTemplates = this.defaultAuthTemplates(true)
      if (this.grid) this.grid.scrollIntoView(0, 0)
    },

    /**
     * [권한 등록 > 확인] 시 데이터를 저장합니다.
     * 저장하기 위핸 템플릿 형식을 가공합니다.
     */
    saveNewAuth (row) {
      // validation 처리
      const authorityName = this.authList[0].editing ? this.authList[0].authName : undefined
      const validator = this.saveValidation(authorityName)

      if (!validator) return

      // 탬플릿 신규 생성시 apiKey를 직접 넣어줘야함
      // const apiKeys = ['pro', 'pro-set', 'pro-na', 'pro-ow', 'pro-op', 'pro-del', 'pro-invite', 'pro-invite-invite', 'pro-invite-api', 'res', 'res-com', 'res-net', 'res-store', 'res-data', 'res-market', 'basket', 'order', 'billing'] // 주문함은 권한 상관 X
      const apiKeys = ['pro', 'pro-set', 'pro-na', 'pro-ow', 'pro-op', 'pro-del', 'pro-invite', 'pro-invite-invite', 'pro-invite-api', 'res', 'res-com', 'res-net', 'res-store', 'res-data', 'res-market', 'basket', 'billing']
      for (let i = 0; i < apiKeys.length; i++) {
        const key = apiKeys[i]
        this.apiAuthorities[i].apiKey = key
      }

      const newTemplate = {
        apiAuthorities: [...this.apiAuthorities],
        authorityName,
        isAdmin: true,
        isTemplate: true
      }

      this.$confirm(this.$t('common.CONFIRM.BASE.009')) // 생성하시겠습니까?
        .then(async () => {
          const response = await this.saveAuth(newTemplate)
          if (response) return this.init()
        }).catch(() => false)
    },

    /**
     * [권한 등록] 시 validation 처리
     */
    saveValidation (name) {
      const conditions = [
        { condition: !!name, message: this.$t('admin.TEMPLATE.ALERT.001') } // 탬플릿 이름을 입력해주세요
      ]

      return conditions.every(cond => {
        if (!cond.condition) this.$alert(cond.message)
        return cond.condition
      })
    },

    /**
     * [권한 등록] 시 API 권한 등록
     * @param { Object } authorities
     */
    async saveAuth (authorities) {
      // const message = row.idx === undefined
      //   ? this.$t('common.CONFIRM.BASE.009')// 생성하시겠습니까?
      //   : this.$t('common.CONFIRM.BASE.012')// 수정하시겠습니까?

      try {
        this.authListLoading = true
        this.templateLoad = true
        // console.log(JSON.stringify(authorities))

        const response = await API.iam.addAuthority({ authorities, isAdmin: true, userIdx: this.user.userIdx })
        return response
      } catch (error) {
        console.error('@@ saveAuth : ', error)
        const message = {
          IAM603: this.$t('admin.TEMPLATE.ALERT.002') // 동일한 이름의 권한이 존재합니다.
        }[error.response.data.code]
        // 등록 도중 문제가 발생하였습니다.
        this.$alert(message || this.$t('admin.TEMPLATE.ALERT.004'), '', { callback: () => false })
      } finally {
        this.authListLoading = false
        this.templateLoad = false
      }
    },

    /**
     * [권한 등록 > 취소]
     */
    cancelAuth () {
      this.$confirm(this.$t('common.CONFIRM.BASE.029'), '', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      })
        .then(() => {
          this.editingList = false
          this.authList.splice(0, 1)
        })
        .catch(() => false)
    },

    /**
     * [권한 삭제] 이벤트
     * @param { Object } row
     */
    deleteAuth (row) {
      this.$confirm(this.$t('common.CONFIRM.BASE.008')) // 삭제하시겠습니까?
        .then(async () => {
          try {
            const response = await API.iam.deleteAuthority(row.authorityIdx)
            if (response) return this.init()
          } catch (error) {
            console.error('@@ deleteAuth: ', error)
            // 삭제도중 문제가 발생하였습니다. 다시 시도해주세요
            this.$alert(this.$t('admin.TEMPLATE.ALERT.003'), { callback: () => false })
          }
        }).catch(() => false)
    },

    /**
     * [권한 수정]
     * 좌측 노출(Y)/미노출(N) 설정
     * @param { Object } row
     */
    async editTemplate (row) {
      const templateData = await this.getAuthorityTemplate(row)
      const apiAuthorities = this.serializeTreeData(templateData)

      // console.log(authorities)
      // console.log(row)
      try {
        this.authListLoading = true
        this.templateLoad = true

        const payload = {
          apiAuthorities,
          isAdmin: true,
          isUse: !row.isUse,
          authorityIdx: row.authorityIdx,
          userIdx: this.user.userIdx
        }

        // console.log(JSON.stringify(payload))
        const response = await API.iam.updateAuthority({ idx: row.authorityIdx, payload })
        if (response) {
          this.init()
        }
      } catch (error) {
        console.error('@@ editTemplate', error)
        this.$alert(error.response.data.message, '', { callback: () => false })
      } finally {
        this.authListLoading = false
        this.templateLoad = false
      }
    },

    /**
     * [권한 복사] 이벤트
     * 권한을 개발 복사합니다.
     */
    async copyAuth ({ authorityIdx }) {
      try {
        const payload = {
          authorityIdx,
          userIdx: this.user.userIdx
        }
        const response = await API.iam.copyAuthority(payload)
        if (response) this.init()
      } catch (error) {
        console.error('@@ copyAuth', error)
        this.$alert(error.response.data.message, '', { callback: () => false })
      }
    },

    // ============================================
    // ================== [공통] ===================
    // ============================================

    /**
     * 좌측 탬플릿 선택시 발생 이벤트
     * Template 상세 확인
     */
    selectedRow (row) {
      if (!this.editingList) {
        this.selectedTemplate = row
        this.templateLoad = true

        // 임시 🟡
        // this.apiTemplates = this.defaultAuthTemplates(!!row.index)
        this.templateLoad = false
      }
    },
    /**
     * 우측 탬플릿 체크 변경시 실시간 저장
     */
    changeTemplate (serializedTemplates) {
      this.apiAuthorities = [...serializedTemplates]
    },

    /**
     * 기본적으로 그리드 설정
     */
    setGrid (grid) {
      this.grid = grid

      // authList 가 1개 이상 등록되어있는 경우
      if (this.authList[0].authorityIdx) {
        this.authList = this.authList.map(item => {
          const gridAtt = Object.assign({ edit: false }, {})
          return { ...item, _grid: gridAtt }
        })
      }
    },
    gridRefresh (grid = this.grid) {
      if (!grid) return
      const cv = grid.collectionView
      if (!cv) return
      cv.refresh()
    }
  },
  data () {
    return {
      authListLoading: false,
      columns: [{ binding: 'authName', header: '권한', customHtml: true, align: 'left', keyPath: 'admin.ACCOUNT.perm' }],
      authList: [], // 좌측 권한명 리스트
      editingList: false, // 권한 템플릿 등록중인지 여부 확인
      initSelectedTemplate: null,
      selectedTemplate: null,
      templateLoad: false,
      apiTemplates: [],
      apiAuthorities: [],
      defaultAuthTemplates (ststus) {
        return [
          {
            apiName: '프로젝트 관리',
            isCreate: 'disabled',
            isRead: 'disabled',
            isUpdate: false,
            isDelete: false,
            indeterminate: false,
            count: 0,
            children: [
              {
                apiName: '프로젝트 설정',
                isCreate: 'disabled',
                isRead: 'disabled',
                isUpdate: false,
                isDelete: false,
                indeterminate: false,
                count: 0,
                children: [
                  { apiName: '프로젝트 명', isCreate: 'disabled', isRead: 'disabled', isUpdate: false, isDelete: 'disabled' },
                  { apiName: '프로젝트 소유자', isCreate: 'disabled', isRead: 'disabled', isUpdate: false, isDelete: 'disabled' },
                  { apiName: '운영담당자', isCreate: 'disabled', isRead: 'disabled', isUpdate: false, isDelete: 'disabled' },
                  { apiName: '프로젝트 삭제', isCreate: 'disabled', isRead: 'disabled', isUpdate: 'disabled', isDelete: false }
                ]
              },
              {
                apiName: '프로젝트 초대',
                isCreate: false,
                isRead: false,
                isUpdate: false,
                isDelete: false,
                indeterminate: false,
                children: [
                  { apiName: '프로젝트 초대', isCreate: false, isRead: false, isUpdate: false, isDelete: false, optionType: true },
                  { apiName: 'API 권한 템플릿', isCreate: false, isRead: false, isUpdate: false, isDelete: false }
                ]
              }
            ]
          },
          {
            apiName: '자원 관리',
            isCreate: false,
            isRead: false,
            isUpdate: false,
            isDelete: false,
            children: [
              { apiName: 'Compute', isCreate: false, isRead: false, isUpdate: false, isDelete: false },
              { apiName: 'Network', isCreate: false, isRead: false, isUpdate: false, isDelete: false },
              { apiName: 'Storage', isCreate: false, isRead: false, isUpdate: false, isDelete: false },
              { apiName: 'Database', isCreate: false, isRead: false, isUpdate: false, isDelete: false },
              { apiName: '마켓플레이스', isCreate: false, isRead: false, isUpdate: 'disabled', isDelete: 'disabled' }
            ]
          },
          {
            apiName: '장바구니',
            isCreate: false,
            isRead: false,
            isUpdate: false,
            isDelete: false,
            optionType: true
          },
          // {
          //   apiName: '주문함', (권한 상관 X)
          //   isCreate: false,
          //   isRead: false,
          //   isUpdate: false,
          //   isDelete: false,
          //   optionType: true
          // },
          {
            apiName: '빌링',
            isCreate: 'disabled',
            isRead: false,
            isUpdate: 'disabled',
            isDelete: 'disabled'
          }
        ]
      },
      /**
     * 트리 형식의 데이터를 직렬화하여 emit 합니다
     * 나중에 리팩토링~! 🤓
     */
      serializeTreeData (authTreeData) {
        const result = []
        const factorial = (data) => {
          return data.forEach(item => {
            const temp = { ...item }
            for (const key in temp) {
              if (item[key] === 'disabled' || item[key] === 'indeterminate') temp[key] = undefined
            }
            delete temp.children
            delete temp.parentNode
            result.push(temp)

            if (item.children) return factorial(item.children)
          })
        }

        const treeCopy = cloneDeep(authTreeData)
        factorial(treeCopy)

        return result
      }
    }
  }
}
</script>

<style lang="scss">
  .api-auth-template {
    .cmp-grid-tree {
      .wj-header.wj-cell:first-child { text-align: center; }
    }

    display: flex;
    align-items: center;
    gap: 20px;
    width: 100%;
    .select-auth-wrapper {
      position: relative;
      width: 100%;
      border: 1px solid $purple-gray;
      &:first-child {
        flex: 1 1 590px;
        min-width: 590px;
        margin-bottom: 62px;
        height: 610px;
        background-color: $dark-gray;
        .-select-auth-btns {
          position: absolute;
          top: calc(100% + 20px);
          left: 0;
          right: 0;
          display: flex;
          justify-content: flex-end;
        }
      }

      &:last-child {
        height: 670px;
      }

      .-delete-icon {
        &:hover {
          background: url('../../../assets/images/icon-trashcan@3x.png') no-repeat;
          background-size: contain;
        }
      }

    }
    .flex-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 $gap-m;
      width: 100%;
    }

    .auth-grid {
      .wj-cells .wj-cell {
        padding: 0;
        .auth-name-fix-input.el-input {
          padding: 0 $gap-m;
          > .el-input__inner {
            padding: 0 $gap;
            text-align: left;
            height: 40px;
          }
          .el-input__count { // 글자수
            margin-right: $gap-m;
          }
        }
      }
    }

    .button-wrapper {
      .alert-left {
        position: absolute;
        left: $gap-m;
        bottom: 0;
        height: 70px;
        color: $input-placeholder;
        font-size: 12px;
        display: flex;
        align-items: center;
      }
      .button-area {
        position: absolute;
        bottom: $gap; right: $gap-m;
      }
    }
  }
</style>

<style lang="scss" scoped>
.auth-ticket {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $gap $gap-m;
  .-left {
    flex: 1 1 auto;
    display: flex;
    align-items: center;

    .-status {
      border: 2px solid $input-placeholder;
      color: $input-placeholder;
      border-radius: 25px;
      line-height: 18px;
      height: 20px;
      font-size: 12px;
      padding: 0 $gap-s;
      display: block;
      width: 32px;
      transition: 0.3s ease color, 0.3s ease border-color;

      &:hover {
        border-color: $primary;
        color: $primary;
      }

      &.-y {
        border-color: $primary;
        color: $primary;

        &:hover {
          border-color: $input-placeholder;
          color: $input-placeholder;
        }
      }
    }

    .-info {
      margin-left: $gap;
      display: flex;
      flex-direction: column;
      > span { font-size: 14px; }
      > small {
        display: block;
        margin-top: $gap-s;
        font-size: 13px;
        color: $input-placeholder;

        span {
          padding-right: 5px;
          margin-right: 5px;
          &:first-child {
            position: relative;
            &::after {
              content: '';
              position: absolute;
              top: 4px; right: 0;
              width: 1px; height: 6px;
              background-color: $input-placeholder;
            }
          }
        }
      }
    }
  }
  .-right {
    flex: 0 0 45px;
    justify-content: space-between;
    display: flex;
  }
}
</style>
