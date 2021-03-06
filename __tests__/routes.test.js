/* global afterAll, beforeAll, jest, describe, expect, test */

const request = require('supertest')
const { verifyRequestSignature } = require('@slack/events-api')

const { click: clickCommand } = require('../click')
const wildbuttonApp = require('../wildbutton')
const install = require('../install')

// silence console.debug
console.debug = jest.fn()

jest.mock('../click')
jest.mock('../db')
jest.mock('../events')
jest.mock('../install')
jest.mock('@slack/events-api')

const app = wildbuttonApp(null)

afterAll(() => verifyRequestSignature.mockReset())
beforeAll(() => verifyRequestSignature.mockImplementation(() => true))

function commandRequest (app) {
  return request(app)
    .post('/commands')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .set('X-Slack-Signature', 'INVALID')
    .set('X-Slack-Request-Timestamp', Math.floor(Date.now() / 1000))
}

describe('Test the root path', () => {
  test('It should respond.', async () => {
    const response = await request(app).get('/')
    expect(response.statusCode).toBe(200)
    expect(response.text).toMatch(/API is ready/)
  })
})

describe('Test help command', () => {
  test('It should respond.', async () => {
    const response = await commandRequest(app)
      .send({
        text: 'help',
        team_id: 'TESTTEAMID'
      })
    expect(response.statusCode).toBe(200)
    expect(response.text).toMatch(/totally useless/)
  })
})

describe('Test stats command', () => {
  test('It should respond.', async () => {
    const response = await commandRequest(app)
      .send({
        text: 'stats',
        team_id: 'TESTTEAMID'
      })
    expect(response.statusCode).toBe(200)
    expect(response.text).toMatch(/STATISTICS/)
  })
})

describe('Test usage command', () => {
  test('It should respond to usage', async () => {
    const response = await commandRequest(app)
      .send({
        text: 'usage',
        team_id: 'TESTTEAMID'
      })
    expect(response.statusCode).toBe(200)
    expect(response.text).toMatch(/understand you/)
  })

  test('It should respond to any invalid command', async () => {
    const response = await commandRequest(app)
      .send({
        text: 'somethinginvalid',
        team_id: 'TESTTEAMID'
      })
    expect(response.statusCode).toBe(200)
    expect(response.text).toMatch(/understand you/)
  })
})

function authRequest (app) {
  return request(app)
    .get('/auth')
}

describe('Test auth command', () => {
  test('It should return 200 on ok.', async () => {
    install.mockImplementation(async code => true)
    const response = await authRequest(app)
      .query({
        code: '1234567890',
        state: ''
      })
    expect(response.statusCode).toBe(200)
    expect(response.text).toMatch(/success/)
  })

  test('It should return 400 on failure.', async () => {
    install.mockImplementation(async code => {
      throw new Error('mockup error')
    })
    const response = await authRequest(app)
      .query({
        code: '1234567890',
        state: ''
      })
    expect(response.statusCode).toBe(400)
  })
})

function interactiveRequest (app) {
  return request(app)
    .post('/interactive')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .set('X-Slack-Signature', 'INVALID')
    .set('X-Slack-Request-Timestamp', Math.floor(Date.now() / 1000))
}

describe('Test interaction payloads', () => {
  test('It should call the click handler for a wildbutton click', async () => {
    clickCommand.mockImplementationOnce(async (res, payload, clickRecorderHandler) => res.send(''))

    const response = await interactiveRequest(app)
      .send({
        payload: JSON.stringify({
          type: 'block_actions',
          team: {
            id: 'T9TK3CUKW',
            domain: 'example'
          },
          user: {
            id: 'UA8RXUSPL',
            username: 'jtorrance',
            team_id: 'T9TK3CUKW'
          },
          api_app_id: 'AABA1ABCD',
          token: '9s8d9as89d8as9d8as989',
          container: {
            type: 'message_attachment',
            message_ts: '1548261231.000200',
            attachment_id: 1,
            channel_id: 'CBR2V3XEX',
            is_ephemeral: false,
            is_app_unfurl: false
          },
          trigger_id: '12321423423.333649436676.d8c1bb837935619ccad0f624c448ffb3',
          channel: {
            id: 'CBR2V3XEX',
            name: 'review-updates'
          },
          message: {
            bot_id: 'BAH5CA16Z',
            type: 'message',
            text: "This content can't be displayed.",
            user: 'UAJ2RU415',
            ts: '1548261231.000200'
          },
          response_url: 'https://hooks.slack.com/actions/AABA1ABCD/1232321423432/D09sSasdasdAS9091209',
          actions: [
            {
              action_id: 'wild_button',
              block_id: '=qXel',
              text: {
                type: 'plain_text',
                text: 'View',
                emoji: true
              },
              value: '2020-01-04T16:37:12.000Z',
              type: 'button',
              action_ts: '1548426417.840180'
            }
          ]
        })
      })
    expect(response.statusCode).toBe(200)
  })

  test('It should not call the click handler for other event types', async () => {
    const response = await interactiveRequest(app)
      .send({
        payload: JSON.stringify({
          token: 'Nj2rfC2hU8mAfgaJLemZgO7H',
          callback_id: 'chirp_message',
          type: 'message_action',
          trigger_id: '13345224609.8534564800.6f8ab1f53e13d0cd15f96106292d5536',
          response_url: 'https://hooks.slack.com/app-actions/T0MJR11A4/21974584944/yk1S9ndf35Q1flupVG5JbpM6',
          team: {
            id: 'T0MJRM1A7',
            domain: 'pandamonium'
          },
          channel: {
            id: 'D0LFFBKLZ',
            name: 'cats'
          },
          user: {
            id: 'U0D15K92L',
            name: 'dr_maomao'
          },
          message: {
            type: 'message',
            user: 'U0MJRG1AL',
            ts: '1516229207.000133',
            text: "World's smallest big cat! <https://youtube.com/watch?v=W86cTIoMv2U>"
          }
        })
      })
    expect(response.statusCode).toBe(400)
  })

  test('It should not call the click handler for other buttons', async () => {
    const response = await interactiveRequest(app)
      .send({
        payload: JSON.stringify({
          type: 'block_actions',
          team: {
            id: 'T9TK3CUKW',
            domain: 'example'
          },
          user: {
            id: 'UA8RXUSPL',
            username: 'jtorrance',
            team_id: 'T9TK3CUKW'
          },
          api_app_id: 'AABA1ABCD',
          token: '9s8d9as89d8as9d8as989',
          container: {
            type: 'message_attachment',
            message_ts: '1548261231.000200',
            attachment_id: 1,
            channel_id: 'CBR2V3XEX',
            is_ephemeral: false,
            is_app_unfurl: false
          },
          trigger_id: '12321423423.333649436676.d8c1bb837935619ccad0f624c448ffb3',
          channel: {
            id: 'CBR2V3XEX',
            name: 'review-updates'
          },
          message: {
            bot_id: 'BAH5CA16Z',
            type: 'message',
            text: "This content can't be displayed.",
            user: 'UAJ2RU415',
            ts: '1548261231.000200'
          },
          response_url: 'https://hooks.slack.com/actions/AABA1ABCD/1232321423432/D09sSasdasdAS9091209',
          actions: [
            {
              action_id: 'some_other_button',
              block_id: '=qXel',
              text: {
                type: 'plain_text',
                text: 'View',
                emoji: true
              },
              value: '2020-01-04T16:37:12.000Z',
              type: 'button',
              action_ts: '1548426417.840180'
            }
          ]
        })
      })
    expect(response.statusCode).toBe(400)
  })
})
