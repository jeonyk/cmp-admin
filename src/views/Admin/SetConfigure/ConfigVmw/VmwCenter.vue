<!--
  * 파일명 : vCenter.vue
  * 파일 기능 : 뉴타닉스 vcenter 리스트 노출 및 관리(테스트, 추가, 변경, 삭제)
  * 작성자 : 이유준
  * 최종 작성일 : 2022-09-22
  * License By Shinsegae I&C
 -->

<template>
  <div class="nutanix-central">
    <section class="table-top-wrap">
      <total-count :total-count="totalResultCnt" />
      <div class="button-area -right">
        <button
          class="button"
          :disabled="gridLoading || (!selectedRow || selectedRow.isSync === false)"
          @click="handleClickRunSyncVcenter"
          type="is-anti"
        >
          <!-- 동기화 -->
          {{ $t('common.BTN.ADMIN.sync') }}
        </button>
        <span class="divider" />
        <button
          class="button"
          type="is-primary"
          @click="handleClickOpenAddModal"
        >
          <!-- vCenter 추가 -->
          {{ $v('항목 추가') }}
        </button>
        <button
          class="button"
          :disabled="!selectedRow"
          @click="handleClickOpenUpdateModal(selectedRow)"
        >
          <!-- 변경 -->
          {{ $t('common.BTN.change') }}
        </button>
        <button
          class="button"
          :disabled="!selectedRow"
          type="is-anti"
          @click="handleClickDeleteVcnter(selectedRow)"
        >
          <!-- 삭제 -->
          {{ $t('common.BTN.delete') }}
        </button>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        v-loading="gridLoading"
        :item-source.sync="itemSourceVcenterList"
        :columns="columns"
        selectable
        :init-custom-action="init"
        :init-auto-select-row="selectedRow"
        init-auto-select-row-key="idx"
        :sort-keeping="sortedCol"
        page-keeping
        :column-data-map="columnDataMap"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template #syncInterval="props">
          {{ props.row.syncInterval }}분
        </template>

        <template #isManage="props">
          <div style="text-align: center;">
            <span
              v-if="props.row.isManage"
              class="state-icon success"
            />
            <span
              v-else-if="!props.row.isManage"
              class="state-icon error"
            />
            <span
              v-else
              class="state-icon"
            />
          </div>
        </template>
        <!-- 운영 여부 -->

        <template
          #connectedESXiList="props"
        >
          <div v-if="props.row.connectedESXiList != null">
            <el-tooltip
              placement="bottom-end"
              popper-class="panel-title-popper"
              effect="light"
              v-if="props.row.connectedESXiList.length > 1"
            >
              <template #content>
                <div
                  v-for="(exit,index) in props.row.connectedESXiList"
                  :key="exit.name + index"
                >
                  {{ exit.name }}
                </div>
              </template>
              <span>{{ props.row.connectedESXiList[0].name }} 외
                {{ props.row.connectedESXiList.length - 1 }}
              </span>
            </el-tooltip>

            <span v-else>{{ props.row.connectedESXiList[0].name }}</span>

            {{ props.connectedESXiList }}
          </div>
        </template>
        <!-- 연결 Element -->

        <template #isSync="props">
          <!-- IN_PROGRESS 동기화중, SUCCESS 성공, FAIL 실패 -->
          <div
            v-if="props.row.isSync !== undefined"
            class="cell-flex-wrap"
          >
            <cmp-status-tag
              v-if="props.row.isSync === 'IN_PROGRESS'"
              type="is-loading"
            >
              <i class="el-icon-loading" />
              <span style="padding: 0 10px;">{{ $t('common.syncing') }}</span>
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
      <vmw-center-cluster />
    </section>
    <!-- CLUSTER 임계치 설정 -->

    <vmw-image-manage />

    <!-- 모달 -->
    <!-- 항목 생성 모달 -->
    <el-dialog
      :title="showModal.type === 'create' ? $t('common.TERMS.itemAdd') : $t('common.TERMS.itemChange')"
      :visible.sync="showModal.view"
      class="new-item-modal"
      width="840px"
      @close="showModal.view = false"
    >
      <section
        :element-loading-text="$t('common.PLACEHOLDER.testPossibility')"
      >
        <article class="modal-body">
          <div
            class="edit-list"
          >
            <register-contents
              :title="$t('admin.PREF.authInfo')"
              required
            >
              <div class="input-form">
                <span style="min-width: 100px;">{{ $t('admin.PREF.userName') }}: </span>
                <el-input
                  :placeholder="$t('admin.PREF.userName')"
                  v-model="newItem.id"
                  :disabled="testPassed"
                />
              </div>
              <div class="input-form">
                <span style="min-width: 100px;">{{ $t('admin.PREF.userPw') }}: </span>
                <el-input
                  v-if="showModal.type === 'create' || otp"
                  :placeholder="$t('admin.PREF.userPw')"
                  v-model="newItem.updateConnectPassword"
                  show-password
                  :disabled="testPassed"
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
                v-model="newItem.url"
                :disabled="testPassed"
              />
            </register-contents>
            <!-- URL -->
            <span
              v-if="testPassed || isConnecting"
              :class="['block-before-test', { 'is-connecting':isConnecting }]"
            >
              <!-- 테스트가 완료되었습니다. -->
              {{ !isConnecting ? $v('연결 테스트에 성공하였습니다.') : '' }}
            </span>
          </div>
          <button
            :class="['test-btn','button', {'confirm' : testPassed }]"
            @click="handleClickToConnectionTest(showModal.type)"
            :type="testPassed ? 'is-success' : 'is-primary'"
            :disabled="(testPassed || isConnecting || !newItem.id || !newItem.updateConnectPassword || !newItem.url)? true : false"
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
            {{ testPassed?$v('연결 테스트 성공'):$v('연결 테스트') }}
          </button>

          <div
            v-loading="isConnecting"
            :element-loading-text="$t('common.PLACEHOLDER.testPossibility')"
            class="edit-list --body"
            v-if="(testPassed || showModal.type !== 'create') && showModal.view"
          >
            <register-contents
              :title="$v('vCenter 이름')"
              required
            >
              <el-input
                placeholder="vCenter"
                v-model="newItem.name"
                :disabled="!testPassed"
              />
            </register-contents>
            <!-- vCenter 이름 -->
            <register-contents
              :title="$t('common.GRID.NUTA.interval')"
              required
            >
              <el-input-number
                v-model="newItem.syncInterval"
                :min="intervalMin"
                :disabled="!testPassed"
              />
            </register-contents>

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
            <div
              class="form-host-sync"
              v-if="showModal.type==='create'"
            >
              <span class="form-host-sync-caption">{{ $v('아래 정보는 연결되어 있는 호스트(Host)와 동기화 됩니다.') }}</span>
              <div class="edit-list">
                <register-contents
                  :title="$t('common.GRID.COMPUTE.networkOrg')"
                  class="network-org-contents"
                  required
                >
                  <network-category-selection
                    class="selection"
                    :cate-limit="1"
                    @data="saveNetworkOrg"
                    :cate-lists="newItem.networkGroup"
                    :disabled="!testPassed"
                  />
                </register-contents>
                <!-- 네트워크 조직 -->
                <register-contents
                  required
                  v-for="values in TESTobj"
                  :title="`${$v(values.groupName)} (%)`"
                  :key="values.groupName"
                >
                  <div
                    v-for="item in values.children"
                    class="input-form -threshold"
                    :class="{'--one-option': values.children.length <= 1}"
                    :key="item.key"
                  >
                    <div>
                      {{ $v(item.label) }} : <!-- 1차 임계치, 2차 임계치 -->
                      <el-input-number
                        v-model="item.value"
                        :min="0"
                      />
                      <span style="margin-left: 5px">%</span>
                    </div>
                  </div>
                </register-contents>
              </div>
            </div>
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
            @click="handleClickCloseModal"
          >
            <!-- 취소 -->
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button -modal-button"
            @click="handleClickUpdateVCenter(newItem)"
            type="is-primary"
            :disabled="!testPassed || isConnecting"
          >
            <!-- 확인 -->
            {{ $t('common.BTN.confirm') }}
          </button>
        </div>
      </section>
      <!--         :callback-api="checkTheVcenterOTP" -->
      <otp-modal
        :active="otpModalActive"
        @close="otpModalActive = false"
        @validated-otp="validatedOTP"
        :required-api="true"
        :callback-api="checkTheVcenterOTP"
      />
    </el-dialog>
  </div>
</template>

<script src="./VmwCenter.script.js"></script>

<style lang="scss">
  .nutanix-central {
    // 모달
    .new-item-modal {
      .modal-body {
        .edit-list {
          &.--body {
            max-height: 500px;
            overflow-y: scroll;
          }
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
          > .button {
            width: 100%;
          }
          // max-width: 500px;
          > .el-radio-group {
            display: flex;
            align-items: center;
          }

          &.-threshold {
            // border: 1px solid red;
            justify-content: flex-start;
            align-items: flex-start;
            flex-direction: column;
            > div:first-child { margin-bottom: $gap-s; }
          }

          &.-network-org {
            position: relative;
            padding-right: 60px;
            .add-item {
              position: absolute;
              top: 50%;
              right: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 45px;
              transform: translateY(-50%);
              > .icon-button {
                color: $primary;
              }
            }
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
.form-host-sync {
  margin-top: 20px;

  .form-host-sync-caption {
    color: $gray;
    font-size: 12px;
    line-height: 22px;
  }
}
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
