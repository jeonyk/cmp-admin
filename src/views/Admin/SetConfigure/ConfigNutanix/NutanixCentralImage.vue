<!--
  * 파일명 : NutanixCentralImage.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-11-13
  * License By Shinsegae I&C
  * 2020-11-13 fix: 테이블 상단 버튼 위치 통일 (추가-변경-삭제)
 -->

<template>
  <div class="nutanix-central-image">
    <section class="table-top-wrap">
      <total-count :total-count="totalResultCnt" />

      <div class="button-area -right">
        <button
          class="button"
          type="is-anti"
          @click="newImageModal=true"
        >
          이미지 추가
        </button>
        <!-- <span class="divider" /> -->
        <button
          class="button"
          type="is-anti"
        >
          삭제
        </button>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        v-loading="isGetCentralImageRequest"
        :item-source.sync="imageList"
        :columns="imageListColumns"
        selectable
        :init-custom-action="gridInit"
        @selectedRow="rowSelect"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template
          v-for="column in imageListColumns"
          :slot="column.binding"
          slot-scope="props"
        >
          <div
            :key="column.binding"
          >
            <span>{{ props.row[column.binding] }}</span>
          </div>
        </template>
      </cmp-grid>
    </section>

    <!-- 모달 -->
    <!-- 항목 생성 모달 -->
    <el-dialog
      title="이미지 추가"
      :visible.sync="newImageModal"
      class="new-item-modal2"
      width="40%"
      @close="newImageModal = false"
    >
      <section class="modal-body">
        <div class="edit-list">
          <register-contents
            title="인증 정보"
            required
          >
            <template>
              <div class="input-form">
                <span style="min-width: 100px;">유저 이름: </span>
                <el-input
                  placeholder="유저 이름"
                />
              </div>
              <div class="input-form">
                <span style="min-width: 100px;">유저 비밀번호: </span>
                <el-input
                  placeholder="유저 비밀번호"
                  show-password
                />
              </div>
            </template>
          </register-contents>
          <!-- 인증 정보 -->

          <register-contents
            title="URL"
            required
          >
            <template>
              <el-input
                placeholder="url을 입력하세요."
              />
            </template>
          </register-contents>
          <!-- URL -->

          <register-contents
            title="테스트"
            required
          >
            <template>
              <button
                class="button"
                type="is-success"
              >
                테스트
              </button>
            </template>
          </register-contents>
        <!-- 테스트 -->
        </div>

        <div
          class="edit-list"
        >
          <register-contents
            title="Prism-Central 이름"
            required
          >
            <template>
              <el-input
                placeholder="Prism-Central"
              />
            </template>
          </register-contents>
          <!-- Prism-Central 이름 -->

          <!-- <register-contents
            title="동기화 주기"
            required
          >
            <template>
              <div class="input-form">
                <el-input-number
                  v-model="newItem.syncCycle"
                  style="width: 100px;"
                  placeholder="주기"
                  controls-position="right"
                  :min="0"
                />
                <span style="margin-left: 10px;"> 초</span>
              </div>
            </template>
          </register-contents> -->
          <!-- 동기화 주기 -->

          <register-contents
            title="마켓플레이스 사용 가능 여부"
            required
          >
            <template>
              <div class="input-form">
                <el-radio-group>
                  <el-radio
                    :label="true"
                  >
                    Y
                  </el-radio>
                  <el-radio
                    style="margin-left: 10px;"
                    :label="false"
                  >
                    N
                  </el-radio>
                </el-radio-group>
              </div>
            </template>
          </register-contents>

          <register-contents
            title="운영 여부"
            required
          >
            <template>
              <div class="input-form">
                <el-radio-group>
                  <el-radio
                    :label="true"
                  >
                    운영함
                  </el-radio>
                  <el-radio
                    style="margin-left: 10px;"
                    :label="false"
                  >
                    운영안함
                  </el-radio>
                </el-radio-group>
              </div>
            </template>
          </register-contents>
          <!-- 운영 여부 -->
        </div>
      </section>

      <!-- <section class="modal-footer"> -->
      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
        >
          취소
        </button>
        <button
          class="button -modal-button"
          type="is-primary"
          v-loading="isCreateImageRequest"
        >
          확인
        </button>
      </div>
    <!-- </section> -->
    </el-dialog>
  </div>
</template>
<script>

export default {
  name: 'NutanixCentralImage',
  components: {
  },
  created () {
    console.log('@@ central image created ')
  },
  mounted () {
  },
  methods: {
    gridInit (a) {
      console.log(a)
    },
    rowSelect (row) {
      console.log(row)
    }
  },
  data () {
    return {
      totalResultCnt: 0,
      imageList: [],
      isGetCentralImageRequest: false,
      imageListColumns: [
        { header: 'Name', binding: 'imageName', width: 100 },
        { header: 'Description', binding: 'imageDesc', width: 100 },
        { header: 'Type', binding: 'imageType', width: 100 },
        { header: 'Size', binding: 'sizeBytes', width: 100 }
      ],
      newImageModal: false,
      isCreateImageRequest: false
    }
  }
}
</script>
<style lang="scss">
  .nutanix-central-image {
    // 모달
    .new-item-modal2 {
      .modal-body {
        .edit-list {
          border-top: 1px solid $border-color;
          & + .edit-list { margin-top: $gap-m;}
        }
        .register-contents {
          .contents-title {
            min-width: 200px;
          }
        }
        .input-form {
          display: flex;
          align-items: center;
          position: relative;
          & + .input-form {
            margin-top: 5px;
          }
          // max-width: 500px;
          > .el-radio-group {
            display: flex;
            align-items: center;
          }
        }
      }
    }
  }
</style>
