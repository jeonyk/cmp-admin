<!--
  * 파일명 : NutanixCentral.vue
  * 파일 기능 : 뉴타닉스 Central 리스트 노출 및 관리(테스트, 추가, 변경, 삭제)
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-02-22
  * License By Shinsegae I&C
  * 2021-02-22 Update: sorting 기능 유지 > Nutanix Central / Element / Era 모두 적용 및 destroy 시 interval 제거
 -->

<template>
  <div class="nutanix-central">
    <section class="table-top-wrap">
      <total-count :total-count="totalResultCnt" />

      <div class="button-area -right">
        <button
          class="button"
          :disabled="!selectedRow || selectedRow.isSync == -1"
          @click="activeSync"
          type="is-anti"
        >
          <!-- 동기화 -->
          {{ $t('common.BTN.ADMIN.sync') }}
        </button>
        <span class="divider" />
        <button
          class="button"
          type="is-primary"
          @click="addModalOpen"
        >
          <!-- 항목 추가 -->
          {{ $t('common.BTN.addItem') }}
        </button>
        <button
          class="button"
          :disabled="!selectedRow"
          @click="updateModalOpen(selectedRow)"
        >
          {{ $v('변경') }}
        </button>
        <button
          class="button"
          @click="applyRemove"
          :disabled="!selectedRow"
          type="is-anti"
        >
          {{ $v('삭제') }}
        </button>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        v-loading="gridLoading"
        :item-source.sync="computedTableData"
        :columns="columns"
        selectable
        :init-custom-action="init"
        :init-auto-select-row="selectedRow"
        init-auto-select-row-key="centralIdx"
        :sort-keeping="sortedCol"
        page-keeping
        :column-data-map="columnDataMap"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template #intervalMin="props">
          <span v-if="props.row.intervalMin">{{ props.row.intervalMin }} {{ $t('common.TERMS.minute') }}</span>
          <span v-else />
        </template>
        <!-- /.인터벌 주기(분) -->

        <template #isManage="props">
          <div style="text-align: center;">
            <span
              v-if="props.row.isManage && props.row.isConnected"
              class="state-icon success"
            />
            <span
              v-else-if="props.row.isManage && !props.row.isConnected"
              class="state-icon error"
            />
            <span
              v-else
              class="state-icon"
            />
          </div>
        </template>
        <!-- 운영 여부 -->

        <template #centralClusterFirstEl="props">
          <div v-if="props.row.elements != null">
            <el-tooltip
              placement="bottom-end"
              popper-class="panel-title-popper"
              effect="light"
              v-if="props.row.elements.length > 1"
            >
              <template #content>
                <div
                  v-for="cluster in props.row.elements"
                  :key="cluster.elementIdx"
                >
                  {{ cluster.elementName }}
                </div>
              </template>
              <span>{{ props.row.elements[0].elementName }} 외
                {{ props.row.elements.length - 1 }}
              </span>
            </el-tooltip>

            <span v-else>{{ props.row.elements[0].elementName }}</span>

            {{ props.row.centralClusterFirstEl }}
          </div>
        </template>
        <!-- 연결 Element -->

        <template #isSync="props">
          <!-- -1 동기화중, 1 성공, 0 실패 -->
          <div
            v-if="props.row.isSync !== undefined"
            class="cell-flex-wrap"
          >
            <cmp-status-tag
              v-if="props.row.isSync === -1"
              type="is-loading"
            >
              <i class="el-icon-loading" />
              <span>{{ $t('common.syncing') }}</span>
            </cmp-status-tag>

            <cmp-status-tag
              v-else
              :type="syncStatus(props.row.isSync).type"
              :contents="syncStatus(props.row.isSync).contents"
            />
          </div>
        </template>
        <template #isCalm="props">
          <span>{{ props.row.isCalm ? 'Y' : 'N' }}</span>
        </template>
        <!-- 마켓플레이스 사용 가능 여부 -->
      </cmp-grid>
    </section>

    <section class="central-image-list-area">
      <nutanix-central-image-list
        :central-list="tableData"
        v-if="tableData.length > 0"
      />
    </section>

    <!-- 모달 -->
    <!-- 항목 생성 모달 -->
    <el-dialog
      :title="showModal.type === 'create' ? $t('common.TERMS.itemAdd') : $t('common.TERMS.itemChange')"
      :visible.sync="showModal.view"
      class="new-item-modal"
      width="840px"
      @close="showModal.view = false"
    >
      <section>
        <article class="modal-body">
          <div class="edit-list">
            <register-contents
              :title="$t('admin.PREF.authInfo')"
              required
            >
              <div class="input-form">
                <span style="min-width: 100px;">{{ $t('admin.PREF.userName') }}: </span>
                <el-input
                  :placeholder="$t('admin.PREF.userName')"
                  v-model.trim="newItem.connectUsername"
                  :disabled="testPassed"
                />
              </div>
              <div class="input-form">
                <span style="min-width: 100px;">{{ $t('admin.PREF.userPw') }}: </span>
                <el-input
                  v-if="showModal.type === 'create' || otp"
                  :placeholder="$t('admin.PREF.userPw')"
                  v-model.trim="newItem.updateConnectPassword"
                  :disabled="testPassed"
                  show-password
                  ref="otpPasswordInput"
                />
                <button
                  v-else
                  @click="otpModalActive = !otpModalActive"
                  type="is-primary"
                  class="button -confirm"
                >
                  <!-- 비밀번호 보기 -->
                  {{ $t('common.BTN.viewPw') }}
                </button>
              </div>
            </register-contents>
            <!-- 인증 정보 -->

            <register-contents
              title="URL"
              required
            >
              <el-input
                :placeholder="$t('admin.PREF.enterUrl')"
                v-model.trim="newItem.connectUrl"
                :disabled="testPassed"
              />
            </register-contents>
            <!-- URL -->

            <span
              v-if="testPassed || isConnecting"
              :class="['block-before-test', { 'is-connecting':isConnecting }]"
            >
              {{ !isConnecting ? $v('연결 테스트에 성공하였습니다.') : '' }}
            </span>
            <!-- /. 테스트 완료 문구 -->
          </div>

          <button
            :class="['test-btn', 'button', { 'confirm' : testPassed }]"
            @click="activeTest(showModal.type)"
            :type="testPassed ? 'is-success' : 'is-primary'"
            :disabled="(testPassed || isConnecting || !newItem.connectUsername || !newItem.updateConnectPassword || !newItem.connectUrl)? true : false"
          >
            <i class="icon">
              <i
                v-if="isConnecting"
                class="el-icon-loading"
              />
              <check-icon
                v-if="testPassed"
                class="check-icon"
              />
            </i>
            <!-- 테스트 (테스트 전 / 실패시) -->
            {{ testPassed?'Connected':'Test Connection' }}
          </button>
          <!-- 테스트 -->

          <!-- ------ -->
          <!-- ------ -->
          <!-- ------ -->

          <div
            class="edit-list"
            v-loading="isConnecting"
            :element-loading-text="$t('common.PLACEHOLDER.testPossibility')"
            v-if="(testPassed || showModal.type !== 'create') && showModal.view"
          >
            <register-contents
              :title="$t('common.GRID.NUTA.prismCentralName')"
              required
            >
              <el-input
                placeholder="Prism-Central"
                v-model="newItem.centralName"
                :disabled="!testPassed"
              />
            </register-contents>
            <!-- Prism-Central 이름 -->

            <register-contents
              :title="$t('common.GRID.NUTA.interval')"
              required
            >
              <el-input-number
                v-model="newItem.connectInterval"
                :min="intervalMin"
                :disabled="!testPassed"
              />
            </register-contents>

            <register-contents
              v-if="packageType === 'ENT'"
              :title="$t('common.GRID.NUTA.isMarket')"
              required
            >
              <div class="input-form">
                <el-radio-group
                  v-model="newItem.isCalm"
                  :disabled="!testPassed"
                >
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
            </register-contents>
            <!-- 마켓플레이스 사용 가능 여부 -->

            <register-contents
              :title="$t('admin.PREF.isOper')"
              required
            >
              <div class="input-form">
                <el-radio-group
                  v-model="newItem.isManage"
                  :disabled="!testPassed"
                >
                  <el-radio :label="true">
                    {{ $t('admin.PREF.oper') }}
                  </el-radio>
                  <el-radio
                    style="margin-left: 10px;"
                    :label="false"
                  >
                    {{ $t('admin.PREF.noOper') }}
                  </el-radio>
                </el-radio-group>
              </div>
            </register-contents>
            <!-- 운영 여부 -->

            <span
              v-if="!testPassed"
              class="block-before-test"
            >
              <!-- 테스트를 먼저 진행해주세요. -->
              {{ !isConnecting ? $t('admin.PREF.proceedTest') : '' }}
            </span>
          </div>
        </article>

        <div class="modal-footer modal-button-area">
          <button
            class="button -modal-button"
            type="is-anti"
            @click="closeModal"
          >
            {{ $v('취소') }}
          </button>
          <button
            class="button -modal-button"
            @click="confirmUpdateItem(newItem)"
            type="is-primary"
            :disabled="!testPassed || isConnecting"
          >
            {{ $v('확인') }}
          </button>
        </div>
      </section>

      <otp-modal
        api-call-component-name="NutanixCentral"
        required-api
        :ntx-idx="newItem.centralIdx"
        :callback-api="callbackApi"
        :active="otpModalActive"
        @close="otpModalActive = false"
        @validated-otp="validatedOTP"
      />
    </el-dialog>
  </div>
</template>

<script src="./NutanixCentral.script.js"></script>

<style lang="scss">
  .nutanix-central {
    // 모달
    .new-item-modal {
      .modal-body {
        .edit-list {
          border-top: 1px solid $border-color;
          position: relative;
          & + .edit-list { margin-top: $gap-m;}

          .block-before-test {
            background: rgba(0, 0, 0, 0.8);
            position: absolute;
            top: 0; left: 0; bottom: 0; right: 0;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            color: $light-gray;
            transition: background 0.2s ease-in-out;
            &.is-connecting {
              background: rgba(0, 0, 0, 0.2);
            }
          }
        }
        .register-contents {
          .contents-title {
            min-width: 200px !important;
          }
        }
        .input-form {
          display: flex;
          align-items: center;
          position: relative;
          & + .input-form {
            margin-top: 5px;
          }
          > .button {
            width: 100%;
          }
          // max-width: 500px;
          > .el-radio-group {
            display: flex;
            align-items: center;
          }
        }
      }
    }

    .central-image-list-area {
      margin-top: 100px;
    }
  }
</style>
<style lang="scss" scoped>
.test-btn {
   width: 100%;
   margin-top:4px;
   margin-bottom: 20px;
   display: flex;
   align-items: center;
   justify-content: center;

     &.confirm {
       background-color: $success;
       &:disabled {
         background: $success;
         opacity: 1;
       }
     }
   .icon {
     margin-right: 4px;
     display: flex;
     align-items: center;
     justify-content: center;
     width: 15px;
     height: 15px;
     .check-icon {
       height: 12px;
     }
   }
 }
</style>
