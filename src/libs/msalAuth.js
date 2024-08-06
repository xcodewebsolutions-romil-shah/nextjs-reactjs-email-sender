import { PublicClientApplication } from '@azure/msal-browser'

const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_MSAL_TENANT_ID}`,
    redirectUri: process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI
  }
}

let pca

async function initializeMsal() {
  pca = new PublicClientApplication(msalConfig)
}

initializeMsal()

export function getMsalInstance() {
  if (!pca) {
    throw new Error('MSAL instance is not initialized.')
  }

  return pca
}
