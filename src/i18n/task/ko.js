export default {
  // 사전협의
  PRIOR: {
    title: '사전협의',
    process: '처리 상태',
    viewTicket: '티켓으로 보기',
    viewList: '목록으로 보기',
    try: '시도',
    // 티켓
    TICKET: {
      startDate: '협의 시작일',
      cStartDate: '협의 시작일'
    },
    // 목록(그리드)
    GRID: {
      depart: '부서',
      endDate: '완료 희망일',
      state: '협의 상태',
      order: '순번'
    },
    // 상세 페이지
    DETAIL: {
      title: '업무요청제목',
      drafter: '기안자',
      content: '사전 협의 내용',
      selectOrder: '주문번호 선택',
      selectOrderP: '주문번호를 선택하세요.',
      check: '확인 사항',
      memoList: '메모 이력',
      message: '작업된 내용은 모두 롤백되며 <br> 해당 주문과 티켓은 종료됩니다.',
      emptyOrder: '주문번호에 해당하는 내역이 없습니다.',
      actionMessage: '실패 건은 사용자에게 공지됩니다.',
      noResult: '일치하는 결과가 없습니다.',
      searchApproval: '결재자를 검색하세요.',
      createCommonProject: '{projectType} 생성 신청을<br>{state} 하시겠습니까?'
    },
    // 조직도 모달
    MEM: {
      title: '조직도',
      tit1: '최근 사용한 결재자',
      tit2: '부서명',
      tit3: '결재자명',
      tit4: '결재목록'
    }
  },
  // 할일
  TODO: {
    progress: '업무 진행률',
    requester: '요청자',
    beDeleted: '삭제 예정',
    unDelete: '삭제 취소',
    forceDelete: '바로 삭제',
    waitWork: '작업 대기',
    working: '작업중',
    noMemo: '등록된 메모가 없습니다.',
    // 상세 페이지
    DETAIL: {
      endDate: '완료희망일',
      delivery: '프로젝트 제공 예정일',
      business: '사업부',
      reply: '답글 달기',
      writeNote: '메모 쓰기',
      deleteNote: '메모 삭제',
      note: '메모',
      comment: '댓글',
      enterFail: '실패 사유를 입력해주세요.',
      finishedComplete: '작업이 완료되었습니다. <br> 한 일로 이동하시겠습니까? <br> 취소 시 할 일 목록으로 이동합니다.',
      errorComplete: '작업을 완료하는 도중 문제가 발생하였습니다. <br> 관리자에게 문의해주세요.',
      errorSave: '작업을 변경하는 도중 문제가 발생하였습니다. <br> 관리자에게 문의해주세요.'
    }
  },
  // 결재함
  PAY: {
    final: '최종작업상태',
    confirm: '결재확인',
    draft: '기안일',
    filter: '필터',
    title: '결재',
    agree: '합의',
    myApprvBox: '내가 올린 결재함',
    waitApprvBox: '결재 대기함',
    processingApprvBox: '결재 진행함',
    doneApprvBox: '결재 완료함',
    rejectApprvBox: '결재 반려함',

    // 상세 페이지
    DETAIL: {
      type: '결재 유형',
      info: '결재 정보',
      line: '결재선',
      date: '결재일시',
      approver: '결재자',
      box: '결재함',
      assign: '배정일시',
      shelf: '보존년한',
      reasonRequest: '신청 사유',
      depart: '신청부서',
      subject: '요청 제목',
      confirmDate: '확인일시'
    }
  },
  // 업무 상태
  STATE: {
    wait: '대기',
    unde: '미정',
    reject: '반려',
    fail: '실패',
    complete: '완료',
    delay: '지연',
    progress: '처리중',
    confirm: '확인',
    error: '오류',
    request: '요청'
  },
  USR: {
    cart: '장바구니',
    orderBasket: '주문함'
  },
  ALERT: {
    '001': '주문을 선택해주세요',
    '002': '해당 티켓이 존재하지 않습니다.',
    '003': '작업을 실패했습니다',
    '004': '해당 주문이 존재하지 않습니다. <br> 목록으로 이동합니다',
    '005': '티켓을 찾을 수 없습니다',
    '006': '승인처리 되었습니다',
    '007': '다운로드를 시작합니다.<br>파일은 분리되어 다운로드 됩니다.',
    '008': '다운로드를 시작합니다. <br>현재 보고계신 페이지만 다운로드 됩니다.'
  }
}
