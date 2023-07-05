<template>
  <div
    v-loading="loading"
    class="document-template-detail"
  >
    <article class="document-template-setting">
      <register-contents
        :title="$v('보고서명')"
        required
      >
        <el-input
          v-model="values.name"
          :placeholder="$v('보고서명을 입력하세요.')"
        />
      </register-contents>
    </article>

    <section class="template-editor-wrapper">
      <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
      <editor
        ref="editor"
        api-key="no-api-key"
        :init="option"
        output-format="html"
        :disabled="false"
        @change="change"
        @on-render="setup"
      />

      <!-- @onSelectionChange="change" -->
      <!-- model-events="change" -->
      <!-- {{ values.text }} -->
      <!-- /. 템플릿 작성 -->

      <div class="template-editor-content">
        <h2>{{ $v('시스템 템플릿') }}</h2>
        <ul class="template-buttons tiny-scroll">
          <li
            v-for="template in systemTemplates"
            :key="template.function"
            @click="callTemplate(template)"
          >
            <strong>{{ template.label }}</strong>
          </li>
        </ul>
      </div>
      <!-- /. 시스템 템플릿 -->
    </section>

    <div class="button-area">
      <button
        class="button"
        type="is-anti"
        size="is-large"
        @click="$router.go(-1)"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button"
        type="is-primary"
        size="is-large"
        @click="save"
      >
        {{ $v('저장') }}
      </button>
    </div>
  </div>
</template>

<script>
import SystemTemplateScript from '../SystemTemplate.script'
import API, { TinyEditor } from '@sd-fe/cmp-core'
// import Editor from '@tinymce/tinymce-vue'
import { JSONPath } from 'jsonpath-plus'

export default {
  name: 'DocumentWorkDetail',
  mixins: [SystemTemplateScript],
  props: {
    data: {
      type: Object,
      default: () => null
    }
  },
  components: {
    editor: TinyEditor
  },
  async mounted () {
    /*
     query {
        workState: REVIEW|TODO
        roleIdx: {Number}
        cloudType: {String} PUBLIC, PRIVATE
        templateIdx: {Number} 저장된 templateIdx
        isNew: {Boolean} [보고서 작성] 일 경우 true
      }
    */
    const query = this.$route?.query

    this.type = this.setType(query)

    await this.getDetailData()
    await this.getReadOnlyResource()
    await this.getSavedDocument()
    await this.getDocTemplateDetail(query)
  },
  watch: {
    data (data) {
      if (!data) return

      this.value = JSON.parse(JSON.stringify(data))
    },
    values: {
      deep: true,
      handler (value) {
      }
    }
  },
  methods: {
    /*
      ## 해당 컴포넌트가 사용되는 곳! (필독 🟩)
       - [업무 > 사전협의 | 할일 > 보고서 등록/수정]

        작업계획서 :: 사전협의 → 보고서 수정 → 보고서 설정 페이지로 이동
        작업완료보고서 :: 할일 → 보고서 수정 → 보고서 작업신청 페이지로 이동

        신규 A.
          페이지 내에서 등록된 양식이 없고 새로 추가되는 경우
          1) [보고서 추가] > [새 보고서 문서] ::: (isNew === true && templateIdx < 0)
          2) [보고서 추가] > [양식 불러오기] ::: (isNew === undefined && templateIdx > 0)
        수정 B.
          페이지 내에서 이미 관리자가 작성해둔 보고서가 있는 경우
          3). [보고서 수정] > [최근 작성된 보고서명] ::: (isNew === false)
        수정 C.
          페이지 내에서 작성해둔 보고서가 있으나 다른 양식을 추가해서 새로 작성하는 경우 ::: (isNew === undefined && templateIdx > 0)
    */

    // ============================================
    // ============================================
    // ============ [모든 페이지 공통 사용] ============
    // ============================================
    // ============================================

    // breadcrubs 설정 🟨
    setBreadCrumbs () {
      this.$store.commit('common/ADD_PARAMETERS', {
        label: '-',
        path: ''
      })
    },

    /**
     * 타입 확인용
     * @param {Object} query
     * @return {String} new | saved | template
     */
    setType ({ isNew, templateIdx }) {
      const boolean = Boolean(isNew)
      if (boolean === true) return 'new'
      else if (boolean === false) return 'saved'
      else if (boolean === undefined && templateIdx > -1) return 'template'
    },

    /**
     * [저장] 버튼 클릭시 발생하는 이벤트
     */
    async save () {
      // 필수값 확인
      // this.editor.insertContent
      const conditions = [
        { condition: this.values.name, message: this.$v('보고서명을 입력해주세요.') },
        { condition: !!this.editor.getContent(), message: this.$v('보고서 내용을 입력해주세요.') }
      ]

      const validator = conditions.every(({ condition, message }) => {
        if (!condition) this.$alert(message)
        return condition
      })

      if (!validator) return

      const step = this.$route?.params?.step
      const orderType = this.$route?.query?.orderType

      const isUrgent = orderType === 'URGENT'

      // 저장 역할 분할
      const action = isUrgent
        ? { // [사전협의 긴급] 사후완료보고서
          new: 'createAADocument', // [통합업무 > 사전협의 사후완료보고서 생성]
          saved: 'updateAADocument', // [통합업무 > 사전협의 사후완료보고서 수정]
          template: 'updateAADocument'
        }[this.type]
        : {
          conference: { // [사전협의] 작업계획서
            new: 'createReviewDocument', // [통합업무 > 사전협의 작업계획서 생성]
            saved: 'updateReviewDocument', // [통합업무 > 사전협의 작업계획서 수정]
            template: 'updateReviewDocument'
          },
          todo: { // [할일] 완료보고서
            new: 'createTodoDocument', // [통합업무 > 할일 완료보고서 생성]
            saved: 'updateTodoDocument', // [통합업무 > 할일 완료보고서 수정]
            template: 'updateTodoDocument'
          }
        }[step][this.type]

      // payload 세팅
      const payload = this.setPayload()

      // 저장 실행
      return this.$confirm(this.$v('해당 내용으로 결재 보고서를 저장하시겠습니까?'))
        .then(() => this.saveAction(action, payload))
        .catch(() => false)
    },

    /**
     * 저장 payload 세팅
     */
    setPayload () {
      const roleIdx = this.$route?.query?.roleIdx
      const orderNo = this.$route?.params?.orderNo
      const workId = `${orderNo}-${roleIdx}`

      const payload = {
        // jsonData: this.values.text,
        jsonData: this.editor.getContent(),
        title: this.values.name
      }

      return { workId, payload }
    },

    /**
     * 보고서 생성/수정 저장 실행
     * @param {String} actionType
     * @param {Object} payload {workId, payload} 저장
     * @return alert
     */
    async saveAction (actionType, payload) {
      try {
        await API.work_v3[actionType](payload)
        return this.$alert(this.$v('보고서 저장이 완료되었습니다.'), { callback: () => this.$router.go(-1) })
      } catch (error) {
        this.$alert(this.$v('보고서를 저장하는동안 문제가 발생하였습니다.'), { callback: () => false })
        console.error(`@@ DocumentWorkDetail > saveAction > ${actionType}`, error)
      }
    },

    // ================================================================
    // ================================================================
    // ============== [업무 > 사전협의 / 할일 > 보고서 등록/수정] ==============
    // ================================================================
    // ================================================================

    /**
     * [결재정보 / 주문정보] 를 저장해와야함
     */
    async getDetailData () {
      try {
        const workStep = this.$route?.query?.workState
        const orderNo = this.$route?.params?.orderNo

        const apiName = {
          REVIEW: 'getWorkReviewDetail', // [사전협의] => 결재1
          APPROVAL1_REJECTED: 'getWorkReviewDetail', // [사전협의] => 결재1 => 반려 => 결재1
          TODO: 'getWorkTodoDetail', // [할일] => 결재2
          TODO_FINISHED: 'getWorkTodoDetail', // [할일] => 작업 완료 => 결재2
          APPROVAL2_REJECTED: 'getWorkTodoDetail' // [할일] => 결재2 => 반려 => 결재2
        }[workStep]

        const response = await API.work_v3[apiName](orderNo)

        console.log(response, ` ---- 🍑 ${this.type} Detail >> DATA`)
        if (!response) return

        // 🟦
        const { ordererCompany, ordererGroup, projectName, orderType, orderReqNote, createTime, orderer, expectDate } = response
        const orderTypeLabel = { NEW: this.$v('신규'), CHANGE: this.$v('변경'), DELETE: this.$v('삭제'), URGENT: this.$v('긴급') }[orderType]

        // 주문정보
        this.orders = {
          orderNo,
          companyName: ordererCompany.name, // 관계사
          groupName: ordererGroup.name, // 조직명
          projectName, // 프로젝트명
          orderType, // 구분
          orderTypeLabel, // 구분 (한국어)
          name: orderReqNote, // 주문요청제목
          createTime, // 주문일
          userName: orderer.name, // 주문자
          finishTime: expectDate // 완료희망일
        }
      } catch (error) {
        console.error('@ DocumentWorkDetail > getDetailData', error)
      }
    },
    /**
     * 보고서 설정 OFF 일때 호출
     * [사전협의|할일 > 자원 상세]
     */
    async getReadOnlyResource () {
      try {
        const roleIdx = this.$route?.query?.roleIdx
        const workState = this.$route?.query?.workState
        const orderNo = this.$route?.params?.orderNo
        const workId = `${orderNo}-${roleIdx}`

        const workStep = {
          APPROVAL1_REJECTED: 'REVIEW', // 결재 1 ([사전협의] 호출)
          APPROVAL2_REJECTED: 'TODO', // 결재2 ([할일] 호출)
          TODO_FINISHED: 'TODO' // [할일] 완료 ([할일] 호출)
        }[workState] || workState

        // 데이터 상세 가져오기
        const { workItemRsps: source } = await API.work_v3.getReadOnlyResource({ workId, workStep })

        const services = {} // COMPUTE / NEWTORK / STORAGE / DATABASE ... 분류

        for (let i = 0; i < source.length; i++) {
          const { workItemSpec, workItemConfig } = source[i]
          let { service } = source[i]

          // workItemSpec   자원 스펙 데이터 :: originJson (원본 데이터 - 절대 변하지 않음), actualJson (작업대상데이터(변경된 or 변경가능한 데이터))
          // workItemConfig 자원 할당 데이터 :: configJson (자원 할당 변경된 or 변경 가능한 데이터)
          const { actualJson } = workItemSpec
          const { configJson } = workItemConfig ?? { configJson: null }
          // console.log(source[i])

          const data = {
            ...JSON.parse(actualJson),
            configJson: { ...JSON.parse(configJson) }
          }

          // 특정 자원은 내부에서 데이터를 분리해주어야함 ㅎㅠ 예외파티~
          service = this.serviceDistributor(service, data)

          // 자원 foldable 용으로 분류
          if (services[service] === undefined) services[service] = [data]
          else services[service].push(data)
        }

        // 할당정보 저장
        this.services = services
      } catch (error) {
        console.error('@@ DocumentWorkDetail > getReadOnlyResource', error)
      }
    },

    /**
     * 같은 서비스 자원인데, 내부에서 분리가 필요한 경우
     * @param {String} service
     * @param {Object} data
     */
    serviceDistributor (service, data) {
      const key = {
        FILE_SERVER: data.protocolType,
        TRANSIT_GATEWAY: data.attachmentType,
        COMPUTE_BY_TEMPLATE: 'COMPUTE',
        VM_BY_TEMPLATE: 'VM'
      }[service]

      // 굳이 분리해줄 필요 없는 경우는 그냥 그대로 사용
      if (!key) return service

      return {
        FILE_SERVER: { // File Server 는 데이터 안에 protocol로 분리
          NFS: 'FILE_SERVER_NFS',
          SMB: 'FILE_SERVER_SMB'
        },
        TRANSIT_GATEWAY: {
          VPC: 'TRANSIT_GATEWAY_VPC',
          VPN: 'TRANSIT_GATEWAY_VPN',
          Peering: 'TRANSIT_GATEWAY_PEERING'
        },
        COMPUTE_BY_TEMPLATE: { COMPUTE: 'COMPUTE' },
        VM_BY_TEMPLATE: { VM: 'VM' }
      }[service][key]
    },

    /**
     * 신규 A-2) [사전협의 / 할일] > [보고서 추가] > [양식 불러오기]
     *
     * 등록되어있는 보고서 템플릿을 선택 한 경우
     * 초기에 templateIdx 를 확인하여 템플릿 상세 정보를 가져와 수정할 수 있습니다.
     *
     * 보고서를 완전히 신규로 작성하는 경우, 또는 기존에 등록된 보고서를 수정하는 경우라면,
     * templateIdx 가 -1 이므로, (없으므로) 동작하지 않습니다.
     * @param {Object|undefined} templateIdx 보고서 템플릿 index
     */
    async getDocTemplateDetail ({ templateIdx }) {
      if (templateIdx < 0) return

      try {
        this.editor.setContent('')
        this.loading = true

        const { title, templateJson } = await API.work_v3.getDocTemplateDetail(templateIdx)
        // console.log('#titme', title)
        // console.log('#templateJson', templateJson)

        // ✔ 에러가 여기서 표기 된다면 "dataBinding" 함수 때문일 수 있음
        this.editor.insertContent(this.dataBinding(templateJson))
        this.values = { name: title }
      } catch (error) {
        console.error('@@ getDocTemplateDetail', error)
        this.$alert(this.$v('상세 정보를 가져오는데 문제가 발생하였습니다.'))
      } finally {
        this.loading = false
      }
    },

    /**
     * 수정 B-3) [사전협의 / 할일] > [최근 작성된 보고서명]
     *
     * 기존에 등록된 보고서를 수정하는 경우 동작함
     */
    async getSavedDocument () {
      try {
        if (this.type === 'new') return // 보고서를 완전히 신규로 작성하는 경우 동작하지 않음

        const roleIdx = this.$route?.query?.roleIdx
        const orderNo = this.$route?.params?.orderNo
        const step = this.$route?.params?.step
        const workId = `${orderNo}-${roleIdx}`

        const orderType = this.$route?.query?.orderType
        const isUrgent = orderType === 'URGENT'

        const apiName = isUrgent
        // [사전협의 긴급] 페이지에서 저장된 [사후완료보고서] 조회
          ? 'getAADocument'
          : {
            conference: 'getReviewDocument', // [사전협의] 페이지에서의 저장된 [작업계획서] 조회
            todo: 'getTodoDocument' // [할일] 페이지에서의 저장된 [작업완료보고서] 조회
          }[step]

        const { title, jsonData } = await API.work_v3[apiName]({ workId })
        this.values = { name: title }
        this.editor.insertContent(jsonData)
      } catch (error) {
        console.error('@@ DocumentWorkDetail > getSavedDocument', error)
      }
    },

    // =========================================
    // =========================================
    // ============ tinyMCE 관련 설정 ============
    // =========================================
    // =========================================

    /**
     * 제일 초기 화면 로드시, tinyMCE 로드 및 기본 데이터 세팅
     */
    setup (editor) {
      this.loading = true
      this.editor = editor

      const templateIdx = this.$route?.query.id
      if (templateIdx) return

      // const content = this.defaultTemplate()

      setTimeout(() => {
        // if (this.editor) this.insertContent(content)
        this.loading = false
      }, 1000)
    },

    /**
     * tinyMCE Text Change Event
     * @param {String} text HTML 형식으로 저장
     */
    change (text) {
      // console.log('#change')
      // console.log(text)
      // console.log(this.values.text)
      // activeEditor.selection.getNode().nodeName
    },

    /**
     * editor 에 컨텐츠를 삽입합니다.
     * @param {String} content
     */
    insertContent (content) {
      return this.editor.insertContent(content)
    },

    // callback (cb, value, meta) {
    callback (cb) {
      const input = document.createElement('input')
      input.setAttribute('type', 'file')
      input.setAttribute('accept', 'image/*')

      input.addEventListener('change', (e) => {
        const file = e.target.files[0]

        const reader = new FileReader()
        reader.addEventListener('load', () => {
          /*
            Note: Now we need to register the blob in TinyMCEs image blob
            registry. In the next release this part hopefully won't be
            necessary, as we are looking to handle it internally.
          */
          const id = 'blobid' + (new Date()).getTime()
          const blobCache = this.editor.editorUpload.blobCache
          const base64 = reader.result.split(',')[1]
          const blobInfo = blobCache.create(id, file, base64)
          blobCache.add(blobInfo)

          /* call the callback and populate the Title field with the file name */
          cb(blobInfo.blobUri(), { title: file.name })
        })
        reader.readAsDataURL(file)
      })

      input.click()
    },

    /**
     * 데이터 바인딩 시작
     * @param {String} rawText
     */
    dataBinding (rawText) {
      let text = rawText

      const setChange = target => {
        const [info, service, tableType] = target.match(/<tbody data-body="(.*?)">/gs)[0].replace(/<tbody data-body="|">/gs, '').split('-')
        // console.log(info, service, tableType)

        return this.setFormat({ info, colName: service, tableType }, false)
      }

      // 1) TGW 먼저 탐색해서 데이터 배치 한후
      // 테이블의 범위 (TGW 전용 테이블)
      const tableRangeTGW = rawText.match(/<div data-body="TGW-ONLY">(.*?)<\/div>/gs)

      if (tableRangeTGW) {
        for (const tables of tableRangeTGW) {
          const changes = setChange(tables)
          const replaces = text.replace(tables, changes)
          text = replaces
        }
      }

      // 2) 일반 Table 에 데이터 바인딩 시작
      // 테이블의 범위 (일반 테이블)
      const tableRange = text.match(/<tbody data-body="(.*?)<\/tbody>/gs)
      // console.log(`%c@@ 일반 Table 몇개야? :: ${tableRange.length}개\n@@ TGW Table 몇개야? :: ${tableRangeTGW.length}개`, 'color: orange; font-size: 20px')

      for (const tbody of tableRange) {
        const changes = setChange(tbody)
        const replaces = text.replace(tbody, changes)
        text = replaces

        // console.log('%c @@ REPLACED ::: ', 'color: pink', changes)
      }

      // console.log('%c @@ RESULT ::: ', 'color: pink', text)
      return text
    },

    /**
     * @param { Object } info [info: 자원 정보/할당, service: 서비스 종류]
     */
    getKeys ({ info, service, columns, tableType }) {
      // console.log(type, service)

      const sources = { // 데이터 연결 (자원의 개수 만큼 Array 형식으로 만들어주기)
        orderInfo: [this.orders], // 주문 정보
        approvalInfo: [this.orders], // 결재 정보
        srcInfo: this.services[service], // 자원 정보
        srcInfoTGW: this.services[service], // 자원 정보 (TGW)
        assignInfo: this.services[service] // 할당 정보
      }[info]

      let keys = columns.column

      // TGW 라면 테이블이 여러개라 ... 모든 키값 저장
      if (info === 'srcInfoTGW') {
        keys = []
        for (const key in columns) {
          if (key === 'title') continue
          keys = [...keys, ...columns[key]]
        }
      }

      console.log('%c INFO ::', 'color: yellow')
      console.log('- info : ', info, '\n- service : ', service, '\n- tableType : ', tableType, '\n- sources : ', sources, '\n- keys', keys)

      if (!keys || !sources) return // [자원 정보 / 자원 할당] 인데 정보가 없다면 패스

      const result = []
      for (const source of sources) {
        const data = {}

        // 데이터를 깊게 탐색해서 키값을 가져옴
        for (const { key, path } of keys) {
          const value = path ? JSONPath({ path, json: source }) : [] // 없으면 임시 값
          data[key] = value[0]
        }

        result.push(data)
      }

      console.log('key-value 바인딩', result)
      return result
    }
  },
  data: root => ({
    loading: false,
    type: undefined,
    values: {},
    orders: {},
    services: {},
    text: undefined,
    editor: null

  })
}
</script>

<style lang="scss" scoped>
.document-template-detail {
  .document-template-setting {
    margin-bottom: $gap;
    border-top: 1px solid $dark-slate;
  }

  .template-editor {
    &-wrapper {
      display: grid;
      grid-template-columns: auto 300px;
      grid-template-rows: 555px;
      column-gap: 15px;
      box-sizing: border-box;
    }

    &-content {
      box-sizing: border-box;
      height: 555px;
      background-color: $dark-navy;
      border-radius: $radius-m;
      padding: $gap $gap-s $gap $gap;

      h2 {
        font-size: 18px;
        padding-bottom: $gap;
        margin-right: 15px;
        border-bottom: 1px solid $dark-slate;
      }
    }

  }
  .template-buttons {
    height: 475px;
    box-sizing: border-box;
    overflow-y: auto;
    border-bottom: 1px solid $dark-slate;

    > li {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      background-color: transparent;
      border: 1px solid transparent;
      border-bottom: 1px solid $dark-slate;
      color: $white;
      height: 80px;
      box-sizing: border-box;
      cursor: pointer;
      padding: $gap;
      transition: .2s ease all;

      &:hover {
        background: rgba(63, 85, 187, 0.3);
        border: 2px solid #3F55BB;
        border-radius: 5px;
      }

      &:last-child {
        border: none;
        &:hover { border: 2px solid #3F55BB; }
      }

      strong {
        font-weight: normal;
        font-size: 14px;
        line-height: 22px;
        margin-bottom: 5px;
      }
      span { color: $input-placeholder }
    }
  }

  .button-area {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: $gap-m;
  }
}
</style>
