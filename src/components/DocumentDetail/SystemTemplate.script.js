export default {
  computed: {
    /**
     * 우측 시스템 템플릿 가공
     */
    systemTemplates () {
      const { cloudType } = this.$route.query

      return [...this.rawSystemTemplates.default, ...this.rawSystemTemplates[cloudType]]
    },
    /**
     * 해당 Mixins 를 [사전협의/할일 보고서 작성][워크플로우 > 템플릿 등록] 시에 사용하므로 구분해주기 위함
     */
    isWorkDocument () {
      const { name } = this.$route
      return name === 'task-document'
    }
  },
  /**
   * [필독]
   *  - 시스템 템플릿에 데이터를 바인딩 해야하는경우
   *    data-table="wrapper"          : <table ...></table> 태그에 사용합니다.
   *    data-body="{info}-{colName}"  : <tbody ...></tbody> 태그에 사용합니다.
   *    data-label="data-label"       : <td ...></td> 태그에 데이터 header가 있는경우 사용합니다.
   *    data-key="{key}"              : <td ...></td> 태그에 데이터 키가 있는경우 사용합니다.
   *    {{ data-key }}                : <td ...>{{ data-key }}</td> 태그에 데이터 키가 있는경우 값을 연결해주는데 사용합니다.
   *
   *  - 위 데이터가 없는경우는 템플릿이 아니라는 의미
   */
  data: (root) => ({
    dataKey: /{{ (.*?) }}/,

    /**
     * Divider - 좌/우 컨텐츠 나눠진 경우 사용
     * [자원정보], [주문정보] 에 사용됨
     * @param {String} info 컬럼 관련 설정을 위한 정보
     * @param {String} colName 컬럼 이름
     * @param {String} tableType 테이블 타입
     * @param {Boolean} useTitle 타이틀 삽입 여부
     */
    orderTemplate ({ info, colName, tableType }, useTitle = true) {
      const information = this[info] // ___Info 를 이용해 하드코딩된 컬럼 데이터를 가져옵니다.
      if (!information) return // 없음말구~

      const { title, column } = information[colName]
      const width = `${(100 / 4)}%`

      const options = this.setTableOption(width, { info, colName, tableType })
      const { trStyle, dataWrapper, dataBody } = options

      // 데이터 세팅
      const { columns, raw } = this.columnsTemplate(column, options)
      const { td } = raw

      // 🍋 key-value 찾아서 연결
      const setKey = (value) => {
        return td.map(tr => {
          const labels = tr.map(t => {
            // console.log(key, row[key])
            const key = t.match(this.dataKey)[1]
            return t.replace(this.dataKey, value[key] || '-')
          })

          return `<tr style="${trStyle}">${labels.join('')}</tr>`
        })
      }

      let table // 테이블 세팅 시작

      // [사전협의/할일 보고서 작성] :: 자원의 개수에 맞게 key - value를 연결해주고, 자원 개수에 맞게 table 여러개 생성ㅠㅠ
      if (this.isWorkDocument) {
        const sources = this.getKeys({ info, service: colName, columns: information[colName] })

        // 1️⃣ 자원 정보가 1개 이상이라면 ...
        if (sources) {
          const tables = sources.map(row => {
            const trs = setKey(row)

            const result = trs.join('')
            return this.tableWrapper(result)
          })

          table = tables.join('') // 자원 개수만큼 table 생성

        // 2️⃣ 자원 정보가 하나도 없다면 ... '-' 표기
        } else {
          const trs = setKey({})

          const result = trs.join('')
          table = this.tableWrapper(result)
        }

      // 3️⃣ [워크플로우 > 템플릿 등록] :: 기본 키 연결을 위한 <table><tbody><td><tr> 태그
      } else {
        table = this.tableWrapper(columns, { dataWrapper, dataBody })
      }

      const setTitle = useTitle ? `<h3>${title}</h3>` : ''

      return `
        ${setTitle}
        ${table}
      `
    },

    /**
     * 시스템 템플릿의 각 [할당 정보] 가공
     * width 는 모두 같은 비율임
     * @param {String} info 컬럼 관련 설정을 위한 정보
     * @param {String} colName 컬럼 이름
     * @param {String} tableType 테이블 타입
     * @param {Boolean} useTitle 타이틀 삽입 여부
     */
    setTemplateTableFormat ({ info, colName, tableType }, useTitle = true) {
      const information = this[info] // ___Info 를 이용해 하드코딩된 컬럼 데이터를 가져옵니다.
      if (!information) return // 없음말구~

      const { title, column } = information[colName]

      const options = this.setTableOption('150px', { info, colName, tableType })
      const { theadStyle, trStyle, dataWrapper, dataBody } = options

      const { rows: defaultRows, raw } = this.rowsTemplate(column, options)
      const { thead, td } = raw
      // console.log(head, defaultRows)

      // 3️⃣ [워크플로우 > 템플릿 등록] :: 기본 키 연결을 위한 <table><tbody><td><tr> 태그
      let rows = defaultRows // (기본)
      let opt = { dataWrapper, dataBody }

      // 🍋 key-value 찾아서 연결
      const setKey = (value) => {
        const tds = td.map(t => {
          // console.log(key, row[key])
          const key = t.match(this.dataKey)[1]
          return t.replace(this.dataKey, value[key] || '-')
        })

        return `<tr style="${trStyle}">${tds.join('')}</tr>`
      }

      // [사전협의/할일 보고서 작성] :: 자원의 개수에 맞게 key - value를 연결해줌
      if (this.isWorkDocument) {
        const sources = this.getKeys({ info, service: colName, columns: information[colName] })
        opt = {}

        // 1️⃣ 자원 정보가 1개 이상이라면 ...
        if (sources) {
          const trs = sources.map(row => setKey(row))
          rows = trs.join('')

        // 2️⃣ 자원 정보가 하나도 없다면 ... '-' 표기
        } else {
          rows = setKey({})
        }
      }

      const headTr = `<tr style="${theadStyle}"> ${thead.join('')} </tr>`
      const result = headTr + rows
      const table = this.tableWrapper(result, opt)

      const setTitle = useTitle ? `<h3>${title}</h3>` : ''

      return `
        ${setTitle}
        ${table}
      `
    },

    /**
     * 시스템 템플릿의 각 [결재 정보] 가공 (column 병합 등 조건 있음)
     * @param {String} info 컬럼 관련 설정을 위한 정보
     * @param {String} colName 컬럼 이름
     * @param {String} tableType 테이블 타입
     * @param {Boolean} useTitle 타이틀 삽입 여부
     */
    setNoLimitTable ({ info, colName, tableType }, useTitle = true) {
      const information = this[info] // ___Info 를 이용해 하드코딩된 컬럼 데이터를 가져옵니다.
      if (!information) return // 없음말구~

      const { title, column } = information[colName]

      const options = this.setTableOption('150px', { info, colName, tableType })
      const { dataWrapper, dataBody } = options

      // 데이터 세팅
      const { columns, raw } = this.multiColumnsTemplate(column, options)
      const { tr } = raw

      // 🍋 key-value 찾아서 연결
      const setKey = (value) => {
        return tr.map(td => {
          const raw = td.match(/(.*?)<\/td>/gs) // td 단위로 끊기

          const tds = raw.map(t => {
            const data = t.match(this.dataKey)
            if (!data) return t

            const key = data[1]
            return t.replace(this.dataKey, value[key] || '-') // .replace(/{{\s{2,}.*?\s{2,}}}/g, '-') // 공백까지 제거
          }).join('')

          // console.log(tds)

          return `<tr>${tds}</tr>`
        })
      }

      // 3️⃣ [워크플로우 > 템플릿 등록] :: 기본 키 연결을 위한 <table><tbody><td><tr> 태그
      let table = this.tableWrapper(columns, { dataWrapper, dataBody })

      // [사전협의/할일 보고서 작성] :: 자원의 개수에 맞게 key - value를 연결해줌
      if (this.isWorkDocument) {
        const sources = this.getKeys({ info, service: colName, columns: information[colName] })

        // 1️⃣ 자원 정보가 1개 이상이라면 ...
        if (sources) {
          const row = sources[0] // 어차피 하나임
          const result = setKey(row).join('')
          table = this.tableWrapper(result)

        // 2️⃣ 자원 정보가 하나도 없다면 ... '-' 표기
        } else {
          const result = setKey({}).join('')
          table = this.tableWrapper(result)
        }
      }

      const setTitle = useTitle ? `<h2>${title}</h2>` : ''

      return `
        ${setTitle}
        ${table}
      `
    },

    /**
     * 시스템 템플릿의 각 [결재 정보] 가공 (column 병합 등 조건 있음)
     * @param {String} info 컬럼 관련 설정을 위한 정보
     * @param {String} colName 컬럼 이름
     * @param {String} tableType 테이블 타입
     * @param {Boolean} useTitle 타이틀 삽입 여부
     */
    tgwOnlyTable ({ info, colName, tableType }, useTitle = true) {
      const information = this[info] // ___Info 를 이용해 하드코딩된 컬럼 데이터를 가져옵니다.
      if (!information) return // 없음말구~

      const { title, rowColumn, spanHeaders, spanColumn, additionalColumn } = information[colName]
      const options = this.setTableOption('150px', { info, colName, tableType })
      const { dataWrapper, dataBody } = options

      // 3️⃣ [워크플로우 > 템플릿 등록] :: 기본 키 연결을 위한 <table><tbody><td><tr> 태그
      // 가장 상단 표
      const { columns, raw: raw01 } = this.columnsTemplate(rowColumn, options)
      const { td: td01 } = raw01
      let rowTable = this.tableWrapper(columns, { dataWrapper, dataBody }) // rowTable

      // 중간 표
      const { head: colspanHead } = this.spanHeaderTemplate(spanHeaders, options)
      const { head, rows, raw: raw02 } = this.rowsTemplate(spanColumn, options)
      const { td: td02 } = raw02

      let colRows = colspanHead + head + rows
      let spanTable = this.tableWrapper(colRows, { dataWrapper, dataBody }) // spanTable

      // 있을수도 있고 없을 수도 있는 표
      const { columns: additionalCols, raw: raw03 = {} } = this.columnsTemplate(additionalColumn, options)
      const { td: td03 } = raw03
      let additionalTable = this.tableWrapper(additionalCols, { dataWrapper, dataBody }) // additionalTable

      let content = `
        <div data-body="TGW-ONLY">
          ${rowTable}
          ${spanTable}
          ${additionalColumn ? additionalTable : ''}
        </div>
      `

      // [사전협의/할일 보고서 작성] :: 자원의 개수에 맞게 key - value를 연결해주고, 자원 개수에 맞게 table 여러개 생성ㅠㅠ
      if (this.isWorkDocument) {
        const sources = this.getKeys({ info, service: colName, columns: information[colName] })

        // 총 구성 요소 :: tables01(rowTable), tables02(spanTable), tables03(additionalTable)
        // 1️⃣ 자원 정보가 1개 이상이라면 ...
        if (sources) {
          // 자원정보만큼 반복 반복
          const contents = sources.map(row => {
            const trs01 = this.setKeyRow({ value: row, target: td01, options }).join('')
            const rowTable = this.tableWrapper(trs01) // rowTable

            const trs02 = this.setKeySpan({ value: row, target: td02, options })
            colRows = colspanHead + head + trs02
            const spanTable = this.tableWrapper(colRows) // spanTable

            const trs03 = td03 ? this.setKeyRow({ value: row, target: td03, options }).join('') : undefined
            additionalTable = this.tableWrapper(trs03) // additionalTable

            return `
              <div data-body="TGW-ONLY">
                ${rowTable}
                ${spanTable}
                ${additionalColumn ? additionalTable : ''}
              </div>
              ﹣
              <br>
            `
          })

          // console.log(contents)
          content = contents.join('')

        // 2️⃣ 자원 정보가 하나도 없다면 ... '-' 표기
        } else {
          const trs01 = this.setKeyRow({ value: {}, target: td01, options }).join('')
          rowTable = this.tableWrapper(trs01) // rowTable

          const trs02 = this.setKeySpan({ value: {}, target: td02, options })
          colRows = colspanHead + head + trs02
          spanTable = this.tableWrapper(colRows) // spanTable

          const trs03 = td03 ? this.setKeyRow({ value: {}, target: td03, options }).join('') : undefined
          additionalTable = this.tableWrapper(trs03) // additionalTable

          content = `
            <div data-body="TGW-ONLY">
              ${rowTable}
              ${spanTable}
              ${additionalColumn ? additionalTable : ''}
            </div>
          `
        }
      }

      const setTitle = useTitle ? `<h3>${title}</h3>` : ''

      return `
        ${setTitle}
        ${content}
      `
    },

    /**
     * Row Table 을 위한 key-value 바인딩 함수
     * @param { Object } value
     * @param { Array } target td를 만들기 위한 Array
     * @param { Object } options table 의 옵션 정보
     * @return { String }
     */
    setKeyRow ({ value, target, options }) {
      const { trStyle } = options
      return target.map(tr => {
        const labels = tr.map(t => {
          // console.log(key, value[key])
          const key = t.match(this.dataKey)[1]
          return t.replace(this.dataKey, value[key] || '-')
        })

        return `<tr style="${trStyle}">${labels.join('')}</tr>`
      })
    },

    /**
     * Span Table 을 위한 key-value 바인딩 함수
     * @param { Object } value
     * @param { Array } tds td를 만들기 위한 Array
     * @param { Object } options table 의 옵션 정보
     * @return { String }
     */
    setKeySpan ({ value, target, options }) {
      const { trStyle } = options
      const tds = target.map(t => {
        // console.log(key, row[key])
        const key = t.match(this.dataKey)[1]
        return t.replace(this.dataKey, value[key] || '-')
      })

      return `<tr style="${trStyle}">${tds.join('')}</tr>`
    },

    // =============
    // =============
    // 시스템템플릿 컬럼
    // =============
    // =============

    // ** key, path 는 무조건 빈 문자열이라도 있어야합니다 -> 안그럼 에러남

    /* ================= */
    /*  [결재정보] 컬럼 세팅 */
    /* ================= */
    approvalInfo: {
      TYPE_A: {
        title: root.$v('결재정보'), // 가로형
        column: [
          { label: root.$v('신청조직'), key: 'groupName', path: '$.groupName' },
          { label: root.$v('기안자'), key: '', path: '' },
          { label: root.$v('보존년한'), key: '', path: '', end: true },
          { label: root.$v('제목'), key: '', path: '', colspan: 5 }
        ]
      },
      TYPE_B: {
        title: root.$v('결재정보'), // 컬럼형
        column: [
          { label: root.$v('신청조직'), key: 'groupName', path: '$.groupName' },
          { label: root.$v('기안자'), key: '', path: '' },
          { label: root.$v('보존년한'), key: '', path: '', end: true },
          { label: root.$v('주문번호'), key: 'orderNo', path: '$.orderNo' },
          { label: root.$v('업무 유형'), key: 'orderTypeLabel', path: '$.orderTypeLabel' },
          { label: root.$v('완료희망일'), key: 'finishTime', path: '$.finishTime', end: true, colspan: 5 },
          { label: root.$v('제목'), key: '', path: '', end: true, colspan: 5 },
          { label: root.$v('작업 요청 내용'), key: '', path: '', end: true, colspan: 5 },
          { label: root.$v('수행 및 변경 내용'), key: '', path: '', end: true, colspan: 5 },
          { label: root.$v('비고'), key: 'note', end: true, colspan: 5 }
        ]
      },
      TYPE_C: {
        title: root.$v('결재정보'), // 상세형
        column: [
          { label: root.$v('신청조직'), key: 'groupName', path: '$.groupName' },
          { label: root.$v('기안자'), key: '', path: '' },
          { label: root.$v('보존년한'), key: '', path: '', end: true },
          { label: root.$v('완료희망일'), key: 'finishTime', path: '$.finishTime' },
          { label: root.$v('실제완료일'), key: '', path: '', end: true, colspan: 3 },
          { label: root.$v('주문번호'), key: 'orderNo', path: '$.orderNo' },
          { label: root.$v('업무 유형'), key: 'orderTypeLabel', path: '$.orderTypeLabel', end: true, colspan: 3 },
          { label: root.$v('제목'), key: '', path: '', end: true, colspan: 5 },
          { label: root.$v('작업 요청 내용'), key: '', path: '', end: true, colspan: 5 },
          { label: root.$v('수행 및 변경 내용'), key: '', path: '', end: true, colspan: 5 },
          { label: root.$v('비고'), key: 'note', end: true, colspan: 5 }
        ]
      }
    },

    /* ================= */
    /*  [주문정보] 컬럼 세팅 */
    /* ================= */
    orderInfo: {
      TYPE_A: { // 컬럼형
        title: root.$v('주문정보'),
        column: [
          { label: root.$v('관계사'), key: 'companyName', path: '$.companyName' },
          { label: root.$v('주문요청제목'), key: 'name', path: '$.name' },
          { label: root.$v('조직명 '), key: 'groupName', path: '$.groupName' },
          { label: root.$v('주문자'), key: 'userName', path: '$.userName' },
          { label: root.$v('프로젝트 명'), key: 'projectName', path: '$.projectName' },
          { label: root.$v('주문일'), key: 'createTime', path: '$.createTime' },
          { label: root.$v('구분'), key: 'orderTypeLabel', path: '$.orderTypeLabel' },
          { label: root.$v('완료희망일'), key: 'finishTime', path: '$.finishTime' }
        ]
      },
      TYPE_B: { // 가로형
        title: root.$v('주문정보'),
        column: [
          { label: root.$v('구분'), key: 'orderTypeLabel', path: '$.orderTypeLabel' },
          { label: root.$v('관계사'), key: 'companyName', path: '$.companyName' },
          { label: root.$v('조직명'), key: 'groupName', path: '$.groupName' },
          { label: root.$v('프로젝트 명'), key: 'projectName', path: '$.projectName' },
          { label: root.$v('주문요청제목'), key: 'name', path: '$.name' },
          { label: root.$v('주문자'), key: 'orderTypeLabel', path: '$.userName' },
          { label: root.$v('주문일'), key: 'createTime', path: '$.createTime' },
          { label: root.$v('완료희망일'), key: 'finishTime', path: '$.finishTime' }
        ]
      }
    },

    /* ================= */
    /*  [자원정보] 컬럼 세팅 */
    /* ================= */
    srcInfo: {
      COMPUTE: { // COMPUTE, VM Template
        title: root.$v('자원정보 (Compute / VM Template)'),
        column: [
          { label: root.$v('이름'), key: 'computeName', path: '$.computeName' },
          { label: root.$v('업무명'), key: 'itsmName', path: '$.itsmName' },
          { label: root.$v('고사양 선택'), key: 'clusterType', path: '$.clusterType' },
          { label: root.$v('네트워크 카테고리'), key: 'networkList', path: '$.networkList[*].cateKey' },
          { label: root.$v('호스트명'), key: 'hostname', path: '$.hostname' },
          { label: 'VCPU', key: 'vcpu', path: '$.vcpu' },
          { label: root.$v('OS 이미지'), key: 'osName', path: '$.osName' },
          { label: 'LocalDisk', key: 'externalDiskList', path: '$.clusterType.externalDiskList[*].data' },
          { label: root.$v('Memory'), key: 'memory', path: '$.memory' },
          { label: '설치 프로그램', key: 'installProgramList', path: '$.installProgramList' },
          { label: 'RootDiskSize', key: 'rootDiskSize', path: '$.rootDiskSize' }
        ]
      },
      MARKET: { // Marketplace
        title: root.$v('자원정보 (MarketPlace)'),
        column: [
          { label: root.$v('이름'), key: 'marketplaceName', path: '$.computeName' },
          { label: root.$v('업무명'), key: 'itsmName', path: '$.itsmName' },
          { label: root.$v('고사양 선택'), key: 'clusterType', path: '$.clusterType' },
          { label: root.$v('네트워크 카테고리'), key: 'networkList', path: '$.networkList[*].cateKey' },
          { label: root.$v('호스트명'), key: 'hostname', path: '$.hostname' },
          { label: 'VCPU', key: 'vcpu', path: '$.vcpu' },
          { label: root.$v('OS 이미지'), key: 'osName', path: '$.osName' },
          { label: 'LocalDisk', key: 'externalDiskList', path: '$.clusterType.externalDiskList[*].data' },
          { label: root.$v('Memory'), key: 'memory', path: '$.memory' },
          { label: '설치 프로그램', key: 'installProgramList', path: '$.installProgramList' },
          { label: 'RootDiskSize', key: 'rootDiskSize', path: '$.rootDiskSize' }
        ]
      },
      DATABASE: { // Database
        title: root.$v('자원정보 (Database)'),
        column: [
          { label: root.$v('이름'), key: 'databaseName', path: '$.databaseName' },
          { label: 'DB Profile', key: 'profileName', path: '$.profileName' },
          { label: 'DB engine', key: 'engineType', path: '$.engineType' },
          { label: root.$v('업무명'), key: 'itsmName', path: '$.itsmName' },
          { label: root.$v('호스트명'), key: 'hostname', path: '$.hostname' },
          { label: root.$v('DB 계정'), key: 'dbId', path: '$.dbId' },
          { label: root.$v('DB 패스워드'), key: 'dbPassword', path: '$.dbPassword' },
          { label: 'DB Schema', key: 'initialDbName', path: '$.initialDbName' },
          { label: root.$v('설치 프로그램'), key: 'installProgramList', path: '$.installProgramList' },
          { label: root.$v('사양선택'), key: 'profileName', path: '$.profileName' },
          { label: 'Database Size', key: 'rootDiskSize', path: '$.rootDiskSize' },
          { label: root.$v('네트워크 카테고리'), key: 'networkList', path: '$.networkList[*].cateKey' }
        ]
      },
      STORAGE: { // Stroage
        title: root.$v('자원정보 (Storage)'),
        column: [
          { label: root.$v('volume 그룹명'), key: 'storageName', path: '$.storageName' },
          { label: root.$v('연결 호스트'), key: 'vmList', path: '$.vmList[*].hostname' },
          { label: root.$v('volume 설명'), key: 'storageDesc', path: '$.storageDesc' },
          { label: root.$v('신청 용량'), key: 'diskList', path: '$.diskList[*].data' }
        ]
      },
      FILE_SERVER_SMB: { // File Server (NAS - SMB)
        title: root.$v('자원정보 (NAS Files - SMB)'),
        column: [
          { label: 'Share name', key: 'shareName', path: '$.shareName' },
          { label: '네트워크 카테고리', key: 'networkList', path: '$.networkList' },
          { label: '신청 용량', key: 'maxSizeGiB', path: '$.maxSizeGiB' },
          { label: '프로토콜 타입', key: 'protocolType', path: '$.protocolType' },
          { label: '스냅샷 사용', key: 'isSnapshot', path: '$.isSnapshot' },
          { label: '차단 파일', key: 'fileBlocking', path: '$.fileBlocking' }
        ]
      },
      FILE_SERVER_NFS: { // File Server (NAS - NFS)
        title: root.$v('자원정보 (NAS Files - NFS)'),
        column: [
          { label: 'Share name', key: 'shareName', path: '$.shareName' },
          { label: '네트워크 카테고리', key: 'networkList', path: '$.networkList' },
          { label: '신청 용량', key: 'maxSizeGiB', path: '$.maxSizeGiB' },
          { label: '프로토콜 타입', key: 'protocolType', path: '$.protocolType' },
          { label: '스냅샷 사용', key: 'isSnapshot', path: '$.isSnapshot' },
          { label: '차단 파일', key: 'fileBlocking', path: '$.fileBlocking' },
          { label: 'Share access type', key: 'shareAccessType', path: '$.shareAccessType' }
        ]
      },
      // NETWORK_L4: { // Network L4
      //   title: root.$v('자원정보 (Network L4)'),
      //   column: [
      //   ]
      // },
      // NETWORK_L7: { // Network L7
      //   title: root.$v('자원정보 (Network L7)'),
      //   column: [
      //   ]
      // },
      // SECURITY: { // Security
      //   title: root.$v('자원정보 (Network L7)'),
      //   column: [
      //   ]
      // },
      VM: { // VMWare
        title: root.$v('자원정보 (VMware Compute)'),
        column: [
          { label: root.$v('호스트명'), key: 'hostname', path: '$.hostname' },
          { label: root.$v('네트워크 카테고리'), key: 'networkList', path: '$.networkList[*].cateKey' },
          { label: root.$v('운영그룹'), key: 'manageGroupIdx', path: '$.manageGroupIdx' },
          { label: 'VCPU', key: 'externalDiskList', path: '$.externalDisk[*]' },
          { label: root.$v('OS 이미지'), key: 'osName', path: '$.osName' },
          { label: root.$v('Memory'), key: 'memory', path: '$.memory' },
          { label: root.$v('설치 프로그램'), key: 'installProgramList', path: '$.installProgramList[*]' },
          { label: root.$v('Root Disk'), key: 'rootDiskSize', path: '$.rootDiskSize' }
        ]
      },
      VSAN_ISCSI: { // VMware (Stroage)
        title: root.$v('자원정보 (VMware Storage)'),
        column: [
          { label: root.$v('별칭'), key: 'alias', path: '$.alias' },
          { label: root.$v('네트워크 카테고리'), key: 'networkList', path: '$.networkList[*].catekey' },
          { label: root.$v('운영그룹'), key: 'manageGroupIdx', path: '$.manageGroupIdx' },
          { label: root.$v('인증'), key: 'authenticat', path: '$.authType.authentication' },
          { label: 'LUN', key: 'lunList', path: '$.lunList[*].alias' }
        ]
      }
    },

    srcInfoTGW: {
      TRANSIT_GATEWAY_VPC: { // TGW (VPC)
        title: root.$v('자원정보 (Transit Gateway_VPC)'),
        rowColumn: [
          { label: root.$v('ID'), key: '', path: '' },
          { label: root.$v('구분명'), key: 'resourceName', path: '$.resourceName' },
          { label: root.$v('Amazon ASN'), key: 'amazonAsn', path: '$.amazonAsn' },
          { label: root.$v('타입'), key: 'attachmentType', path: '$.attachmentType' },
          { label: root.$v('라우팅 테이블 ID'), key: 'associationDefaultRouteTableId', path: '$.associationDefaultRouteTableId' },
          { label: root.$v('예약설정'), key: 'schedule', path: '$.autoScheduleAt' },
          { label: root.$v('내 프로젝트 이름'), key: '', path: '' }
        ],
        spanHeaders: [
          { label: root.$v('환경'), colspan: 4 },
          { label: root.$v('연결 환경'), colspan: 4 }
        ],
        spanColumn: [
          { label: root.$v('환경'), key: 'projectEnvironment', path: '$.createPairVpcs[*].source.projectEnvironment' },
          { label: root.$v('연결 이름'), key: 'transitGatewayAttachmentName', path: '$.createPairVpcs[*].source.transitGatewayAttachmentName' },
          { label: root.$v('DNS 지원'), key: 'dnsSupport', path: '$.createPairVpcs[*].source.options.dnsSupport' },
          { label: root.$v('IPv6 지원'), key: 'ipv6Support', path: '$.createPairVpcs[*].source.options.ipv6Support' },

          { label: root.$v('환경'), key: 'projectEnvironment', path: '$.createPairVpcs[*].target.projectEnvironment' },
          { label: root.$v('연결 이름'), key: 'transitGatewayAttachmentName', path: '$.createPairVpcs[*].target.transitGatewayAttachmentName' },
          { label: root.$v('DNS 지원'), key: 'dnsSupport', path: '$.createPairVpcs[*].target.options.dnsSupport' },
          { label: root.$v('IPv6 지원'), key: 'ipv6Support', path: 'createPairVpcs[*].target.options.ipv6Support' }
        ]
      },

      TRANSIT_GATEWAY_VPN: { // TGW (VPN)
        title: root.$v('자원정보 (Transit Gateway_VPN)'),
        rowColumn: [
          { label: root.$v('ID'), key: '', path: '' },
          { label: root.$v('구분명'), key: 'resourceName', path: '$.resourceName' },
          { label: root.$v('Amazon ASN'), key: 'amazonAsn', path: '$.amazonAsn' },
          { label: root.$v('타입'), key: 'attachmentType', path: '$.attachmentType' },
          { label: root.$v('라우팅 테이블 ID'), key: 'associationDefaultRouteTableId', path: '$.associationDefaultRouteTableId' },
          { label: root.$v('예약설정'), key: 'schedule', path: '$.autoScheduleAt' },
          { label: root.$v('내 프로젝트 이름'), key: '', path: '' },
          { label: root.$v('고객 게이트웨이 이름'), key: 'customerGatewayName', path: '$.vpnConnectionDto.customerGatewayDto.customerGatewayName' },
          { label: root.$v('BGP ASN'), key: 'bgpAsn', path: '$.vpnConnectionDto.customerGatewayDto.bgpAsn' },
          { label: root.$v('IP 주소'), key: 'ipAddress', path: '$.vpnConnectionDto.customerGatewayDto.ipAddress' }
        ],
        spanColumn: [
          { label: root.$v('환경'), key: 'projectEnvironment', path: '$.vpnConnectionDto.createVpcAttachmentDtos[*].projectEnvironment' },
          { label: root.$v('연결 이름'), key: 'transitGatewayAttachmentName', path: '$.vpnConnectionDto.createVpcAttachmentDtos[*].transitGatewayAttachmentName' },
          { label: root.$v('CIDR'), key: 'destinationCidrBlock', path: '$.vpnConnectionDto.createVpcAttachmentDtos[*].destinationCidrBlock' }
        ],
        additionalColumn: [
          { label: root.$v('가속 사용됨'), key: '', path: '' },
          { label: root.$v('라우팅'), key: 'staticRoutesOnly', path: '$.vpnConnectionDto.staticRoutesOnly' },
          { label: root.$v('로컬IPv4 네트워크 CIDR'), key: 'localIpv4NetworkCidr', path: '$.vpnConnectionDto.localIpv4NetworkCidr' },
          { label: root.$v('원격IPv4 네트워크 CIDR'), key: 'remoteIpv4NetworkCidr', path: '$.vpnConnectionDto.remoteIpv4NetworkCidr' }
        ]
      },

      TRANSIT_GATEWAY_PEERING: { // TGW (PEERING)
        title: root.$v('자원정보 (Transit Gateway_Peering)'),
        rowColumn: [
          { label: root.$v('ID'), key: '', path: '' },
          { label: root.$v('구분명'), key: 'resourceName', path: '$.resourceName' },
          { label: root.$v('Amazon ASN'), key: 'amazonAsn', path: '$.amazonAsn' },
          { label: root.$v('타입'), key: 'attachmentType', path: '$.attachmentType' },
          { label: root.$v('라우팅 테이블 ID'), key: 'associationDefaultRouteTableId', path: '$.associationDefaultRouteTableId' },
          { label: root.$v('예약설정'), key: 'schedule', path: '$.autoScheduleAt' },
          { label: root.$v('내 프로젝트 이름'), key: '', path: '' },
          { label: root.$v('소스 PEERING'), key: 'sourceTransitGatewayAttachmentName', path: '$.peeringAttachmentDto.sourceTransitGatewayAttachmentName' },
          { label: root.$v('상대 프로젝트 이름'), key: 'targetProjectIdx', path: '$.peeringAttachmentDto.targetProjectIdx' },
          { label: root.$v('타겟 PEERING'), key: 'targetTransitGatewayAttachmentName', path: '$.peeringAttachmentDto.targetTransitGatewayAttachmentName' }
        ],
        spanHeaders: [
          { label: root.$v('내 프로젝트 정보'), colspan: 3 },
          { label: root.$v('상대 프로젝트 정보'), colspan: 3 }
        ],
        spanColumn: [
          { label: root.$v('VPC 환경'), key: 'projectEnvironment', path: '$.createPairVpcs[*].source.projectEnvironment' },
          { label: root.$v('VPC 연결 이름'), key: 'transitGatewayAttachmentName', path: '$.createPairVpcs[*].source.transitGatewayAttachmentName' },
          { label: root.$v('CIDR'), key: 'destinationCidrBlock', path: '$.createPairVpcs[*].source.destinationCidrBlock' },

          { label: root.$v('VPC 환경'), key: 'projectEnvironment', path: '$.createPairVpcs[*].target.projectEnvironment' },
          { label: root.$v('VPC 연결 이름'), key: 'transitGatewayAttachmentName', path: '$.createPairVpcs[*].target.transitGatewayAttachmentName' },
          { label: root.$v('CIDR'), key: 'destinationCidrBlock', path: '$.createPairVpcs[*].target.destinationCidrBlock' }
        ]
      }
    },

    /* ================= */
    /*  [할당정보] 컬럼 세팅 */
    /* ================= */
    assignInfo: {
      COMPUTE: { // ComputeVM Template
        title: root.$v('할당정보 (Compute / VM Template)'),
        column: [
          { label: root.$v('클러스터명'), key: 'clusterName', path: '$.configJson.cluster.name' },
          { label: root.$v('노드명'), key: 'nodeName', path: '$.configJson.node.nodeName' },
          { label: root.$v('네트워크명'), key: 'networkName', path: '$.configJson.networkList[*].cateKey' },
          { label: 'IP', key: 'ip', path: '' },
          { label: root.$v('Script 제목'), key: 'scriptName', path: '$.configJson.script' },
          { label: root.$v('예약 설정'), key: 'schedule', path: '$.autoScheduleAt' }
        ]
      },
      MARKET: { // Market
        title: root.$v('할당정보 (Marketplace)'),
        column: [
          { label: 'Central', key: 'centralName', path: '$.configJson.central.centralName' },
          { label: root.$v('클러스터명'), key: 'clusterName', path: '$.configJson.cluster.name' },
          { label: root.$v('네트워크명'), key: 'networkName', path: '$.configJson.networkList[*].cateKey' },
          { label: 'IP', key: 'ip', path: '' },
          { label: root.$v('예약 설정'), key: 'schedule', path: '$.autoScheduleAt' }
        ]
      },
      DATABASE: { // Database
        title: root.$v('할당정보 (Database)'),
        column: [
          { label: root.$v('클러스터명'), key: 'clusterName', path: '$.configJson.cluster.clusterName' },
          { label: 'DB Parameter', key: 'profileName', path: '$.profileName' },
          { label: 'Network Profile', key: 'networkList', path: '$.networkList[*].cateKey' },
          { label: root.$v('예약 설정'), key: 'schedule', path: '$.autoScheduleAt' }
        ]
      },
      FILE_SERVER_SMB: { // File Server (NAS - SMB)
        title: root.$v('할당정보 (NAS Files - SMB)'),
        column: [
          { label: root.$v('클러스터명'), key: 'name', path: '$.configJson.cluster.name' },
          { label: root.$v('파일 서버명'), key: 'fileServerName', path: '$.configJson.fileServer.fileServerName' },
          { label: root.$v('부하 분산 사용'), key: 'isDistributed', path: '$.isDistributed' },
          { label: root.$v('압축 여부'), key: 'isCompression', path: '$.isCompression' },
          { label: root.$v('엑세스 제한 여부'), key: 'isAccess', path: '$.isAccess' },
          { label: root.$v('SMB 암호화 사용'), key: 'isSmb3Encryption', path: '$.isSmb3Encryption' },
          { label: root.$v('예약 설정'), key: 'schedule', path: '$.autoScheduleAt' }
        ]
      },
      FILE_SERVER_NFS: { // File Server (NAS - NFS)
        title: root.$v('할당정보 (NAS Files - NFS)'),
        column: [
          { label: root.$v('클러스터명'), key: 'name', path: '$.configJson.cluster.name' },
          { label: root.$v('파일 서버명'), key: 'fileServerName', path: '$.configJson.fileServer.fileServerName' },
          { label: root.$v('부하 분산 사용'), key: 'isDistributed', path: '$.isDistributed' },
          { label: root.$v('압축 여부'), key: 'isCompression', path: '$.isCompression' },
          { label: root.$v('엑세스 제한 여부'), key: 'isAccess', path: '$.isAccess' },
          { label: root.$v('인증 타입'), key: 'authenticationType', path: '$.authenticationType' },
          { label: root.$v('스쿼시 타입'), key: 'squashType', path: '$.squashType' },
          { label: root.$v('익명 유저 아이디'), key: 'anonymousUid', path: '$.anonymousUid' },
          { label: root.$v('익명 그룹 아이디'), key: 'anonymousGid', path: '$.anonymousGid' },
          { label: root.$v('예약 설정'), key: 'schedule', path: '$.autoScheduleAt' }
        ]
      },
      NETWORK_L4: {
        title: root.$v('할당정보 (L4)'),
        column: [
          { label: root.$v('로드밸런스명'), key: 'name', path: '' },
          { label: root.$v('포트'), key: 'port', path: '$.port' },
          { label: root.$v('프로토콜'), key: 'protocolType', path: '$.protocolType' },
          { label: root.$v('방식'), key: 'method', path: '$.method' },
          { label: root.$v('예약 설정'), key: 'schedule', path: '$.autoScheduleAt' }
        ]
      },
      NETWORK_L7: {
        title: root.$v('할당정보 (L7)'),
        column: [
          { label: root.$v('로드밸런스명'), key: 'name', path: '' },
          { label: root.$v('도메인'), key: 'domain', path: '$.domain' },
          { label: root.$v('포트'), key: 'port', path: '$.port' },
          { label: root.$v('프로토콜'), key: 'protocolType', path: '$.protocolType' },
          { label: root.$v('방식'), key: 'method', path: '$.method' },
          { label: root.$v('예약 설정'), key: 'schedule', path: '$.autoScheduleAt' }
        ]
      },
      SECURITY: {
        title: root.$v('할당정보 (보안)'),
        column: [
          { label: root.$v('보안 그룹명'), key: '', path: '' },
          { label: root.$v('출발지 IP'), key: '', path: '' },
          { label: root.$v('목적지 IP'), key: '', path: '' },
          { label: root.$v('시작일'), key: '', path: '' },
          { label: root.$v('만료일'), key: '', path: '' },
          { label: root.$v('정책명'), key: '', path: '' },
          { label: root.$v('예약 설정'), key: '', path: '' }
        ]
      },
      VM: { // VMware (Compute, VM Template)
        title: root.$v('할당정보 (VMWare)'),
        column: [
          { label: root.$v('호스트명'), key: 'hostname', path: '$.configJson.hostname' },
          { label: root.$v('네트워크명'), key: 'networkName', path: '$.configJson.networkList[*].cateKey' },
          { label: root.$v('Script 제목'), key: 'scriptName', path: '$.configJson.script' },
          { label: root.$v('예약 설정'), key: 'schedule', path: '$.autoScheduledAt' }
        ]
      },
      VSAN_ISCSI: { // VMware (Storage)
        title: root.$v('할당정보 (vSAN iSCSI)'),
        column: [
          { label: root.$v('별칭'), key: 'alias', path: '$.alias' },
          { label: root.$v('네트워크명'), key: 'networkList', path: '$.networkList[*].catekey' },
          { label: root.$v('운영그룹'), key: 'spbmProfileName', path: '$.spbmProfileName' },
          { label: root.$v('TCP 포트'), key: 'tcpPort', path: '$.tcpPort' },
          { label: root.$v('IQN'), key: 'iqn', path: '$.iqn' },
          { label: root.$v('허용 이니시에이터'), key: 'initiatorList', path: '$.initiatorList' }
        ]
      },
      EC2: { // EC2
        title: root.$v('자원정보 (EC2)'),
        column: [
          { label: root.$v('인스턴스 이름'), key: 'instanceName', path: '$.instanceName' },
          { label: root.$v('Region'), key: 'region', path: '$.region' },
          { label: root.$v('AMI'), key: 'imageId', path: '$.amazonImageDto.imageId' },
          { label: root.$v('인스턴스 사양'), key: 'instanceType', path: '$.instanceType' },
          { label: root.$v('스토리지'), key: 'blockDeviceMapping', path: '$.blockDeviceMapping[*].isRoot' },
          { label: root.$v('세부 모니터링'), key: 'monitoringState', path: '$.monitoringState' }
        ]
      },
      EFS: { // EFS
        title: root.$v('자원정보 (EFS)'),
        column: [
          { label: root.$v('EFS 이름'), key: 'fileSystemName', path: '$.fileSystemName' },
          { label: root.$v('적용 범위'), key: '', path: '$.' },
          { label: root.$v('탑재대상'), key: 'environment', path: '$.environment' },
          { label: root.$v('성능모드'), key: 'performanceMode', path: '$.performanceMode' },
          { label: root.$v('파일 처리량'), key: 'throughputMode', path: '$.throughputMode' }
        ]
      },
      TARGET_GROUP: { // Target Group
        title: root.$v('자원정보 (Target Group)'),
        column: [
          { label: root.$v('대상그룹 이름'), key: 'targetGroupName', path: '$.targetGroupName' },
          { label: root.$v('대상그룹 유형'), key: 'targetType', path: '$.targetType' },
          { label: root.$v('서비스 포트'), key: 'healthCheckPort', path: '$.healthCheckPort' },
          { label: root.$v('상태확인 프로토콜'), key: 'computeName', path: '$.computeName' },
          { label: root.$v('상태확인 경로'), key: 'healthCheckPath', path: '$.healthCheckPath' },
          { label: root.$v('상태확인 속성'), key: 'healthCheckPort', path: '$.healthCheckPort' },
          { label: root.$v('인스턴스'), key: 'targetType', path: '$.targetType' },
          { label: root.$v('포트'), key: 'healthCheckPort', path: '$.healthCheckPort' }
        ]
      },
      NLB_L4: { // NLB_L4
        title: root.$v('자원정보 (NLB_L4)'),
        column: [
          { label: root.$v('로드밸런서 이름'), key: 'elbName', path: '$.elbName' },
          { label: root.$v('로드밸런서 종류'), key: 'computeName', path: '$.computeName' },
          { label: root.$v('스키마'), key: 'isPublic', path: '$.isPublic' },
          { label: root.$v('VPC'), key: 'environment', path: '$.vpcRaw.environment' },
          { label: root.$v('프로토콜'), key: 'protocol', path: '$.registerListener[*].protocol' },
          { label: root.$v('포트'), key: 'port', path: '$.registerListener[*].port' },
          { label: root.$v('대상그룹'), key: 'targetGroupName', path: '$.targetGroup.targetGroupName' }
        ]
      },
      SG: { // SG
        title: root.$v('자원정보 (SG)'),
        column: [
          { label: root.$v('보안그룹 이름'), key: 'groupName', path: '$.groupName' },
          { label: root.$v('VPC'), key: 'vpcDto', path: '$.vpcDto.environment' },
          { label: root.$v('인바운드 규칙'), key: 'hostname', path: '$.securityGroupRuleDtoList.filter(sg).isEgress' },
          { label: root.$v('아웃바운드 규칙'), key: 'hostname', path: '$.securityGroupRuleDtoList.filter(sg).isEgress' },
          { label: root.$v('보안그룹 설명'), key: 'description', path: '$.description' }
        ]
      }
    },
    /**
     * 우측 시스템 템플릿 (기본)
     */
    rawSystemTemplates: {
      default: [
        { label: root.$v('결재정보 TYPE_A'), info: 'approvalInfo', name: 'TYPE_A', tableType: 'NO_LIMIT' },
        { label: root.$v('결재정보 TYPE_B'), info: 'approvalInfo', name: 'TYPE_B', tableType: 'NO_LIMIT' },
        { label: root.$v('결재정보 TYPE_C'), info: 'approvalInfo', name: 'TYPE_C', tableType: 'NO_LIMIT' },

        { label: root.$v('주문정보 TYPE_A'), info: 'orderInfo', name: 'TYPE_A', tableType: 'DIVIDER' },
        { label: root.$v('주문정보 TYPE_B'), info: 'orderInfo', name: 'TYPE_B', tableType: 'ROWS' }
      ],

      PRIVATE: [
        // 자원 정보
        { label: root.$v('자원정보 Nutanix_Compute'), info: 'srcInfo', name: 'COMPUTE', tableType: 'DIVIDER' },
        // { label: root.$v('자원정보 Nutanix_VM Template'), info: 'srcInfo', name: 'COMPUTE', tableType: 'DIVIDER' }, // COMPUTE_BY_TEMPLATE
        { label: root.$v('자원정보 Nutanix_Marketplace'), info: 'srcInfo', name: 'MARKET', tableType: 'DIVIDER' },
        { label: root.$v('자원정보 Nutanix_Database'), info: 'srcInfo', name: 'DATABASE', tableType: 'DIVIDER' },
        { label: root.$v('자원정보 Nutanix_Storage'), info: 'srcInfo', name: 'STORAGE', tableType: 'DIVIDER' },
        { label: root.$v('자원정보 Nutanix_File Server (SMB)'), info: 'srcInfo', name: 'FILE_SERVER_SMB', tableType: 'DIVIDER' },
        { label: root.$v('자원정보 Nutanix_File Server (NFS)'), info: 'srcInfo', name: 'FILE_SERVER_NFS', tableType: 'DIVIDER' },

        { label: root.$v('자원정보 VMware_VMware'), info: 'srcInfo', name: 'VM', tableType: 'DIVIDER' },
        // { label: root.$v('자원정보 VMware_VMware Template'), info: 'srcInfo', name: 'VM', tableType: 'DIVIDER' }, // VM_BY_TEMPLATE
        { label: root.$v('자원정보 VMware_vSAN iSCSI'), info: 'srcInfo', name: 'VSAN_ISCSI', tableType: 'DIVIDER' },

        // 할당정보
        { label: root.$v('할당정보 Nutanix_Compute'), info: 'assignInfo', name: 'COMPUTE', tableType: 'ROWS' },
        // { label: root.$v('할당정보 Nutanix_VM Template'), info: 'assignInfo', name: 'COMPUTE', tableType: 'ROWS' }, // COMPUTE_BY_TEMPLATE
        { label: root.$v('할당정보 Nutanix_Marketplace'), info: 'assignInfo', name: 'MARKET', tableType: 'ROWS' },
        { label: root.$v('할당정보 Nutanix_Database'), info: 'assignInfo', name: 'DATABASE', tableType: 'ROWS' },
        { label: root.$v('할당정보 Nutanix_File Server (SMB)'), info: 'assignInfo', name: 'FILE_SERVER_SMB', tableType: 'ROWS' },
        { label: root.$v('할당정보 Nutanix_File Server (NFS)'), info: 'assignInfo', name: 'FILE_SERVER_NFS', tableType: 'ROWS' },

        { label: root.$v('할당정보 Nutanix_L4'), info: 'assignInfo', name: 'NETWORK_L4', tableType: 'ROWS' },
        { label: root.$v('할당정보 Nutanix_L7'), info: 'assignInfo', name: 'NETWORK_L7', tableType: 'ROWS' },
        { label: root.$v('할당정보 Nutanix_Security'), info: 'assignInfo', name: 'SECURITY', tableType: 'ROWS' },

        { label: root.$v('할당정보 VMware_VMware'), info: 'assignInfo', name: 'VM', tableType: 'ROWS' },
        // { label: root.$v('할당정보 VMware_VM Template'), info: 'srcInfo', name: 'VM', tableType: 'ROWS' }, // VM_BY_TEMPLATE
        { label: root.$v('할당정보 VMware_vSAN iSCSI'), info: 'assignInfo', name: 'VSAN_ISCSI', tableType: 'ROWS' }
      ],

      PUBLIC: [
        // 자원정보
        { label: root.$v('자원정보 AWS_EC2'), info: 'assignInfo', name: 'EC2', tableType: 'ROWS' },
        { label: root.$v('자원정보 AWS_EFS'), info: 'assignInfo', name: 'EFS', tableType: 'ROWS' },
        { label: root.$v('자원정보 AWS_대상그룹'), info: 'assignInfo', name: 'TARGET_GROUP', tableType: 'ROWS' },
        { label: root.$v('자원정보 AWS_NLB'), info: 'assignInfo', name: 'NLB_L4', tableType: 'ROWS' },
        { label: root.$v('자원정보 AWS_보안그룹'), info: 'assignInfo', name: 'SG', tableType: 'ROWS' },

        { label: root.$v('자원정보 TRANSIT_GATEWAY_VPC'), info: 'srcInfoTGW', name: 'TRANSIT_GATEWAY_VPC', tableType: 'COMBINED' },
        { label: root.$v('자원정보 TRANSIT_GATEWAY_VPN'), info: 'srcInfoTGW', name: 'TRANSIT_GATEWAY_VPN', tableType: 'COMBINED' },
        { label: root.$v('자원정보 TRANSIT_GATEWAY_PEERING'), info: 'srcInfoTGW', name: 'TRANSIT_GATEWAY_PEERING', tableType: 'COMBINED' }
      ]
    },

    /**
     * editor 옵션
     * Drag n Drop :: https://www.tiny.cloud/blog/drag-and-drop/
     */
    option: {
      height: 555,
      menubar: false,
      plugins: [
        'advlist autolink lists checklist link image charmap print preview anchor table ',
        'searchreplace visualblocks code fullscreen',
        'insertdatetime media table paste code help wordcount'
      ],
      toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist checklist numlist outdent indent | image | table tabledelete | tableprops tablerowprops tablecellprops | tablemergecells tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | help',
      setup: root.setup,
      image_title: true,
      automatic_uploads: true,
      file_picker_types: 'image',
      file_picker_callback: root.callback,
      content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }'
    }
  }),
  methods: {
    /**
     * 시스템 템플릿 불러오기
     * @param {String} info
     * @param {String} name 컬럼 이름
     * @param {undefined|String} tableType 일반 테이블 (undefined), DIVIDER (2개 컬럼), col/rowSpan()
     */
    callTemplate ({ info, name: colName, tableType }) {
      console.log('%c## DATA :: ', 'color: yellow', '\n- Info : ', info, '\n- Column : ', colName, '\n- TableType : ', tableType)

      const content = this.setFormat({ info, colName, tableType })

      // 컨텐츠 editor에 삽입
      this.insertContent(content)
    },

    /**
     * 보고서 시스템 템플릿 바인딩
     * @param {Object} infos 필수 정보
     * @param {Boolean} useTitle 타이틀 사용할것인지?
     */
    setFormat ({ info, colName, tableType }, useTitle = true) {
      // console.log('%c이거 호출하면 진짜 집에 가능거야~', 'background-color: skyblue; color: blue', useTitle)
      return {
        ROWS: params => this.setTemplateTableFormat(params, useTitle),
        NO_LIMIT: params => this.setNoLimitTable(params, useTitle),
        DIVIDER: params => this.orderTemplate(params, useTitle),
        COMBINED: params => this.tgwOnlyTable(params, useTitle)
      }[tableType]({ info, colName, tableType })
    },

    /**
     * table 공통 옵션 설정
     * @param {String} width 컬럼의 너비 설정
     * @param {Object} infos 필수 정보
     */
    setTableOption (width = '150px', { info, colName, tableType }) {
      // const { background } = { background: 'background-color: #e6e6e6;' }
      const theadStyle = `width: ${width}; background-color: #e6e6e6; text-align: center; height: 30px; font-weight: 500;`
      const trStyle = 'text-align: center; height: 30px;'
      let tdStyle = `width: ${width}; text-align: center; height: 30px;`

      let dataWrapper = ''
      let dataBody = ''
      let dataLabel = ''
      let dataRow = ''

      // [워크플로우 > 템플릿 등록] 일때는 템플릿 글씨 색상 다르게 설정 + 각종 키 추가
      if (!this.isWorkDocument) {
        tdStyle += 'color: #7681FF;'
        dataWrapper = 'data-table="wrapper"'
        dataLabel = 'data-label="data-label"'
        dataBody = `data-body="${info}-${colName}-${tableType}"`
        dataRow = 'data-row="data-row"'
      }

      // console.log({theadStyle, trStyle, tdStyle, dataWrapper, dataLabel, dataBody, dataRow })
      return { theadStyle, trStyle, tdStyle, dataWrapper, dataLabel, dataBody, dataRow }
    },

    /**
     * 열 형식 생성 함수 (열 2개)
     * @param {Array} column
     * @param {Object} option
     * @return {Object} { columns: String, raw: Array } :: join('') 되지 않은 <tr>
     */
    columnsTemplate (column, option) {
      if (!column || !column.length) return { columns: '' }

      const { theadStyle, trStyle, tdStyle, dataLabel, dataRow } = option

      const odd = (column.length % 2) === 1 // 컬럼 개수가 홀수인 경우, colspan 실행

      const td = []
      let temp = []
      let count = 0
      let isLast = 0

      for (let i = 0; i < column.length; i++) {
        const col = column[i]

        const value = (!this.isWorkDocument)
          ? `<td style="${tdStyle}" data-key="${col.key}">{{ data-key }}</td>` // [워크플로우 > 템플릿 등록]
          : `<td style="${tdStyle}">{{ ${col.key} }}</td>` // [사전협의/할일 보고서 작성]

        const content = `<td style="${theadStyle}" ${dataLabel}>${col.label}</td> ${value}`
        // const content = `<td style="${theadStyle}" ${dataLabel}>${col.label}</td> <td style="${tdStyle}" data-key="${col.key}">{{ data-key }}</td>` (🌸원본)
        temp.push(content)

        count += 1
        if (count === 2) { // 2개씩 밀어넣기
          td.push(temp)
          temp = []
          count = 0
        }

        isLast = i

        // 컬럼 개수가 홀수라면 colspan 해서 마지막에 추가
        if (odd && (isLast === column.length - 1)) {
          // console.log(isLast)
          const lastValue = (!this.isWorkDocument)
            ? `<td colspan=${3} style="${tdStyle}" data-key="${col.key}">{{ data-key }}</td>` // [워크플로우 > 템플릿 등록]
            : `<td colspan=${3} style="${tdStyle}">{{ ${col.key} }}</td>` // [사전협의/할일 보고서 작성]

          const lastContent = `<td style="${theadStyle}" ${dataLabel}>${col.label}</td> ${lastValue}`

          td.push([lastContent])
        }
      }

      const cols = []
      for (let i = 0; i < td.length; i++) {
        cols.push(`<tr style="${trStyle}" ${dataRow}>${td[i].join('')}</tr>`)
      }

      const columns = cols.join('')
      return { columns, raw: { td, cols } }
    },

    /**
     * 열 형식 생성 함수 (열 N개)
     * @param {Array} column
     * @param {Object} option
     * @return {Object} { columns: String, raw: Array } :: join('') 되지 않은 <tr>
     */
    multiColumnsTemplate (column, option) {
      if (!column || !column.length) return { columns: '' }

      const { theadStyle, trStyle, tdStyle, dataLabel, dataRow } = option

      let td = []
      const tr = []

      for (let i = 0; i < column.length; i++) {
        const col = column[i]

        const label = `<td style="${theadStyle}" ${dataLabel}>${col.label}</td>`

        const content = (!this.isWorkDocument)
          ? `<td colspan="${col.colspan}" style="${tdStyle}" data-key="${col.key}">{{ data-key }}</td>` // [워크플로우 > 템플릿 등록]
          : `<td colspan="${col.colspan}" style="${tdStyle}">{{ ${col.key} }}</td>` // [사전협의/할일 보고서 작성]

        // const content = `<td colspan="${col.colspan}" style="${tdStyle}" data-key="${col.key}">{{ data-key }}</td>` // (🌸 원본)
        td.push(label, content)

        // 하나의 tr 이 끝난경우, 또는 모든 컬럼 확인 끝나면 td 목록 정리
        if ((col.end) || (i === column.length - 1)) {
          tr.push(td.join(''))
          td = []
        }
      }

      // [워크플로우 > 템플릿 등록] :: 기본 키 연결을 위한 <tr> 태그
      const cols = []
      for (let i = 0; i < tr.length; i++) {
        cols.push(`<tr style="${trStyle}" ${dataRow}>${tr[i]}</tr>`)
      }

      const columns = cols.join('')
      return { columns, raw: { tr, td, cols } }
    },

    /**
     * 행 형식 생성 함수
     * @param {Array} column
     * @param {Object} option
     * @return {Object} { head: String, rows: String, raw: Array } :: join('') 되지 않은 <tr>
     */
    rowsTemplate (column, option) {
      if (!column || !column.length) return { head: '', rows: '' }

      const { theadStyle, trStyle, tdStyle, dataRow } = option

      const thead = []
      const td = []

      for (let i = 0; i < column.length; i++) {
        const col = column[i]
        const content = (!this.isWorkDocument)
          ? `<td style="${tdStyle}" data-key="${col.key}">{{ data-key }}</td>` // [워크플로우 > 템플릿 등록]
          : `<td style="${tdStyle}">{{ ${col.key} }}</td>` // [사전협의/할일 보고서 작성]

        thead.push(`<td style=${tdStyle}>${col.label}</td>`)
        td.push(content)
      }

      // [워크플로우 > 템플릿 등록] :: 기본 키 연결을 위한 <tr> 태그
      const head = `<tr style="${theadStyle}"> ${thead.join('')} </tr>`
      const rows = `<tr style="${trStyle}" ${dataRow}> ${td.join('')} </tr>`
      return { head, rows, raw: { thead, td } }
    },

    /**
     * colspan header 가 있는 경우 생성 함수
     * @param {Array} column
     * @param {Object} option
     * @return {Object} { head: String } :: <tr>
     */
    spanHeaderTemplate (column, option) {
      if (!column || !column.length) return { head: '' }

      const { theadStyle } = option

      const thead = []

      for (let i = 0; i < column.length; i++) {
        const col = column[i]
        thead.push(`<td colspan=${col.colspan}>${col.label}</td>`)
      }

      const head = `<tr style="${theadStyle}"> ${thead.join('')} </tr>`
      return { head }
    },

    /**
     * table 로 한번 감싸줍니다.
     * @param {String} result 내부 <tr><td> String 요소
     * @param {Object} dataSetting 편집가능한곳은 <table><tbody> 에 데이터 라벨링이 됨
     */
    tableWrapper (result, { dataWrapper = '', dataBody = '' } = {}) {
      // console.log(dataWrapper, dataBody)
      return `
        <table style="border-collapse: collapse; width: 100%; font-size: 12px;" border="1" ${dataWrapper}>
          <tbody ${dataBody}>
            ${result}
          </tbody>
        </table>
        <br>
        `
    }
  }
}
