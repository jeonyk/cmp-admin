<!--
  * 파일명 : IndivInquiryDetail.vue
  * 파일 기능 : 1:1 문의 상세 조회 및 문의에 대한 답변 기능
  * 작성자 : 정재은 외 3명
  * 최종 작성일 : 2021-02-09
  * License By Shinsegae I&C
  * 2021-02-09 Update: 어드민관리 차단 페이지 추가
 -->

<template>
  <div
    class="indiv-inquiry-detail"
    v-loading.fullscreen.lock="isUploading"
  >
    <article class="info-wrap">
      <h5 class="small-tit">
        {{ $t('admin.NOTI.customerInfo') }}
      </h5>
      <!-- {{ $route.params }} -->
      <section class="detail-contents">
        <div class="divided">
          <register-contents
            :title="inquiryData.userName ? $t('common.MODAL.name') + ' / ' + $t('admin.NOTI.employeeNumber') : $t('common.MODAL.name')"
          >
            <span>{{ inquiryData.userName ? inquiryData.userName + ' / ' + semiBlindId(inquiryData.userId) : inquiryData.userId }}</span>
          </register-contents>
          <!-- /.이름 -->

          <register-contents :title="$t('admin.NOTI.memberClass')">
            <span :class="{ '-not-member': inquiryData.isLogin }">
              {{ inquiryData.isLogin ? $t('admin.NOTI.member') : $t('admin.NOTI.nonMember') }}
            </span>
          </register-contents>
        <!-- /.회원구분 -->
        </div>

        <div class="divided">
          <register-contents :title="$t('admin.NOTI.phone')">
            <span>{{ inquiryData.phoneNum }}</span>
          </register-contents>
          <!-- /.휴대폰(연락처) -->

          <register-contents :title="$t('admin.ACCOUNT.email')">
            <span>{{ inquiryData.email }}</span>
          </register-contents>
        <!-- /.이메일 -->
        </div>
      </section>
    </article>
    <!-- /. 고객정보 -->

    <article class="info-wrap">
      <h5 class="small-tit">
        {{ $t('admin.NOTI.inqContent') }}
      </h5>

      <section class="detail-contents">
        <div class="divided">
          <register-contents :title="$t('admin.NOTI.inqType')">
            <span>{{ inquiryData.type }}</span>
          </register-contents>
          <!-- /.문의유형 -->

          <register-contents :title="$t('admin.NOTI.regDate')">
            <span>{{ inquiryData.regDt|date }}</span>
          </register-contents>
        <!-- /.등록일 -->
        </div>

        <register-contents :title="$t('admin.NOTI.title')">
          <span>{{ inquiryData.title }}</span>
        </register-contents>
        <!-- /.제목 -->

        <register-contents :title="$t('admin.NOTI.content')">
          <cmp-editor
            :set-content="askConts"
            :edit="false"
          />
        </register-contents>
        <!-- /.내용 -->

        <register-contents :title="$t('admin.NOTI.fileList')">
          <!-- <ul class="uploaded_files">
            <li
              class="uploaded_file_lists"
              v-for="(file, index) in inquiryData.inqFileList"
              :key="index"
            >
              <a
                href="#"
                @click.prevent="fileClick(index)"
              >
                {{ file.fileName }}
              </a>
            </li>
          </ul> -->
          <ul
            v-if="inquiryData.fileList && inquiryData.fileList.length"
            class="uploaded_files"
          >
            <li
              v-for="file in inquiryData.fileList"
              :key="file.fileIdx"
              class="uploaded_file_lists"
            >
              <!-- <a :href="file.fileDownloadUrl">
                <span class="file-icon">
                  <i class="mdi mdi-file" />
                </span>
                <span class="file-name">
                  {{ file.fileOrgName }}
                </span>
                <span class="file-size"> ({{ file.fileSize | byte }}) </span>
              </a> -->
              <file-down-component
                :file-name="file.fileOrgName"
                :url="file.fileDownloadUrl"
              />
            </li>
          </ul>
        </register-contents>
      <!-- /.첨부파일 -->
      </section>
    </article>
    <!-- /. 문의 내용 -->

    <article
      class="info-wrap"
      style="margin: 0;"
    >
      <h5 class="small-tit">
        {{ $t('admin.NOTI.reply') }}
      </h5>

      <section class="detail-contents">
        <register-contents :title="$t('admin.NOTI.content')">
          <cmp-editor
            class="editor"
            :set-content="answerConts"
            @edited-contents="jsonExporter"
          />
        </register-contents>
        <!-- /.내용 -->

        <register-contents :title="$t('admin.NOTI.stateAnswer')">
          <el-radio-group
            class="answer-status"
            v-model="inquiryData.status"
          >
            <el-radio label="ANSWER_WAIT">
              <!-- 답변 대기 -->
              {{ $t('admin.NOTI.waitAnswer') }}
            </el-radio>
            <el-radio label="ANSWER_COMPLETE">
              <!-- 답변 완료 -->
              {{ $t('admin.NOTI.completeAnswer') }}
            </el-radio>
          </el-radio-group>
        </register-contents>
      <!-- /.답변 상태 -->
      </section>

      <div class="other-info detail-contents">
        <div class="divided">
          <register-contents :title="$t('admin.NOTI.answer')">
            <span v-if="inquiryData.inqAnswerAdmin">
              {{ inquiryData.inqAnswerAdmin }}
            </span>
            <span v-else>{{ user.userName }} </span>
          </register-contents>
          <!-- /.답변자 -->

          <register-contents :title="$t('common.REGCON.resDate')">
            <span v-if="inquiryData.inqAnswerTime">{{ inquiryData.inqAnswerTime | date }}</span>
            <span v-else>-</span>
          </register-contents>
          <!-- /.답변일시 -->
        </div>
      </div>
    </article>
    <!-- /. 고객정보 -->

    <div class="button-area -center -form-bottom">
      <button
        class="button"
        @click="outToList"
        size="is-large"
      >
        {{ $t('common.BTN.list') }}
      </button>
      <button
        class="button"
        @click="saveDataDetail"
        type="is-primary"
        size="is-large"
      >
        {{ $t('common.BTN.save') }}
      </button>
    </div>
  </div>
</template>

<script>
import API, { CMPEditor, FileDownComponent } from '@sd-fe/cmp-core'

import { mapGetters } from 'vuex'

export default {
  name: 'IndivInquiryDetail',
  components: {
    'cmp-editor': CMPEditor,
    FileDownComponent
  },
  created () {
    this.getInquiryCode()
    this.getInquiryData()
  },
  computed: {
    ...mapGetters(['user'])
  },
  methods: {
    semiBlindId (id) {
      // const length = id.length
      // const start = id.substring(0, 2)
      // const last = id.substring(length - 2, length)
      // let mid = ''
      // for (let i = 0; i < length - 4; i++) {
      //   mid += '*'
      // }
      // return start + mid + last
      return '**' + id.substring(2)
    },
    routeTo (to) {
      this.$router.push(to)
    },
    async getInquiryCode () {
      const response = await API.config.getCodeList({ codeType: 'INQUIRY' })
      if (response) {
        const codeMapParam = new Map()
        response.forEach(data => codeMapParam.set(data.codeVal, data.codeName))
        this.codeMap = codeMapParam
      }
    },
    outToList (index, list) {
      this.routeTo({ name: 'indiv-inquiry-list' })
    },
    async getInquiryData () {
      try {
        const inqIdx = await this.$route.params.inqIdx
        const response = await API.config.getInquiry({ inqIdx })

        this.inquiryData = {
          idx: response.inqIdx,
          userName: response.inqCreateUserName,
          isLogin: response.isLogin,
          phoneNum: response.inqPhone,
          email: response.inqEmail,
          type: this.codeMap.get(response.inqType) || this.$t('common.TERMS.unClassified'),
          regDt: response.inqCreateTime,
          title: response.inqQuestionTitle,
          contents: response.inqQuestionBody,
          status: response.inqStatus,
          inquiryAnswerBody: response.inqAnswerTime,
          inqAnswerTime: response.inqAnswerTime,
          userId: response.inqCreateUser,
          fileList: response.fileList
        }

        console.log(response)

        this.rawInquiry = response
        if (response.inqQuestionBody) this.askConts = response.inqQuestionBody
        if (response.inqAnswerBody) this.answerConts = response.inqAnswerBody

        if (response.inqFileName && response.inqFileName !== '') {
          const fileNameList = response.inqFileName.split('|')
          const fileBodyList = response.inqFileBody.split('|')
          this.inquiryData.inqFileList = []
          for (const i in fileNameList) {
            this.inquiryData.inqFileList.push({ fileName: fileNameList[i], fileBody: fileBodyList[i] })
          }
        }
      } catch (error) {
        // console.log(error.response.status)
        this.$alert(this.$t('common.ALERT.IND.007'))
        return this.$router.push({ name: 'indiv-inquiry' })
      }
    },
    fileClick (index) {
      const decodedFile = atob(this.inquiryData.inqFileList[index].fileBody)
      const byteNumbers = new Array(decodedFile.length)
      for (let i = 0; i < byteNumbers.length; i++) {
        byteNumbers[i] = decodedFile.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const fileUrl = window.URL.createObjectURL(new Blob([byteArray]))
      const fileLink = document.createElement('a')
      fileLink.href = fileUrl
      fileLink.setAttribute('download', this.inquiryData.inqFileList[index].fileName)
      document.body.appendChild(fileLink)
      fileLink.click()
    },
    saveDataDetail (index, list) {
      if (this.inquiryData.status === 'ANSWER_COMPLETE') {
        const rawTextContent = document.querySelector('.ProseMirror[contenteditable=true]').textContent.trim()
        console.log(rawTextContent)
        console.log(this.inquiryData.inqAnswerBody)
        if (!this.inquiryData.inqAnswerBody || this.inquiryData.inqAnswerBody === '{"type":"doc","content":[{"type":"paragraph"}]}' || !rawTextContent) {
          // 답변 완료인 경우 답변 내용은 필수입니다.
          this.$alert(this.$t('common.ALERT.IND.001'))
          return
        }
      }
      this.$confirm(this.$t('common.CONFIRM.BASE.028'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        this.isUploading = true
        // 회원일경우
        const param = {
          inqIdx: this.inquiryData.idx,
          inqAnswerAdmin: this.inquiryData.inqAnswerAdmin || this.user.userName,
          inqAnswerBody: this.inquiryData.inqAnswerBody,
          inqStatus: this.inquiryData.status,
          sendType: this.inquiryData.isLogin ? 'TALK' : 'MAIL',
          sendAddress: this.inquiryData.isLogin ? this.user.userId : this.inquiryData.email
        }

        const response = await API.config.inquiryAnswer(param)
        if (response) {
          this.isUploading = false
          if (this.inquiryData.isLogin) this.$alert(this.$t('common.ALERT.IND.002'), '', { dangerouslyUseHTMLString: true })
          else this.$alert(this.$t('common.ALERT.IND.003'), '', { dangerouslyUseHTMLString: true })
          this.routeTo({ name: 'indiv-inquiry-list' })
        } else { this.isUploading = false }
      }).catch(() => false)
    },
    jsonExporter (content) {
      console.log(content)
      this.inquiryData.inqAnswerBody = JSON.stringify(content)
    }
  },
  data () {
    return {
      isUploading: false,
      rawInquiry: {},
      answerStatus: '',
      answerTime: '',
      latestModifiedTime: '',
      askConts: '',
      answerConts: '',
      codeMap: new Map(),
      inquiryData: {
        userName: '',
        isLogin: '',
        phoneNum: '',
        email: '',
        type: '',
        regDt: '',
        title: '',
        contents: '',
        status: ''
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.indiv-inquiry-detail{
  .info-wrap {
    margin-bottom: $gap * 2;
    > .small-tit {
      font-size: 20px;
      margin-bottom: $gap-s;
      line-height: 1.46;
    }
    .-not-member { color: $main-red; }
  }

  .detail-contents {
    border-top: 1px solid $border-color;
    .divided {
      display: flex;
      > * { flex: 0 0 50%; }
    }
    .answer-status {
      display: flex;
      > label {
        margin-right: $gap;
      }
    }
  }
  // .uploaded_file_lists {
  //   line-height: 2.5;
  //   a {
  //     border-bottom: 1px solid $main-red;
  //     display: inline-block;
  //     min-width: 150px;
  //     color: $main-red;
  //     text-decoration: none;
  //   }
  // }
  .uploaded_file_lists {
    a {
      color: $color-middlegrey;
      text-decoration: none;
      line-height: 1.5;
      &:hover {
        color: $title-color;
        border-bottom: 1px solid $primary;
      }
    }
  }
}
</style>
