'use client'

import { useRouter } from 'next/navigation'

// MUI Imports
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

import { getMsalInstance } from '../libs/msalAuth'

const Login = () => {
  // Hooks
  const router = useRouter()

  async function getToken() {
    const loginRequest = {
      scopes: ['user.read', 'mail.send', 'mail.read']
    }

    try {
      const pca = getMsalInstance()

      await pca.initialize()
      const loginResponse = await pca.loginPopup(loginRequest)
      const getExTime = loginResponse.expiresOn
      const convertTimeInMs = new Date(getExTime)
      const timeInMs = convertTimeInMs.getTime()

      localStorage.setItem('tokenExpirationTime', timeInMs)
      localStorage.setItem('accessToken', loginResponse.accessToken)

      const accessToken = loginResponse.accessToken

      if (accessToken) {
        router.push('/en/apps/user/list')
      }

      return accessToken
    } catch (error) {
      console.log('Error acquiring token:', error)

      return null
    }
  }

  return (
    <div className='flex bs-full justify-center'>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'></div>
        <div className='flex flex-col gap-5 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset]'>
          <div>
            <Typography variant='h4'>Leads Login</Typography>
            <Typography>To continue, sign-in with your microsoft account</Typography>
          </div>
          <Button fullWidth variant='contained' onClick={getToken}>
            Login with Microsoft
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Login
