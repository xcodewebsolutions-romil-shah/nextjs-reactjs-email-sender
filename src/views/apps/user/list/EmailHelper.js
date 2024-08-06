import { Client } from '@microsoft/microsoft-graph-client'
import { toast } from 'react-toastify'

const emailTemplate = require('./emailTemplate')

const EmailHelper = async recipientEmail => {
  try {
    const token = localStorage.getItem('accessToken')

    if (token) {
      const client = Client.init({
        authProvider: async done => {
          done(null, token)
        }
      })

      const emailData = {
        message: {
          subject: 'Empower your business with XCode Web Solutions',
          body: {
            contentType: 'HTML',
            content: emailTemplate
          },
          toRecipients: [
            {
              emailAddress: {
                address: recipientEmail
              }
            }
          ]
        }
      }

      await client.api('/me/sendMail').post(emailData)

      toast('Email sent successfully')
    }
  } catch (error) {
    console.log('Error', error)
  }
}

export default EmailHelper
