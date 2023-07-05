// https://docs.cypress.io/api/introduction/api.html

describe('Visit CMP Page', () => {
  it('Visits the app root url', () => {
    // expect(true).to.equal(true)

    // 페이지 방문
    cy.visit('http://localhost:8082/') // admin 기준
    // cy.visit('http://localhost:8081/') // user

    // cypress 는 jquery와 비슷합니다.
    // id / pw 입력
    cy.get('.form-area')
      .get(':nth-child(1) > .login-input > .el-input__inner').type('jejung', { force: true })
      .get(':nth-child(2) > .login-input > .el-input__inner').type('growth2014!', { force: true })
      .get('.el-checkbox__inner').click()
      .get('.button').click()

    // 사이드 메뉴 > 사전협의 > 0번째 티켓 클릭
    cy.get('.expand-menu-icon').click()
    cy.get('.admin-side-menu.-expanded .node-title')
      .contains('업무').click()
      .get('.ticket-panel-list li').eq(0).click()

    // 신규/변경/삭제 모든 경우를 돕니다.
    cy.get('.conf-source > .list-sect').eq(0).get('ul.-lists li').click()
  })
})
