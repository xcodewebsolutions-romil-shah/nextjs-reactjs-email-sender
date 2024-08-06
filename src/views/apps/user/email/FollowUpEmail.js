import { Client } from '@microsoft/microsoft-graph-client'

const emailTemplateFollowUp1 = require('./emailTemplateFollowUp1')
const emailTemplateFollowUp2 = require('./emailTemplateFollowUp2')
const emailTemplateFollowUp3 = require('./emailTemplateFollowUp3')
const emailTemplateFollowUp4 = require('./emailTemplateFollowUp4')

const FollowUpEmail = async (threadId, followUpNo) => {
  try {
    const token = localStorage.getItem('accessToken')

    if (token) {
      const client = Client.init({
        authProvider: async done => {
          done(null, token)
        }
      })

      let emailData

      if (followUpNo === 1) {
        emailData = {
          subject: 'Just a Quick Follow-up Regarding Our Proposal (1st Follow-up)',
          comment: `${emailTemplateFollowUp1}`
        }
      } else if (followUpNo === 2) {
        emailData = {
          comment: `${emailTemplateFollowUp2}`
        }
      } else if (followUpNo === 3) {
        emailData = {
          comment: `${emailTemplateFollowUp3}`
        }
      } else if (followUpNo === 4) {
        emailData = {
          comment: `${emailTemplateFollowUp4}`
        }
      }

      await client.api(`/me/messages/${threadId}/replyAll`).post(emailData)
    }
  } catch (error) {
    console.log('Error', error)
  }
}

export default FollowUpEmail
