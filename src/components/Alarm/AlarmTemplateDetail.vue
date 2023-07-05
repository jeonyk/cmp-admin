<template>
  <div
    v-loading="isLoadingTrigger || isLoadingCreateOrUpdate"
    class="alarm"
  >
    <h3>
      {{ isEdit ? "템플릿 수정" : "새 템플릿 추가" }}
    </h3>
    <vertical-table
      :data="{}"
      :columns="templateFormContents"
      :key="updateKey"
    >
      <template #name>
        <el-input
          v-model="inputData.templateName"
          :placeholder="$v('템플릿명을 입력해주세요.')"
          :style="{ width: defaultSearchableWidth }"
        />
      </template>

      <template #system>
        <searchable-select
          v-model="selectData.system"
          :options="systemOptions"
          :width="defaultSearchableWidth"
          placeholder="발송 시스템 선택"
          confirm-before-change
          disabled-change-text
          @before-change="(done, newValue, oldValue) => onBeforeChangeSystemOrTrigger(done, newValue, oldValue, 'system')"
        />
      </template>

      <template #trigger>
        <searchable-select
          v-model="selectData.trigger"
          unique-key="id"
          :options="triggers"
          :width="defaultSearchableWidth"
          placeholder="트리거 선택"
          disabled-change-text
          confirm-before-change
          @before-change="(done, newValue, oldValue) => onBeforeChangeSystemOrTrigger(done, newValue, oldValue, 'trigger')"
        />
      </template>

      <template #type>
        <!-- <searchable-select
          v-model="selectData.type"
          :options="testTypeOptions"
          :width="defaultSearchableWidth"
          placeholder="유형 선택"
          disabled-change-text
        /> -->
        <el-input
          v-model="selectData.typeStr"
          disabled
          placeholder="트리거를 선택하세요."
          :style="{ width: '200px' }"
        />
      </template>

      <template #defaultReceiver>
        <el-input
          v-model="inputData.defaultReceiver"
          disabled
          placeholder="트리거를 선택하세요."
          :style="{ width: defaultInputWidth }"
        />
      </template>

      <template #receivers>
        <div class="receiver-wrap">
          <button
            class="button"
            :disabled="activeTrigger && activeTrigger.contentValue === 'COMMON_OTP'"
            type="is-primary"
            @click="onClickSelectReceiver"
          >
            {{ $v('수신자 추가') }}
          </button>
          <div class="receivers">
            <clearable-tag
              v-for="group in groupReceivers"
              :key="
                group.hasParent
                  ? group.parentUq + group.uqRef + group.roleIdx
                  : group.uq
              "
              :content="getReceiverLabel(group)"
              :content-raw="group"
              :unique-key="
                group.hasParent
                  ? `${group.parentUq}-${group.uqRef}-${group.roleIdx}`
                  : group.uq
              "
              @clear-raw="onToggleClearGroup"
            />
            <!-- 그룹 수신자 -->
            <clearable-tag
              v-for="user in userReceivers"
              :key="`user-${user.receiverType}-${user.idx}`"
              :content="getUserClearableTagName(user)"
              :content-raw="user"
              :unique-key="user.idx"
              split-string=">"
              @clear-raw="(key, raw) => onToggleClearUser('user', key, raw)"
            />
            <!-- 유저 수신자 (사용자) -->
            <clearable-tag
              v-for="admin in adminReceivers"
              :key="`admin-${admin.receiverType}-${admin.idx}`"
              :content="getUserClearableTagName(admin)"
              :content-raw="admin"
              :unique-key="admin.idx"
              split-string=">"
              @clear-raw="(key, raw) => onToggleClearUser('admin', key, raw)"
            />
            <!-- 유저 수신자 (관리자) -->
          </div>
        </div>
      </template>

      <template #batchCycle>
        <!-- <el-input :style="{ width: defaultInputWidth }" /> -->
        <div class="receiver-wrap">
          <button
            class="button"
            type="is-primary"
            @click="onClickAddBatchCycleModal"
          >
            배치 주기 추가
          </button>
          <div class="receivers">
            <clearable-tag
              v-if="batchLabel"
              :content="batchLabel"
              unique-key="1"
              @clear="onToggleClearBatchCycle"
            />
          </div>
        </div>
      </template>

      <template #title>
        <el-input
          v-model="inputData.emailTitle"
          :placeholder="$v('제목을 입력해주세요.')"
        />
      </template>

      <template #templateCode>
        <el-input
          v-model="inputData.templateCode"
          :style="{ maxWidth: defaultSearchableWidth }"
        />
      </template>

      <template #countryCode>
        <el-select
          v-model="selectData.countryCode"
          :style="{ maxWidth: defaultSearchableWidth }"
        >
          <el-option
            v-for="country in countryCodeOptions"
            :key="country.countryName"
            :label="country.countryName"
            :value="country.countryCode"
          />
        </el-select>
      </template>
      <!-- 국가 코드 -->

      <template #editor>
        <tiny-editor
          is-render-toolbar
          :paste-remove-image="selectData.system !== 'MAIL'"
          :is-simple-toolbar="isSimpleToolbar"
          :custom-content-style="customContentStyle"
          @on-render="onRenderEditor"
          @paste-preprocess="onPastePreProcess"
          @input="onInputTinyEditor"
        />
        <div class="kvs">
          <div
            class="kvs-title"
            :class="{
              pt:
                activeTrigger &&
                activeTrigger.macroList &&
                activeTrigger.macroList.length
            }"
          >
            Key 입력
          </div>
          <div
            v-if="
              activeTrigger &&
                activeTrigger.macroList &&
                activeTrigger.macroList.length
            "
            class="kvs-flex-wrap"
          >
            <div
              v-for="kv in activeTrigger.macroList"
              :key="kv.jsonKey"
              class="kv-item"
              @click="() => onClickKeyValueItem(kv)"
            >
              {{ kv.keyword }}
            </div>
          </div>
          <div
            v-else-if="activeTrigger && !activeTrigger.macroList.length"
            class="kvs-empty kvs-flex-wrap"
          >
            {{ $v("등록된 키가 없습니다.") }}
          </div>
          <div
            v-else
            class="kvs-empty kvs-flex-wrap"
          >
            {{ $v("트리거를 선택해주세요.") }}
          </div>
        </div>
      </template>
    </vertical-table>
    <div class="button-area">
      <button
        class="button"
        type="is-anti"
        size="is-large"
        @click="onClickCancel"
      >
        취소
      </button>
      <button
        v-if="selectData.system === 'MAIL'"
        :disabled="!editorContent"
        class="button"
        type="is-primary"
        size="is-large"
        @click="onClickPreviewEmailTemplate"
      >
        미리보기
      </button>
      <button
        v-if="selectData.system !== 'web-push'"
        class="button"
        type="is-primary"
        size="is-large"
        @click="onClickSendToTestReceiver"
      >
        테스트 발송
      </button>
      <button
        v-if="!isEdit"
        class="button"
        type="is-primary"
        size="is-large"
        @click="onCreateAlarmTemplate"
      >
        생성
      </button>
      <button
        v-else
        class="button"
        type="is-primary"
        size="is-large"
        @click="onUpdateAlarmTemplate"
      >
        수정
      </button>
    </div>
    <select-receiver
      v-loading="isLoadingTestSend"
      :active="isActiveSelectReceiver"
      :is-test="isTestReceiver"
      :select-data="exposeData"
      @close="isActiveSelectReceiver = false"
      @expose="onExposeReceiver"
      @expose-test="onExposeTestSend"
    />
    <alarm-batch-cycle
      :batch-form="batchForm"
      :batch-cycle="alarmBatchCycles"
      :active="isActiveBatchCycle"
      @close="isActiveBatchCycle = false"
      @save="onExposeAlarmBatchCycle"
    />
    <template-preview-modal
      :active="isActivePreviewModal"
      :html="previewHtml"
      @close="isActivePreviewModal = false"
    />
  </div>
</template>

<script>
import SelectReceiver from './Receiver/SelectReceiver.vue'
import AlarmBatchCycle, { DAY_ENUM } from './AlarmBatchCycle.vue'
import TemplatePreviewModal from './TemplatePreviewModal.vue'
import API, { TinyEditor } from '@sd-fe/cmp-core'
// import { pick } from 'lodash'
import {
  mapReceiverFromAPI,
  mapReceiverNameFromAPI,
  mapReceiverUqFromAPI
} from './Receiver/ReceiverUtil'
import { CYCLE_ENUM, mapAlarmCycleDto, WEEK_ENUM } from './Util/Mapping'

// 예외 처리가 필요한 contentValue들
const CONTENT_OTP = 'COMMON_OTP' // OTP
const CONTENT_SHARE_PROJECT = 'COMMON_SHARE_PROJECT' // 프로젝트 공유

// 예외 처리가 필요한 alarmType들
const TYPE_WEB_PUSH = 'WEB_PUSH'
const TYPE_MAIL = 'MAIL'

/**
 * 알람 템플릿 타입
 */

/**
 * 라우트 쿼리 t = 템플릿 아이디
 * 템플릿 아이디가 쿼리 내 존재할 시 편집 상태 (isEdit)
 */
export default {
  name: 'AlarmTemplateDetail',
  components: {
    SelectReceiver,
    AlarmBatchCycle,
    TemplatePreviewModal,
    TinyEditor
  },
  watch: {
    'selectData.system': {
      handler: 'setFormContents',
      immediate: true
    },
    activeTrigger: {
      handler (trigger) {
        if (trigger) {
          this.inputData.defaultReceiver = trigger.defaultReceiverName
          this.selectData.type = (trigger.alarmCycleType || '').toLowerCase()
          this.selectData.typeStr = (
            this.cycleMap.get(trigger.alarmCycleType) || {}
          ).codeName

          // 트리거별 예외 처리
          switch (trigger.contentValue) {
            case CONTENT_OTP: // OTP
              // OTP 면 웹푸시 불가능, 추가 수신 대상 선택 불가
              // 수신 대상 선택 불가는 템플릿에서 처리 여기선 기등록된 추가 수신 대상 초기화
              this.exposeData = null
              break
            default:
              break
          }
        } else {
          this.inputData.defaultReceiver = ''
          this.selectData.type = null
          this.selectData.typeStr = ''
        }
        this.setFormContents(true)
      }
    }
  },
  computed: {
    /**
     * 선택한 트리거
     */
    activeTrigger () {
      return !this.selectData.trigger
        ? null
        : this.triggers.find(trigger => trigger.id === this.selectData.trigger)
    },
    /**
     * 에디터 툴바 간소화 여부
     */
    isSimpleToolbar () {
      return this.selectData.system !== 'MAIL'
    },
    /**
     * 현재 페이지가 편집 상태인지 반환한다.
     */
    isEdit () {
      return typeof this.$route.query.t !== 'undefined'
    },
    /**
     * 템플릿에 넣을 수신자 대상 반환 (그룹)
     */
    groupReceivers () {
      if (!this.exposeData || !this.exposeData.group) return []

      return this.exposeData.group.checked
    },
    /**
     * 템플릿에 넣을 수신자 대상 반환 (사용자)
     */
    userReceivers () {
      if (!this.exposeData || !this.exposeData.user) return []

      return [
        ...(this.exposeData.user.groups || []).map(item => this.setReceiverType(item, false)),
        ...(this.exposeData.user.users || []).map(item => this.setReceiverType(item, false))
      ]
    },
    /**
     * 템플릿에 넣을 수신자 대상 반환 (관리자)
     */
    adminReceivers () {
      if (!this.exposeData || !this.exposeData.admin) return []

      return [
        ...(this.exposeData.admin.groups || []).map(item => this.setReceiverType(item, true)),
        ...(this.exposeData.admin.users || []).map(item => this.setReceiverType(item, true))
      ]
    }
  },
  created () {
    this.isLoadingTrigger = true

    Promise.all([
      this.getAlarmCycleTypes(),
      this.getAlarmTemplateDetail(),
      this.getAlarmSystemFromServer(),
      this.getTriggers(),
      this.getNationCodes(),
      this.getBatchAlarmCycles()
    ])
      .then(() => this.initData())
      .catch(err => {
        console.log(err)
        this.$alert(
          this.$v('템플릿 생성에 필요한 데이터 조회를 실패하였습니다.'),
          {
            callback: () =>
              this.$router.push({ name: 'cmp-alarm-template-list' })
          }
        )
      })
      .finally(() => {
        this.isLoadingTrigger = false
      })
  },
  methods: {
    onInputTinyEditor (input) {
      this.editorContent = input
    },
    /**
     * 테스트 발송
     */
    async onExposeTestSend (expose) {
      const receiverTransform = {
        group: [],
        user: [],
        admin: [
          ...(expose.admin.groups || []).map(item => this.setReceiverType(item, true)),
          ...(expose.admin.users || []).map(item => this.setReceiverType(item, true))
        ]
      }
      const apiData = this.transformApiData(receiverTransform)
      const validated = this.validateFormData(apiData)
      if (!validated) return

      this.isLoadingTestSend = true

      try {
        await API.alarm.testSend(apiData)
        this.$alert(this.$v('테스트 발송을 완료하였습니다.'), {
          callback: () => {
            this.isActiveSelectReceiver = false
          }
        })
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('테스트 발송에 실패하였습니다.'))
      } finally {
        this.isLoadingTestSend = false
      }
    },
    async getBatchAlarmCycles () {
      const { data } = await API.alarm.getBatchAlarmCycle()
      this.alarmBatchCycles = (data || [])
    },
    async getNationCodes () {
      const { data } = await API.alarm.getNationCodes()
      this.countryCodeOptions = data.map(code => ({ ...code, countryName: `${code.codeName} (${code.codeVal})`, countryCode: code.codeVal }))
    },
    getUserClearableTagName (user) {
      if (!user.data) return ''
      return user.receiverType === 'user'
        ? `(${user.isAdmin ? '관리자' : '사용자'}) ${user.data.groupName} ${user.data.userName}${user.data.userId ? `(${this.$options.filters.maskingName(user.data.userId)})` : ''}`
        : user.data.groupUpperName
    },
    setAlarmCycleOptions () {
      if (this.alarmCycles && this.alarmCycles.length) {
        this.alarmCycles.forEach(cycle => {
          this.cycleMap.set(cycle.codeVal, cycle)
        })
      }
    },
    async getAlarmCycleTypes () {
      const { data } = await API.alarm.getAlarmCycleTypes()
      this.alarmCycles = data
      return data
    },
    /**
     * html -> Key:Value 변환
     */
    convertTemplateContent (html = '') {
      const macroRegex = /(#{\w+})/gim
      const matches = html.match(macroRegex)

      if (!matches || !matches.length) return html

      matches.forEach(match => {
        const keyword = match.slice(2, match.length - 1)
        const convertMacroHtml = `<span class="macro" contenteditable="false" data-macro-keyword="${keyword}">${keyword}</span>`
        html = html.replace(match, convertMacroHtml)
      })

      return html
    },
    async getAlarmTemplateDetail () {
      if (!this.isEdit) return null

      const id = this.$route.query.t
      const { data } = await API.alarm.getTemplateById(id)
      this.editData = data
      return this.editData
    },
    setAlarmTypeOptions () {
      this.systemOptions = this.alarmTypes.map(alarmType => ({
        ...alarmType,
        label: alarmType.codeName,
        value: alarmType.codeVal
      }))

      if (!this.isEdit) {
        this.selectData.system = this.systemOptions[0].value
      }
    },
    initData () {
      this.setAlarmCycleOptions()
      this.setAlarmTypeOptions()
      this.templateFormContents = [...this.defaultTemplateFormContents]
      this.setFormContents()

      // 템플릿 편집일 경우 기존 템플릿 데이터로 폼을 채운다.
      if (this.isEdit) {
        this.setEditForm()
      }
    },
    async getAlarmSystemFromServer () {
      const { data } = await API.alarm.getAlarmTypes()
      this.alarmTypes = data
    },
    onBeforeChangeSystemOrTrigger (done, newValue, oldValue, type = 'system') {
      // 최초 세팅시 넘김
      if (!oldValue) return done()
      // 에디터에 값 없으면 넘김
      if (!this.editor.getContent()) return done()

      const message = type === 'system'
        ? this.$v('발송 시스템을 변경하는 경우<br>입력한 내용이 초기화됩니다.<br>그래도 변경하시겠습니까?')
        : this.$v('트리거를 변경하는 경우<br>입력한 내용이 초기화됩니다.<br>그래도 변경하시겠습니까?')

      this.$confirm(
        message,
        { dangerouslyUseHTMLString: true }
      )
        .then(() => done())
        .catch(() => false)
    },
    /**
     * 에디터에 복사한 내용을 붙여넣기 하기 전 실행
     */
    onPastePreProcess (editor, args) {
      if (this.selectData.system !== 'MAIL') {
        const dom = new DOMParser().parseFromString(args.content, 'text/html')
        // 삭제해야할 엘리먼트 삭제
        const removingEl = ['img', 'table']

        removingEl.forEach(el => {
          dom
            .querySelectorAll(el)
            .forEach(node => node.parentElement.removeChild(node))
        })

        // 스타일 전부 삭제
        dom.querySelectorAll('*').forEach(node => {
          node.removeAttribute('style')
          node.removeAttribute('data-mce-style')
        })

        args.content = dom.documentElement.innerHTML
      }
    },
    /**
     * 관리자-사용자 그룹핑별 라벨 반환
     */
    getReceiverLabel (receiver) {
      return receiver.label
    },
    /**
     * API - UI 다른 데이터 변환
     */
    transformApiData (apiReceiver) {
      const merge = (a, b) => ({ ...a, ...b })

      // 제목 (이메일)
      const getTitle = alarmSystem => {
        switch (alarmSystem) {
          case 'MAIL':
            return this.inputData.emailTitle
          default:
            return null
        }
      }

      // 트리거 아이디
      const getTriggerId = () => {
        return this.selectData.trigger
      }

      /**
       * 추가 수신 대상 (그룹)
       */
      const getReceiverRoles = () => {
        return (apiReceiver.group || []).map(receiver => ({
          roleDetail: receiver.parentUq ? receiver[receiver.uqRef] : null,
          userRole: receiver.parentUq ? null : receiver.uq,
          ...receiver
        }))
      }

      /**
       * 추가 수신 대상 (조직, 사용자-관리자 혼합)
       */
      const getReceiverGroups = () => {
        return []
          .concat(
            (apiReceiver.admin || []).map(receiver => ({
              ...receiver,
              data: {
                ...receiver.data,
                isAdmin: true
              }
            })),
            (apiReceiver.user || []).map(receiver => ({
              ...receiver,
              data: {
                ...receiver.data,
                isAdmin: false
              }
            }))
          )
          .filter(receiver => receiver.receiverType === 'group')
      }

      /**
       * 추가 수신 대상 (유저, 사용자-관리자 혼합)
       */
      const getReceiverUsers = () => {
        // 리시버 타입이 유저인 경우와
        // isAdmin 이 매핑된 값 반환
        const filterUserType = receiver => receiver.receiverType === 'user'
        const mapIsAdmin = receiver => ({
          ...receiver,
          data: {
            ...receiver.data,
            isAdmin: receiver.__UI_USER_TYPE__ === 'admin'
          }
        })

        return []
          .concat(apiReceiver.admin, apiReceiver.user)
          .filter(filterUserType)
          .map(mapIsAdmin)
      }

      const zipReceiver = (receivers, receiverType) => {
        let receiverCommon = {}

        if (this.isEdit) {
          receiverCommon = merge(receiverCommon, {
            almTemplatesId: parseInt(this.$route.query.t)
          })
        }

        const zippedList = receivers.map(receiver => {
          const base = merge(receiverCommon, {})

          if (this.isEdit) {
            base.almTemplatesReceiverIdx =
              receiver.almTemplatesReceiverIdx || null
            base.createUser = receiver.createUser || null
            base.createTime = receiver.createTime || null

            if (!base.createUser) delete base.createUser
            if (!base.createTime) delete base.createTime
            if (!base.almTemplatesReceiverIdx) { delete base.almTemplatesReceiverIdx }
          }

          const getIsAdminText = isAdmin => (isAdmin ? '관리자' : '사용자')

          switch (receiverType) {
            case 'group':
              return merge(base, {
                groupIdx: receiver.idx,
                groupName: receiver.data.groupUpperName,
                companyIdx: receiver.data.companyIdx,
                companyName: receiver.data.companyName,
                isAdmin: receiver.data.isAdmin,
                receiverKeyword: `(${getIsAdminText(receiver.data.isAdmin)}) ${
                  receiver.data.groupUpperName
                }`
              })
            case 'role':
              return merge(base, {
                roleIdx: receiver.roleDetail,
                roleName: receiver.roleName,
                isAdmin:
                  typeof receiver.isAdmin === 'boolean'
                    ? receiver.isAdmin
                    : null,
                userPermLevel:
                  typeof receiver.userPermLevel === 'number'
                    ? receiver.userPermLevel
                    : null,
                // receiverKeyword: `(${getIsAdminText(receiver.isAdmin)}) ${
                //   receiver.label
                // }`
                receiverKeyword: `${
                  receiver.label
                }`.trim()
              })
            case 'user':
              return merge(base, {
                isAdmin: !!receiver.isAdmin,
                userId: receiver.userId,
                userIdx: receiver.userIdx,
                userName: receiver.userName,
                groupName: receiver.groupName || null,
                groupIdx: receiver.userGroup,
                companyName: receiver.userCompanyName,
                companyIdx: receiver.userCompany,
                receiverKeyword: `(${getIsAdminText(receiver.isAdmin)}) ${
                  receiver.groupName
                } ${receiver.userName}${
                  receiver.userId
                    ? `(${this.$options.filters.maskingName(receiver.userId)})`
                    : ''
                }`
              })
            default:
              return base
          }
        })

        return zippedList
      }

      // 에디터에서 키 입력 부분 전부 변환
      // const transformMacro = html => {
      //   const parser = new DOMParser()
      //   const parsed = parser.parseFromString(html, 'text/html')

      //   // HTML -> #{Macro}
      //   Array.from(parsed.body.querySelectorAll('.macro') || []).forEach(el => {
      //     const html = el.outerHTML
      //     const keyword = el.dataset.macroKeyword

      //     parsed.body.innerHTML = parsed.body.innerHTML.replace(
      //       html,
      //       `#{${keyword}}`
      //     )
      //   })

      //   return parsed.body.innerHTML
      // }

      const getAlarmFormData = alarmType => {
        let commonData = {
          alarmCycleType: this.activeTrigger?.alarmCycleType,
          alarmType,
          name: this.inputData.templateName,
          title: getTitle(this.selectData.system),
          triggerId: getTriggerId(),
          alarmTemplateReceiverDtoList: [].concat(
            zipReceiver(getReceiverRoles(), 'role'),
            zipReceiver(getReceiverGroups(), 'group'),
            zipReceiver(getReceiverUsers(), 'user')
          )
        }

        if (alarmType === 'MAIL') {
          commonData.contents = this.editor
            // ? transformMacro(this.editor.getContent())
            ? this.editor.getContent()
            : ''
        } else {
          const content = this.editor.getContent()
          const parser = new DOMParser()
          const doc = parser.parseFromString(content, 'text/html')
          commonData.contents = doc.body.innerText
        }

        if (commonData.alarmCycleType === 'BATCH') {
          if (!this.batchForm || !this.batchLabel) {
            // 이렇게 하지마라..
            commonData = merge(commonData, {
              alarmCycleDto: null
            })
          } else {
            commonData = merge(commonData, {
              alarmCycleDto: {
                alarmCycle: this.batchForm.cycle,
                alarmCycleTime: this.batchForm.time + ':00',
                date: this.batchForm.dayOfMonth || null,
                weekDay: this.batchForm.weekCycle.map(week => {
                  return {
                    0: 'MONDAY',
                    1: 'TUESDAY',
                    2: 'WEDNESDAY',
                    3: 'THURSDAY',
                    4: 'FRIDAY',
                    5: 'SATURDAY',
                    6: 'SUNDAY'
                  }[week]
                })
              }
            })
          }
        }

        switch (alarmType) {
          case 'MAIL':
            return merge(commonData, {

            })
          case 'PPURIO_AT_API':
          case 'PPURIO_AT_DB':
            return merge(commonData, {
              apiTemplateCode: this.inputData.templateCode,
              nationCode: this.selectData.countryCode
            })
          case 'PPURIO_SMS_API':
          case 'PPURIO_SMS_DB':
          case 'TALK':
          case 'WEB_PUSH':
          default:
            return merge(commonData, {})
        }
      }

      return getAlarmFormData(this.selectData.system)
    },
    /**
     * 폼 유효성 검증
     */
    validateFormData (form) {
      if (!form.name) {
        this.$alert(this.$v('템플릿명을 입력해주세요.'))
        return false
      }
      if (!form.triggerId) {
        this.$alert(this.$v('트리거를 선택해주세요.'))
        return false
      }
      // 트리거별 예외 처리
      if (this.activeTrigger.contentValue === CONTENT_OTP && form.alarmType === TYPE_WEB_PUSH) {
        this.$alert(this.$v('해당 트리거는 선택한 발송 시스템을 이용할 수 없습니다.'))
        return false
      }
      if (this.activeTrigger.contentValue === CONTENT_SHARE_PROJECT && form.alarmType !== TYPE_MAIL) {
        this.$alert(this.$v('해당 트리거는 선택한 발송 시스템을 이용할 수 없습니다.') + ` (${this.$v('메일 외 사용 불가')})`)
        return false
      }
      if (form.alarmCycleType === 'BATCH' && !form.alarmCycleDto) {
        this.$alert(this.$v('배치 주기를 입력해주세요.'))
        return false
      }
      if (form.alarmType === 'MAIL') {
        // 이메일
        if (!form.title) {
          this.$alert(this.$v('제목을 입력해주세요.'))
          return false
        }
      }
      if (!form.contents) {
        this.$alert(this.$v('내용을 입력해주세요.'))
        return false
      }
      if (form.alarmType.includes('PPURIO_AT')) {
        // 카카오 비즈
        if (!form.apiTemplateCode) {
          this.$alert(this.$v('카카오 템플릿 코드를 입력해주세요.'))
          return false
        }
        if (!form.nationCode) {
          this.$alert(this.$v('국가 코드를 선택해주세요.'))
          return false
        }
      }
      return true
    },
    /**
     * 알람 템플릿 수정 버튼 클릭
     */
    onUpdateAlarmTemplate () {
      this.$confirm('알람 템플릿을 수정하시겠습니까?').then(async () => {
        try {
          this.isLoadingCreateOrUpdate = true

          const formData = this.transformApiData({
            admin: this.adminReceivers,
            user: this.userReceivers,
            group: this.groupReceivers
          })
          const validated = this.validateFormData(formData)
          if (!validated) return

          /**
           * update
           */
          formData.id = this.editData.id
          formData.useYn = this.editData.useYn
          formData.createUser = this.editData.createUser
          formData.createTime = this.editData.createTime

          await API.alarm.updateTemplate(formData)
          this.$alert(this.$v('템플릿을 수정하였습니다.'), {
            callback: () => this.$router.push({ name: 'cmp-alarm-template' })
          })
        } catch (error) {
          if (error.response.data) {
            switch (error.response.data.code) {
              case 'ALM1004':
                return this.$alert(this.$v('이미 동일한 템플릿이 존재합니다.'))
              default:
                return this.$alert(this.$v('템플릿 수정에 실패하였습니다.'))
            }
          }
          console.log(error)
          this.$alert(this.$v('템플릿 수정에 실패하였습니다.'))
        } finally {
          this.isLoadingCreateOrUpdate = false
        }
      })
    },
    /**
     * 알람 템플릿 추가 버튼 클릭
     */
    onCreateAlarmTemplate () {
      this.$confirm('알람 템플릿을 생성하시겠습니까?')
        .then(async () => {
          try {
            this.isLoadingCreateOrUpdate = true

            const formData = this.transformApiData({
              admin: this.adminReceivers,
              user: this.userReceivers,
              group: this.groupReceivers
            })
            const validated = this.validateFormData(formData)
            if (!validated) return

            await API.alarm.createTemplate(formData)
            this.$alert(this.$v('템플릿을 생성하였습니다.'), {
              callback: () => this.$router.push({ name: 'cmp-alarm-template' })
            })
          } catch (error) {
            if (error.response.data) {
              switch (error.response.data.code) {
                case 'ALM1004':
                  return this.$alert(this.$v('이미 동일한 템플릿이 존재합니다.'))
                default:
                  return this.$alert(this.$v('템플릿 수정에 실패하였습니다.'))
              }
            }
            console.log(error)
            this.$alert(this.$v('템플릿 생성에 실패하였습니다.'))
          } finally {
            this.isLoadingCreateOrUpdate = false
          }
        })
        .catch(() => false)
    },
    /**
     * 메서드 렌더링
     */
    onRenderEditor (editor) {
      this.editor = editor

      if (this.isEdit && this.editData) {
        this.editor.setContent(
          // this.convertTemplateContent(this.editData.contents)
          this.editData.contents
        )
        this.editorContent = this.editor.getContent()
      }
    },
    /**
     * 배치 주기 초기화
     */
    onToggleClearBatchCycle () {
      this.$confirm('배치 주기를 삭제하시겠습니까?')
        .then(() => {
          this.batchLabel = ''
          this.batchForm = null
        })
        .catch(() => false)
    },
    /**
     * 배치 주기 모달에서 방출한 이벤트 핸들러
     */
    onExposeAlarmBatchCycle (form) {
      const day = {}

      for (const key in DAY_ENUM) {
        day[DAY_ENUM[key]] = key
      }

      let displayLabel = ''

      switch (form.cycle) {
        case CYCLE_ENUM.EVERY_DAY:
        case CYCLE_ENUM.LAST_DAY_OF_MONTH:
          displayLabel = `${form.label} ${form.time}`
          break
        case CYCLE_ENUM.EVERY_WEEK: {
          const c = form.weekCycle.map(cycle => day[cycle])
          displayLabel = `${form.label} ${c.join(', ')} ${form.time}`
          break
        }
        case CYCLE_ENUM.MONTHLY:
          displayLabel = `${form.label} ${form.dayOfMonth}일 ${form.time}`
          break
        default:
          break
      }

      this.batchLabel = displayLabel
      this.batchForm = form
    },
    /**
     * 편집 상태일 경우 API에서 받아온 템플릿 정보를
     * UI에 필요한 데이터로 변환한다.
     */
    convertTemplateToEdit () {
      const receivers = this.editData.alarmTemplateReceiverDtoList.map(
        mapReceiverFromAPI
      )
      const groupReceivers = receivers
        .filter(
          receiver =>
            !['userGroup', 'userUser', 'adminGroup', 'adminUser'].includes(
              receiver.receiverType
            )
        )
        .map(receiver => {
          const data = { ...receiver }
          if (receiver.receiverType === 'role') {
            data.parentUq = 'OPERATIONS_OFFICER'
            data.uqRef = 'roleIdx'
            data.hasParent = true
            data.label = receiver.roleName
          } else {
            data.label = mapReceiverNameFromAPI(receiver.receiverType)
            data.uq = mapReceiverUqFromAPI(receiver.receiverType)
          }
          return data
        })

      const groupMap = receiver => {
        return {
          idx: receiver.groupIdx,
          data: {
            groupName: receiver.groupName,
            groupUpperName: receiver.groupName,
            companyIdx: receiver.companyIdx,
            isAdmin: receiver.isAdmin
          },
          receiverType: 'group'
        }
      }
      const userMap = receiver => {
        return {
          idx: receiver.userIdx,
          ...receiver,
          data: {
            ...receiver,
            groupUpperName: `${receiver.groupName} ${receiver.userName}(${receiver.userId})`,
            userId: receiver.userId,
            userName: receiver.userName,
            isAdmin: receiver.isAdmin
          },
          receiverType: 'user'
        }
      }

      // 사용자 > 조직
      const userGroup = receivers
        .filter(receiver => receiver.receiverType === 'userGroup')
        .map(groupMap)
      // 사용자 > CMP 유저
      const userUser = receivers
        .filter(receiver => receiver.receiverType === 'userUser')
        .map(userMap)
      // 관리자 > 조직
      const adminGroup = receivers
        .filter(receiver => receiver.receiverType === 'adminGroup')
        .map(groupMap)
      // 관리자 > CMP 유저
      const adminUser = receivers
        .filter(receiver => receiver.receiverType === 'adminUser')
        .map(userMap)

      this.exposeData = {
        group: {
          receiverType: 'group',
          checked: groupReceivers
        },
        user: {
          componentType: 'user',
          receiverType: 'user',
          groups: userGroup,
          users: userUser
        },
        admin: {
          componentType: 'admin',
          receiverType: 'user',
          groups: adminGroup,
          users: adminUser
        }
      }
    },
    /**
     * 편집 상태의 폼을 채운다.
     */
    setEditForm () {
      if (!this.editData) return

      this.inputData.templateName = this.editData.name
      this.selectData.system = this.editData.alarmType
      this.selectData.trigger = this.editData.triggerId
      this.inputData.emailTitle = this.editData.title || ''

      if (this.editData.alarmCycleType === 'BATCH') {
        const code = this.alarmBatchCycles.find(cycle => cycle.codeVal === this.editData.alarmCycleDto.alarmCycle)
        const { dtoRaw, displayLabel } = mapAlarmCycleDto(this.editData.alarmCycleDto, code)

        this.batchForm = {
          cycle: this.editData.alarmCycleDto.alarmCycle,
          dayOfMonth: this.editData.alarmCycleDto.date,
          label: code.codeName,
          time: dtoRaw.alarmCycleTime,
          weekCycle: dtoRaw.weekDay.map(week => WEEK_ENUM[week])
        }
        const batchLabel = displayLabel || ''
        this.batchLabel = batchLabel.slice(0, batchLabel.length - 3)
      }

      this.convertTemplateToEdit()
    },
    /**
     * 유저 수신자 제거 이벤트
     */
    onToggleClearUser (source, key, raw) {
      const dataSource =
        source === 'user' ? this.exposeData.user : this.exposeData.admin

      if (!dataSource || !raw) return

      if (raw.receiverType === 'user') {
        dataSource.users = dataSource.users.filter(
          user => user.idx !== raw.idx
        )
      } else {
        dataSource.groups = dataSource.groups.filter(
          group => group.idx !== raw.idx
        )
      }
    },
    /**
     * 그룹 수신자 제거 이벤트
     */
    onToggleClearGroup (key, raw) {
      if (!this.exposeData || !this.exposeData.group) return

      if (raw.hasParent) {
        this.exposeData.group.checked = this.exposeData.group.checked.filter(
          item => {
            return !item.hasParent ? true : item.roleIdx !== raw.roleIdx
          }
        )
        let findGroup = this.exposeData.group.checked.find(
          item => item.children && item.children.length
        )
        if (findGroup) {
          findGroup = { ...findGroup, children: [] }
          this.onToggleClearGroup(null, findGroup)
        }
        // 초기 구현, 하위 항목이 제거됬을 경우 뭐가되었든 상위 항목은 제거한다.
        // if (!this.exposeData.group.checked.find(item => item.hasParent)) {
        //   // 하위 항목을 제거할 때, 모든 상위 항목의 하위 항목이 제거됬을 경우
        //   // 하위 항목을 포함한 상위 항목을 리스트에서 제거한다.
        //   let findGroup = this.exposeData.group.checked.find(item => item.children && item.children.length)
        //   if (findGroup) {
        //     // 무한 루프 대비 children을 빈 배열로 넘긴다.
        //     findGroup = { ...findGroup, children: [] }
        //     // 상위 항목 제거
        //     this.onToggleClearGroup(null, findGroup)
        //   }
        // }
      } else {
        // 상위 항목이 사라졌을 경우 하위 항목을 모두 제거한다.
        if (raw.children && raw.children.length) {
          raw.children.forEach(child => this.onToggleClearGroup(null, child))
        }
        this.exposeData.group.checked = this.exposeData.group.checked.filter(
          item => {
            return item.hasParent || item.uq !== raw.uq
          }
        )
      }
    },
    /**
     * 그룹인지, 유저인지 판별해서 키에 할당한다.
     */
    setReceiverType (item, isAdmin) {
      return { ...item, receiverType: !item.data.userId ? 'group' : 'user', isAdmin }
    },
    /**
     * 수신자 대상 선택 모달에서 수신자 적용 이벤트
     */
    onExposeReceiver (exposeData) {
      this.exposeData = exposeData
    },
    /**
     * 이메일 템플릿 미리보기
     */
    onClickPreviewEmailTemplate () {
      this.previewHtml = this.editor.getContent()
      if (!this.previewHtml) return

      this.isActivePreviewModal = true
    },
    /**
     * 배치 주기 추가 버튼 클릭 이벤트
     */
    onClickAddBatchCycleModal () {
      this.isActiveBatchCycle = true
    },
    /**
     * SearchableSelect 에 넘기기 위해 데이터 매핑
     */
    mapTrigger (trigger) {
      return {
        ...trigger,
        label: trigger.name
      }
    },
    /**
     * Key:Value 아이템 클릭시 이벤트
     * @TEST 데이터 어떻게 내려올지 모르므로 간단하게 예제만 작성
     */
    onClickKeyValueItem (kv) {
      if (!this.editor) return

      // const content = `
      //   <span class="macro" contenteditable="false" data-macro-keyword="${kv.keyword}">${kv.keyword}</span>
      // `.trim()

      // this.editor.execCommand('mceInsertContent', false, content)

      this.editor.execCommand('mceInsertContent', false, kv.keyword)
      this.onInputTinyEditor(this.editor.getContent())
    },
    /**
     * 트리거 조회 (API)
     */
    async getTriggers () {
      /** @TEST */
      const { data: triggers } = await API.alarm.getTriggerList({
        pageSize: 10000
      })
      this.triggers = (triggers.content || []).map(this.mapTrigger)
    },
    /**
     * 취소
     */
    onClickCancel () {
      this.$router.push({ name: 'cmp-alarm-template' })
    },
    /**
     * 테스트 발송 버튼 클릭시 이벤트
     */
    onClickSendToTestReceiver () {
      this.isTestReceiver = true
      this.isActiveSelectReceiver = true
    },
    /**
     * 수신자 추가 버튼 클릭시 이벤트
     */
    onClickSelectReceiver () {
      this.isTestReceiver = false
      this.isActiveSelectReceiver = true
    },
    /**
     * 발송 시스템, 트리거, 유형 등 항목이 변경될 때마다
     * 하위 항목을 변형시킨다.
     */
    setFormContents (shouldReRender = true) {
      // 에디터 & 키 입력란
      const editorContent = {
        binding: 'editor',
        header: '내용',
        customHtml: true,
        required: true
      }
      let result = [...this.defaultTemplateFormContents]

      if (this.selectData.type === 'batch') {
        result = [].concat(result, [this.batchCycleContent])
      }

      // 발송 시스템 (카카오의 경우 카카오 템플릿 코드 및 국가 코드 필요)
      if (this.selectData.system.includes('PPURIO_AT')) {
        result = [].concat(result, this.kakaoSystemContents)
      } else if (this.selectData.system === 'MAIL') {
        result = [].concat(result, [this.emailSystemContent])
      }

      result.push(editorContent)

      this.templateFormContents = result
      if (shouldReRender) {
        this.updateKey = new Date().getTime()
      }
    }
  },
  data: () => ({
    isLoadingTestSend: false,
    alarmBatchCycles: [],
    alarmCycles: [],
    cycleMap: new Map(),
    customContentStyle: `
      body { white-space: initial; }
      .macro {
        display: inline-block;
        margin: 1px 5px;
        padding: 5px 10px;
        border-radius: 6px;
        border: 1px solid #ccc;
        pointer-events: none;
        font-weight: bold;
      }
    `.trim(),
    editData: null,
    alarmTypes: [],
    /**
     * 발송 시스템
     */
    systemOptions: [
      // { label: 'MAIL', value: 'MAIL' },
      // { label: 'Web Push', value: 'web-push' },
      // { label: 'SMS', value: 'sms' },
      // { label: 'Kakao Biz', value: 'kakao-biz' }
    ],
    /**
     * @type {import('tinymce').Editor | null}
     */
    editor: null,
    /**
     * 발송 시스템
     * 선택 트리거
     * 유형 (트리거에 의해 결정)
     */
    selectData: {
      system: '',
      trigger: '',
      type: null,
      typeStr: '',
      countryCode: '+82'
    },
    /**
     * 기본 수신 대상 (readonly)
     * 이메일 제목 (발송 시스템: 이메일 한정)
     */
    inputData: {
      defaultReceiver: '',
      emailTitle: '',
      templateCode: '',
      templateName: ''
    },
    defaultTemplateFormContents: [
      {
        binding: 'name',
        header: '템플릿 명',
        customHtml: true,
        required: true
      },
      {
        binding: 'system',
        header: '발송 시스템',
        customHtml: true,
        required: true
      },
      {
        binding: 'trigger',
        header: '트리거',
        customHtml: true,
        required: true
      },
      { binding: 'type', header: '유형', customHtml: true, required: true },
      {
        binding: 'defaultReceiver',
        header: '기본 수신 대상',
        customHtml: true,
        required: true
      },
      { binding: 'receivers', header: '추가 수신 대상', customHtml: true }
      // {
      //   binding: 'keyValue',
      //   header: 'Key / Value',
      //   customHtml: true,
      //   required: true
      // },
    ],
    templateFormContents: [],
    batchCycleContent: {
      binding: 'batchCycle',
      header: '배치 주기',
      customHtml: true,
      required: true
    },
    kakaoSystemContents: [
      {
        binding: 'templateCode',
        header: '카카오 템플릿 코드',
        customHtml: true,
        required: true
      },
      {
        binding: 'countryCode',
        header: '국가 코드',
        customHtml: true,
        required: true
      }
    ],
    emailSystemContent: {
      binding: 'title',
      header: '제목',
      customHtml: true,
      required: true
    },
    /**
     * Select Box Wid
     */
    defaultSearchableWidth: '300px',
    /**
     * Input Box Width
     */
    defaultInputWidth: '400px',
    /**
     * 이메일 편집 모드 (에디터)
     */
    emailEditMode: 'Editor',
    /**
     * 수신자 선택 모달 옵션 (테스트 발송)
     */
    isTestReceiver: false,
    /**
     * 모달 액티브 상태 (수신자 대상 추가 모달)
     */
    isActiveSelectReceiver: false,
    /**
     * 모달 액티브 상태 (배치 주기 추가 모달)
     */
    isActiveBatchCycle: false,
    /**
     * 모달 액티브 상태 (이메일 미리보기 모달)
     */
    isActivePreviewModal: false,
    /**
     * 트리거 목록 로딩 상태
     */
    isLoadingTrigger: false,
    /**
     * 트리거 목록
     */
    triggers: [],
    /**
     * 이메일 템플릿 미리보기시 에디터에서 뽑아낸 HTML
     */
    previewHtml: '',
    /**
     * 수신자 대상 선택 모달에서 적용된 데이터
     */
    exposeData: null,
    /**
     * 배치 주기 라벨
     */
    batchLabel: null,
    /**
     * 배치 주기 폼 데이터 (모달에서 작성한)
     */
    batchForm: null,
    /**
     * 알람 템플릿 생성 / 수정 로딩
     */
    isLoadingCreateOrUpdate: false,
    /**
     * 렌더링 키
     */
    updateKey: new Date().getTime(),
    /**
     * 국가 코드 옵션
     * API 대체 필요
     */
    countryCodeOptions: [],
    editorContent: null
  })
}
</script>

<style lang="scss" scoped>
.alarm {
  h3 {
    margin-bottom: $gap;
  }

  .custom-menus {
    display: flex;
    align-items: center;
    margin-left: $gap-m;

    .placeholder {
      margin-right: $gap-s;
    }

    .button {
      padding: 0 $gap;
    }
  }

  .button-area {
    margin-top: $gap-m;
    justify-content: center;
  }

  ::v-deep .register-contents {
    .contents {
      overflow: hidden;
    }
  }

  ::v-deep .kvs {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: flex-start;
    padding: $gap-s 0;

    &-title {
      flex: 0 0 auto;
      margin-right: $gap-s;
      font-weight: bold;
      min-width: 60px;

      &.pt {
        padding-top: $gap-s;
      }
    }

    &-flex-wrap {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
    }

    &-empty {
      color: $disable;
    }

    .kv-item {
      margin: 3px;
      padding: 5px 20px;
      border-radius: $radius;
      background-color: #39394b;

      &:hover {
        background-color: darken(#39394b, 5);
        cursor: pointer;
      }
    }
  }

  .receiver-wrap {
    display: flex;
    flex-wrap: nowrap;

    & > button {
      flex: 0 1 auto;
      min-width: auto !important;
    }

    .receivers {
      margin-left: $gap-s;
      display: flex;
      flex-wrap: wrap;

      .clearable-tag {
        padding-top: 0;
        padding-bottom: 0;
      }
    }
  }

  /* ::v-deep .cmp-editor .ProseMirror {
    max-height: 700px;
    overflow-y: auto;
  } */
}
</style>
