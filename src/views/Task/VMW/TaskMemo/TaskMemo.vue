<!--
  * 파일명 : TaskMemo.vue
  * 파일 기능 : 메모 입력 / 등록된 메모 리스트를 확인 할 수 있습니다. size에 따라서 ui가 달라집니다. [size = mini]일 경우 사전협의에서만 사용됩니다.
  * 작성자 : 정재은 외 1명
  * 최종 작성일 : 2021-02-19
  * License By Shinsegae I&C
  * 2021-02-19 Update: memo 자동 업로드된 경우는 isAuto 처리
 -->

<template>
  <div :class="['temp', { '-mini-temp': size === 'mini' }]">
    <div :class="size === 'mini' ? '-mini-wrap' : ''">
      <div
        ref="memoScroll"
        class="scroll-area"
      >
        <p
          v-if="!memoData.length"
          class="empty-list"
        >
          {{ $v('등록된 메모가 없습니다.') }}
        </p>
        <ul
          v-else
          :class="['memo-list', { 'tiny-scroll': size }]"
        >
          <li
            v-for="(comment, index) in memoData"
            :key="comment.orderNo + index"
            class="memo-item"
          >
            <div class="indiv-comment">
              <div class="id-icon-sect">
                <i
                  class="id-icon"
                  :class="{ 'is-user-photo': comment.userPhoto }"
                  :style="comment.userPhoto ? { backgroundImage: `url(${comment.userPhoto})` } : {}"
                />
              </div>

              <div class="comment-cont">
                <p class="indiv-info">
                  <strong class="indiv-info-id"> {{ comment.userName }} </strong>
                  <span class="indiv-info-date"> {{ comment.createTime | date }} </span>
                </p>
                <!-- /. 개인정보 -->
                <p
                  class="-contents"
                  v-html="comment.memo"
                />
                <!-- /. 댓글 내용 -->

                <p class="reply-action">
                  <a
                    class="view-reply"
                    @click="viewReply = !viewReply"
                  >
                    <i class="bubble-icon" />
                    <span style="color: #b4b4b4">{{ comment.children ? comment.children.length : 0 }}</span>
                  </a>
                  <a
                    v-if="!disableWriting"
                    class="reply"
                    @click="replyAction(comment)"
                  >
                    {{ $t('task.TODO.DETAIL.reply') }}
                    <!-- 답글 달기 -->
                  </a>
                </p>
              </div>

              <!-- 댓글 more 버튼(...) -->
              <div
                class="more-action"
                v-if="((!disableWriting && removable(comment)) && !comment.isAuto) || size === 'mini'"
              >
                <i
                  class="more-icon mdi mdi-dots-vertical"
                  @click="openMoreModal(comment)"
                />

                <transition name="fade">
                  <div
                    v-if="currMemoIdx === comment.memoIdx && moreForMemo"
                    class="more-modal"
                    @mouseover="openMoreModal(comment)"
                    @mouseleave="closeMoreModal"
                    :style="{ width: $i18n.locale !== 'ko' ? '73px' : 'auto' }"
                  >
                    <a
                      v-if="size === 'mini'"
                      class="more-modal-item"
                      @click="replyAction(comment)"
                    >
                      {{ $t('task.TODO.DETAIL.comment') }}
                    </a>
                    <!-- /. 댓글 -->
                    <a
                      v-if="removable(comment) && !comment.isAuto"
                      @click="removeConfirm(comment)"
                      class="more-modal-item"
                    >
                      <!-- 삭제 / 메모 삭제 -->
                      {{ size === 'mini' ? $t('common.BTN.delete') : $t('task.TODO.DETAIL.deleteNote') }}
                    </a>
                    <!-- /. 삭제 -->
                  </div>
                </transition>
              </div>
            </div>
            <!-- /. 댓글 -->

            <div v-if="comment.children && viewReply">
              <div
                :class="['comment-reply', 'indiv-comment', size ? `-${size}` : '']"
                v-for="(reply, reIndex) in comment.children"
                :key="reply.userId + reIndex"
              >
                <div class="id-icon-sect">
                  <i
                    class="id-icon"
                    :class="{ 'is-user-photo': reply.userPhoto }"
                    :style="reply.userPhoto ? { backgroundImage: `url(${reply.userPhoto})` } : {}"
                  />
                </div>
                <!-- /. 프로필 사진 -->

                <div class="comment-cont">
                  <p class="indiv-info">
                    <strong class="indiv-info-id"> {{ reply.userName }} </strong>
                    <span class="indiv-info-date"> {{ reply.createTime | date }} </span>
                  </p>
                  <!-- /. 개인정보 -->

                  <p class="-contents">
                    {{ reply.memo }}
                  </p>

                  <!-- /. 답글 내용 -->
                  <p class="reply-action">
                    <!-- <a
                      class="view-reply"
                      v-if="reply.reply && reply.reply.length"
                    >
                      <i class="bubble-icon" />
                      <span style="color: #b4b4b4">{{ reply.reply.length }}</span>
                    </a> -->
                    <!-- /. 답글  -->
                    <a
                      v-if="!disableWriting"
                      class="reply"
                      @click="replyAction(reply)"
                    >
                      {{ $t('task.TODO.DETAIL.reply') }}
                    </a>
                    <!-- /. 답글 달기 -->
                  </p>
                </div>

                <!-- 답글 more 버튼(...) -->
                <div
                  class="more-action"
                  v-if="(!disableWriting && removable(reply)) || size === 'mini'"
                >
                  <i
                    class="more-icon mdi mdi-dots-vertical"
                    @click="openMoreModal(reply)"
                  />

                  <transition name="fade">
                    <div
                      v-if="currMemoIdx === reply.memoIdx && moreForMemo"
                      class="more-modal"
                      @mouseleave="closeMoreModal"
                      :style="{ width: $i18n.locale !== 'ko' ? '73px' : 'auto' }"
                    >
                      <!-- @mouseover="openMoreModal(reply)" -->
                      <a
                        v-if="size === 'mini'"
                        class="more-modal-item"
                        @click="replyAction(reply)"
                      >
                        {{ $t('task.TODO.DETAIL.comment') }}
                        <!-- 댓글 -->
                      </a>

                      <a
                        v-if="removable(reply)"
                        class="more-modal-item"
                        @click="removeConfirm(reply)"
                      >
                        <!-- 삭제 / 메모 삭제 -->
                        {{ size === 'mini' ? $t('common.BTN.delete') : $t('task.TODO.DETAIL.deleteNote') }}
                      </a>
                      <!-- /. 삭제 -->
                    </div>
                  </transition>
                </div>
              </div>
            </div>
            <!-- /. 답글 -->

            <div
              v-if="showReplyInput &&
                (parentMemoData.memoIdx === comment.memoIdx || parentMemoData.parentMemoIdx === comment.memoIdx)"
              class="comment-reply indiv-comment"
              ref="replyWrite"
            >
              <div class="id-icon-sect">
                <i class="id-icon" />
              </div>

              <div class="comment-wrap reply-comment-area">
                <el-input
                  class="comment-input"
                  v-model="replyMemoContents"
                  @keyup.native.enter="sendReply(replyMemoContents, parentMemoData)"
                />
                <i
                  class="mdi mdi-send"
                  @click="sendReply(replyMemoContents, parentMemoData)"
                />
              </div>
            </div>
          </li>
        </ul>
      </div>
      <!-- /. memo 데이터 목록 -->

      <!-- memo 사이즈가 mini 일 경우에는 하단에 메모창이 표시됩니다. -->
      <div
        v-if="size === 'mini'"
        class="mini-writable-section"
      >
        <memo-writer-modal
          size="mini"
          @closeMemoWriter="e => openWriter = false"
        />
      </div>

      <div
        class="write-comment-button"
        v-if="!openWriter && size !== 'mini' && !disableWriting"
      >
        <button
          class="button"
          @click="addMemo('write')"
          type="is-primary"
        >
          <!-- 메모 쓰기 -->
          {{ $t('task.TODO.DETAIL.writeNote') }}
        </button>
      </div>

      <!-- 메모 입력 모달 -->
      <transition name="fade">
        <memo-writer-modal
          v-if="size !== 'mini'"
          :active.sync="openWriter"
          :modify-type="commentType"
          @save-memo="sendMemoTemp"
          @closeMemoWriter="e => openWriter = false"
        />
        <!-- :comment-data="" -->
        <!-- mention 기능이 없어요 -->
      </transition>
    </div>

    <div
      class="comment-wrap comment-area -bottom-writer"
      v-if="size === 'mini'"
    >
      <i class="icon-bubble" />
      <el-input
        ref="memoWrite"
        class="new-comment-input"
        v-model="memoContents"
        @keyup.native.enter="sendMemoTemp(memoContents)"
      />
      <i
        class="mdi mdi-send"
        @click="sendMemoTemp(memoContents)"
      />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import MemoWriterModal from './MemoWriterModal'
import API from '@/components/Apis'

export default {
  name: 'TaskMemo',
  props: {
    data: {
      type: [Object, Array],
      default: () => []
    },
    size: {
      type: String, // mini
      default: null
    },
    disableWriting: { // 메모쓰기 버튼이 필요 없는경우 true
      type: Boolean,
      default: false
    }
  },
  components: {
    'memo-writer-modal': MemoWriterModal
  },
  watch: {
    '$route' (after, before) {
      if (after !== before) this.openWriter = false
    },
    data (data) {
      this.setMemoTreeData(data)
    },
    memoUsers (users) {
      if (users && users.length) {
        this.getUserAvatar(users)
      }
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    }),
    memoUsers () {
      const result = []
      if (this.memoData.length === undefined) return

      this.memoData.forEach(memo => {
        if (memo.children && memo.children.length) {
          result.push(...memo.children.map(child => child.userId))
        }
        result.push(memo.userId)
      })
      return [...new Set(result)]
      // return this.memoData.length ? [...new Set(this.memoData.map(memo => memo.userId))] : []
    }
  },
  created () {
    // console.log('%c 메모 생성완료', 'color: #9AE2FF')
    this.setMemoTreeData(this.data)
  },
  mounted () {
    // console.log('%c 메모 mounted 완료', 'color: #9AE2FF')
    this.focusIn(this.$refs.memoWrite)
  },
  methods: {
    getUserAvatar (users) {
      const updatedIds = [...new Set(Object.keys(this.updatedUserIdProfile))]
      const filteredUsers = users.filter(user => !updatedIds.includes(user))

      filteredUsers.forEach(async (user) => {
        try {
          const data = await API.iam.getUserInfo({ isAdmin: true, userId: user })

          if (data) {
            // 메모 업데이트
            this.memoData
              .filter(memo => {
                return memo.userId === data.userId || memo.children?.map(child => child.userId).includes(data.userId)
              })
              .forEach(memo => {
                if (memo.userId === data.userId) {
                  // console.log('match')
                  this.$set(memo, 'userPhoto', data.userPhoto)
                }

                if (memo.children && memo.children.length) {
                  memo.children.forEach(child => {
                    if (child.userId === data.userId) {
                      this.$set(child, 'userPhoto', data.userPhoto)
                    }
                  })
                }
              })

            if (!this.updatedUserIdProfile[data.userId]) {
              this.updatedUserIdProfile[data.userId] = data.userPhoto
            }
          }
        } catch (error) {
          console.log(error)
        }
      })
    },
    setMemoTreeData (data = this.data) {
      const rawData = JSON.parse(JSON.stringify(data))

      // 자동으로 생성된(변경된 내역) 메모 가공
      rawData.data = this.setMemoFormat(rawData.data)

      const children = rawData.data?.filter(raw => raw.parentMemoIdx)
      const parents = rawData.data?.filter(raw => !raw.parentMemoIdx)
      this.orderNo = rawData.orderNo
      // console.log(rawData)
      // this.approvalNo = rawData.approvalNo

      if (parents) {
        this.memoData = parents.map(raw => {
          const childrenData = children.filter(child => child.parentMemoIdx === raw.memoIdx)
          if (this.updatedUserIdProfile[raw.userId] !== undefined) this.$set(raw, 'userPhoto', this.updatedUserIdProfile[raw.userId])
          if (childrenData.length) {
            raw.children = childrenData
            raw.children.forEach(child => {
              if (this.updatedUserIdProfile[child.userId] !== undefined) this.$set(child, 'userPhoto', this.updatedUserIdProfile[child.userId])
            })
          }
          return raw
        })
      } else this.memoData = rawData

      this.$forceUpdate()
    },
    openMoreModal (memo) {
      this.currMemoIdx = memo.memoIdx
      this.moreForMemo = true
    },
    closeMoreModal (e) {
      if (this.currMemoIdx > 0 && this.moreForMemo === true) {
        this.currMemoIdx = 0
        this.moreForMemo = false
      }
    },
    replyAction (parent) {
      if (this.size !== 'mini') {
        this.openWriter = true
        this.commentType = 'reply'
      } else {
        this.showReplyInput = true
        this.$nextTick(() => {
          const replyWrite = this.$refs.replyWrite[0].querySelector('.el-input__inner')
          if (this.$refs.replyWrite) this.focusIn(replyWrite)
        })
      }
      this.parentMemoData = parent
    },
    // 메모 쓰기
    addMemo (type) {
      // if (this.size !== 'mini') {
      this.openWriter = true
      this.commentType = type
      // }
    },
    // 메모 수정
    modifyMemo () {
      if (this.size !== 'mini') this.openWriter = true
      // this.commentType = 'modify'
    },
    // 메모 삭제
    async removeConfirm (memo) {
      // this.$confirm('해당 메모를 삭제하시겠습니까?', '알림', {
      //   confirmButtonText: this.$t('common.BTN.confirm'),
      //   cancelButtonText: this.$t('common.BTN.cancel')
      // })
      this.removeMemo(memo.memoIdx)
    },
    async removeMemo (idx) {
      try {
        const deleteMemo = await API.task.deleteMemo(idx)

        if (deleteMemo.isDeleted) {
          this.$emit('change-memo')
          this.$emit('refresh-memo', this.orderNo)
        }
      } catch (error) {
        console.error('@@@ removeMemo Error', error)
      }
    },
    sendMemoTemp (memoContents) {
      if (!memoContents || memoContents === ' ') {
        if (this.size !== 'mini') this.openWriter = true
        return false
      }

      if (this.commentType === 'write') this.sendMemo(memoContents)
      else if (this.commentType === 'reply') this.sendReply(memoContents, this.parentMemoData)
    },
    async sendMemo (memo = this.memoContents, parentMemoIdx = undefined) {
      const user = this.user
      const orderNo = this.orderNo
      const memoData = {
        companyIdx: user.userCompany,
        companyName: user.userCompanyName,
        groupIdx: user.userGroup,
        groupName: user.userGroupName,
        memo,
        parentMemoIdx, // 답글일 경우 parentIdx가 필요합니다
        orderNo,
        userId: user.userId,
        userName: user.userName,
        userPosition: user.userPosition
      }

      try {
        const insert = await API.task.insertMemo(memoData)

        if (insert) {
          this.$emit('change-memo')
          this.$emit('refresh-memo', this.orderNo)
          this.memoContents = ''
          this.replyMemoContents = ''
          this.showReplyInput = false
          this.commentType = 'write'
          this.openWriter = false

          if (this.size === 'mini' && !parentMemoIdx) {
            const scroll = this.$refs.memoScroll.querySelector('.tiny-scroll')
            if (!scroll) return
            const lists = scroll.querySelectorAll('li')
            const top = Array.from(lists).map(li => li.clientHeight).reduce((acc, curr) => acc + curr)

            if (scroll) return setTimeout(() => scroll.scrollTo({ top: top + 200, left: 0 }), 200)
          }
        }
      } catch (error) {
        console.error('@@@ insertMemo Error', error)
      }
    },
    sendReply (contents, comment) {
      const parentMemoIdx = comment.parentMemoIdx ? comment.parentMemoIdx : comment.memoIdx
      this.sendMemo(contents, parentMemoIdx)
    },
    focusIn (element) {
      return element?.focus()
    }
  },
  data () {
    return {
      updatedUserIdProfile: {},
      memoData: [],
      approvalNo: undefined,
      openWriter: false,
      showReplyInput: false,
      commentType: 'write',
      moreForMemo: false,
      currMemoIdx: 0,
      memoContents: '',
      parentMemoData: undefined,
      replyMemoContents: '',
      viewReply: true,
      removable (regedUsr) {
        if (this.user.userPermLevel === 0) return true
        else return regedUsr.userId === this.user.userId
      },
      setMemoFormat (data) {
        return data?.map((m, idx) => {
          if (m.isAuto) {
            const memo = m.memo
            const wholeMemo = memo.split('<br>')

            if (wholeMemo[1]) {
            // 변경된 리스트
              const lists = wholeMemo[1].replace('\\n  ]', '').split('\\n ')

              if (lists) {
                const listsResult = lists.filter(list => list).map(list => {
                  const grade = list.replace(' }', '').replace('[ ', '').replace(' ]', '')
                  const each = grade.split(' { ')

                  each.unshift('<p class="auto-change-lists"><span class="-item-title">')
                  each.splice(2, 0, '</span><span class="-detail-cont">')
                  each.splice(each.length + 1, 0, '</span></p>')

                  const join = each.join('')
                  const result = join.replace('\\s', '<span>').replace('\\e', '</span>').replace('\\t', '<br />')

                  return result
                }).join('')

                const result = [wholeMemo[0], listsResult]
                m.memo = result.join('')
              }
            }
          }

          return m
        })
      }
    }
  }
}
</script>

<style lang="scss">
.temp {
  position: relative;
  height: 100%;

  // 일반 Memo 일 때
  .memo-list {
    .memo-item {
      & + .memo-item {
        border-top: 1px solid $border-color;
      }
    }
  }

  // size가 mini 인 Memo 경우
  &.-mini-temp {
    height: 600px;
    margin-top: 50px;
    padding-top: $gap-s;
    position: relative;
  }

  .-mini-wrap {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;

    .scroll-area {
      height: 510px;
      margin-bottom: $gap;

      > .memo-list {
        overflow-y: auto;
        overflow-x: hidden;
        height: 530px;
        .memo-item {
          padding: 0 $gap-m;
          & + .memo-item {
            margin-top: $gap-s;
            padding-top: $gap-s;
            border-top: 1px solid $color-lightgrey;
          }
        }
        .indiv-comment {
          position: relative;
          padding: 5px 0;
          min-height: auto;
          display: block;

          .id-icon-sect {
            display: none;
          }

          .comment-cont {
            margin: 0;
            width: 100%;
            font-size: 12px;

            .indiv-info {
              display: flex;
              align-items: center;
              &-id {
                color: $primary;
                min-width: 34px;
              }
              &-date {
                color: #b4b4b4;
              }
            }

            > .-contents { // 말풍선
              display: block;
              max-width: 400px;
              white-space: normal;
              padding: 0;
              margin-top: 5px;
              font-size: 12px;
              line-height: auto;
              background-color: transparent;
              border-radius: 0;

              // 자동변경된 내역 - size = mini
              .auto-change-memo {
                margin: $gap-s 0 3px 5px;
                font-size: 13px;
                line-height: 13px;
                height: 13px;
              }
              .auto-change-lists {
                &:first-child { margin-top: $gap-s; }
                line-height: 1.8;
                margin-left: 5px;
                align-items: flex-start;
                flex-wrap: wrap;
                .-detail-cont {
                  margin-left: 5px;
                }
              }
            }

            > .reply-action {
              display: none;
            }
          }

          .more-action {
            width: $gap-s;
            height: $gap;
            position: absolute;
            top:0; left: 100%;
            .more-icon {
              width: 3px; height: 12px;
              // line-height: 12px;
            }

            .more-modal { // size = 'mini'
              // top: calc(100% + 10px);
              left: auto;
              right: -$gap-s;
              width: 45px;
              border: 1px solid $gray;
              &:before {
                display: none;
              }
              > .more-modal-item {
                display: block;
                color: #333;
                text-align: center;
                white-space: nowrap;
                cursor: pointer;
                width: 25px;
                & + .more-modal-item {
                  margin-top: $gap-s;
                }
              }
            }
          }
          &.comment-reply {
            display: flex;
            > .id-icon-sect {
              display: inline-block;
              margin-right: 5px;
              .id-icon {
                display: inline-block;
                width: 12px;
                height: 12px;
                background-position: center;
                background-size: contain;
                background-repeat: no-repeat;
                background-image: url('../../../../assets/images/icon-reply@3x.png');
              }
            }

            .reply-comment-area {
              display: flex;
              align-items: center;
              flex: 1 1 auto;
              .comment-input {
                background: $white;
                width: 200px;
                border-radius: $radius;
                .el-input__inner {
                  border: none;
                }
              }
            }
          }
        }
      }

      > .empty-list {
        color: $disable;
      }
    }

    .mini-writable-section {
      // height: 150px;
      // position: absolute;
      // border: 1px solid red;
      width: 100%;
      // bottom: 0; left: 0;
    }
  }

  .-bottom-writer {
    position: absolute;
    bottom: 0; left: 0;
  }
}

// ======
  .empty-list {
    color: $input-placeholder;
    text-align: center;
    line-height: 42px;
  }

  .indiv-comment {
    min-height: 50px;
    padding: $gap 0;
    display: flex;
    align-items: flex-start;

    .id-icon-sect {
      text-align: center;
      .id-icon {
        display: inline-block;
        width: 42px;
        height: 42px;
        background-position: center;
        background-size: contain;
        background-repeat: no-repeat;
        background-image: url('../../../../assets/images/profile@3x.png');
        &.is-user-photo {
          border-radius: 9999px;
        }
      }
    }

    .comment-cont {
      margin: 0 $gap-s;
      flex: 1 1 auto;
      font-size: 13px;

      .indiv-info {
        display: flex;
        align-items: center;
        &-id {
          color: $title-color;
          display: inline-block;
          min-width: 40px;
          margin-right: $gap-s;
        }
        &-date {
          color: #b4b4b4;
          font-size: 12px;
          display: inline-block;
        }
      }

      > .-contents {
        display: inline-block;
        padding: 8px 15px;
        word-break: break-all;
        margin-top: 15px;
        line-height: 1.3;
        background-color: $panel-item-bg;
        border-radius: 0 $radius-m $radius-m $radius-m;

        // 자동변경된 내역
        .auto-change-memo {
          margin: $gap 0 5px 0;
          color: $primary;
          font-size: 15px;
          line-height: 15px;
          height: 15px;
        }
        .auto-change-lists {
          line-height: 1.8;
          margin-top: 3px;
          display: flex;
          align-items: flex-start;
          &:first-child { margin-top: $gap; }

          .-item-title {
            color: $light-gray;
            background: $black;
            line-height: $gap;
            height: $gap;
            padding: 0 5px;
            text-align: center;
            white-space: pre-wrap;
            border-radius: 2px;
            display: inline-block;
            white-space: nowrap;
          }
          .-detail-cont {
            display: inline-block;
            margin-left: $gap-s;
            height: 100%;
          }
        }
      }

      > .reply-action {
        display: flex;
        align-items: center;
        margin-top: $gap-s;
        .view-reply {
          display: flex;
          align-items: center;
          margin-right: $gap;
          font-size: 12px;
          .bubble-icon {
            display: inline-block;
            margin-right: 5px;
            width: 16px;
            height: 16px;
            background-position: center;
            background-size: contain;
            background-repeat: no-repeat;
            background-image: url('../../../../assets/images/icon-bubble@3x.png');
          }
        }
        .reply {
          color: $input-placeholder;
        }
      }
    }

    .more-action {
      position: relative;
      .more-icon {
        display: block;
        width: 5px; height: 20px;
        color: #9596a0;
        line-height: 20px;
        text-align: right;
        cursor: pointer;
      }

      .more-modal {
        position: absolute;
        z-index: 3;
        top: calc(100% + 10px);
        // left: calc(100% - 10px);
        right: -20px;
        width: 68px;
        box-sizing: border-box;
        background: $white;
        padding: $gap-s;
        border-radius: $radius-r;
        &:before {
          content: '';
          position: absolute;
          top: 0;
          right: 10px;
          margin-top: -5px;
          width: 0px;
          height: 0px;
          border-top:5px solid none;
          border-bottom:5px solid $white;
          border-right: 5px solid transparent;
          border-left: 5px solid  transparent;
        }
        > .more-modal-item {
          display: block;
          color: #333;
          font-size: 12px;
          text-align: center;
          cursor: pointer;
          width: 50px;
          & + .more-modal-item {
            margin-top: $gap-s;
          }
        }
      }
    }
  }

  .write-comment-button {
    margin-top: $gap;
    display: flex;
    justify-content: center;
  }

  .fade-enter-active, .fade-leave-active {
    transition: opacity .2s;
  }
  .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
  }

  .comment-reply {
    padding-left: 50px;
    position: relative;

    &.-mini {
      padding-left: 40px;
      &:before {
        width: 13px; height: 13px;
        top: 13px; left: 13px;
      }

    }
  }
  .comment-area {
    position: absolute;
    bottom: -40px;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    padding: 0 $gap;
    height: 50px;
    background-color: $white;
    > .icon-bubble {
      display: inline-block;
      margin-right: $gap-s;
      width: 24px;
      height: 22px;
      background-position: center center;
      background-size: contain;
      background-repeat: no-repeat;
      background-image: url('../../../../assets/images/icon-bubble@3x.png');
    }
    .new-comment-input {
      border: none;
       .el-input__inner {
        line-height: 28px;
        border: 0 ;
        padding: 0;
        padding-right: $gap-s;
      }
    }
  }

  .comment-wrap {
    display: flex;
    align-items: center;
    .mdi-send {
      margin-left: $gap-s;
      background: $primary;
      width: 15px; height: 15px;
      display: block;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: $radius;
      color: $white;
      cursor: pointer;
      transition: .2s ease;
      &:hover {
        background: darken($primary, 5%);
      }
      &::before {
        font-size: 15px;
      }
    }
  }
</style>
