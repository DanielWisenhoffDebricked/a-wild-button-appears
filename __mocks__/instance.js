/**
 * Describes a _test_ instance of a wildbutton installation.
 *
 * The structure of the Instance object in this file should always match the one in /instance.js
 * Otherwise something is wrong and things will get sad :(
 */
class Instance {
  constructor () {
    this.accessToken = 'xoxb-17653672481-19874698323-pdFZKVeTuE8sk7oOcBrzbqgy'
    this.team = {
      id: 'T9TK3CUKW',
      name: 'Test team'
    }
    this.channel = 'C00000000'
    this.manualAnnounce = false
    this.weekdays = 0b1111100
    this.intervalStart = 32400 // 09:00
    this.intervalEnd = 57600 // 16:00
    this.timezone = 'Europe/Copenhagen'
    this.scope = ''
    this.botUserId = 'U12121212'
    this.appId = 'A0KRD7HC3'
    this.authedUser = {
      id: 'U1234'
    }
    this.scheduled = {
      timestamp: 1582738633,
      messageId: ''
    }
  }
}

module.exports = {
  Instance
}