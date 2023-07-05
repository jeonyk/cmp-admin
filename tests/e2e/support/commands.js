// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.env('API_URL', 'https://cmp-api.growthsoft.co.kr/api/cmp/v1')
Cypress.env('TEST_USER_ID', 'jejung')
Cypress.env('TEST_USER_PW', 'gRowth2014!')
Cypress.env('E2E_PROJECT_NAME', '1652935662183-PJ-E2E')

/**
 * 사번/비밀번호 로그인 커맨드
 */
Cypress.Commands.add('login', (id, pw) => {
  cy.clearStorage()
  cy.dashboard()

  // 쿠키 세팅이 아니라 수동 로그인으로 변경
  cy.get(':nth-child(1) > .login-input > .el-input__inner').type(Cypress.env('TEST_USER_ID'))
  cy.get('#password').type(Cypress.env('TEST_USER_PW'))
  cy.get('.button').click()

  // [User] / [Perm] Object 형식을 쿠키로 저장할 방법을 못찾음...
  // cy.request('POST', Cypress.env('API_URL') + '/iam/auth/login', {
  //   isAdmin: false,
  //   userId: Cypress.env('TEST_USER_ID'),
  //   userPw: Cypress.env('TEST_USER_PW')
  // }).then((r) => {
  //   cy.setCookie('Authorization', r.body.token)
  //   // cy.setCookie('User', user)
  //   // cy.setCookie('Perm', r.body.userResDto)
  //   cy.setCookie('CMPLang', 'ko')
  // })
})

/**
 * 로컬 스토리지, 쿠키 등 지우기
 */
Cypress.Commands.add('clearStorage', () => {
  cy.clearLocalStorage()
  cy.clearCookies()
})

/**
 * 콘솔 클릭
 */
Cypress.Commands.add('dashboard', (visit = true, url) => {
  if (visit) {
    cy.visit(url || 'http://localhost:8081')
  } else {

  }
})
