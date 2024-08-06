'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'

// Next Imports
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import { styled } from '@mui/material/styles'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'

// Third-party Imports
import { Client } from '@microsoft/microsoft-graph-client'

import { getMsalInstance } from '../../../libs/msalAuth'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Styled component for badge content
const BadgeContentSpan = styled('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: 'var(--mui-palette-success-main)',
  boxShadow: '0 0 0 2px var(--mui-palette-background-paper)'
})

const UserDropdown = () => {
  // States
  const [open, setOpen] = useState(false)
  const [userAccount, setUserAccount] = useState(null)

  // Refs
  const anchorRef = useRef(null)

  // Hooks
  const router = useRouter()
  const { settings } = useSettings()
  const { lang: locale } = useParams()
  const pca = getMsalInstance()

  useEffect(() => {
    getUserAccount()
  }, [])

  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      router.push('/en/apps/user/list')
    } else {
      router.push('/en/login')
    }
  }, [])

  const getUserAccount = async () => {
    try {
      const token = localStorage.getItem('accessToken')

      if (token) {
        const client = Client.init({
          authProvider: async done => {
            done(null, token)
          }
        })

        const userProfile = await client.api('/me').get()

        setUserAccount(userProfile)

        return userProfile
      }
    } catch (error) {
      console.error('Error getting user account:', error)
    }
  }

  const handleDropdownOpen = () => {
    !open ? setOpen(true) : setOpen(false)
  }

  const handleDropdownClose = (event, url) => {
    if (url) {
      router.push(getLocalizedUrl(url, locale))
    }

    if (anchorRef.current && anchorRef.current.contains(event?.target)) {
      return
    }

    setOpen(false)
  }

  const handleUserLogout = async () => {
    try {
      await pca.initialize()
      await pca.logoutPopup()
      localStorage.removeItem('accessToken')
      localStorage.removeItem('tokenExpirationTime')
      router.push('/en/login')
    } catch (error) {
      console.log('ERROR', error)
    }
  }

  return (
    <>
      <Badge
        ref={anchorRef}
        overlap='circular'
        badgeContent={<BadgeContentSpan onClick={handleDropdownOpen} />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        className='mis-2'
      >
        <Avatar
          ref={anchorRef}
          alt={userAccount?.displayName || ''}
          onClick={handleDropdownOpen}
          className='cursor-pointer bs-[38px] is-[38px]'
        />
      </Badge>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[240px] !mbs-4 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top'
            }}
          >
            <Paper className={settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'}>
              <ClickAwayListener onClickAway={e => handleDropdownClose(e)}>
                <MenuList>
                  <div className='flex items-center plb-2 pli-4 gap-2' tabIndex={-1}>
                    <Avatar alt={userAccount?.name || ''} />
                    <div className='flex items-start flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        {userAccount?.displayName || ''}
                      </Typography>
                      <Typography variant='caption'>{userAccount?.mail || ''}</Typography>
                    </div>
                  </div>
                  <Divider className='mlb-1' />
                  <div className='flex items-center plb-2 pli-4'>
                    <Button
                      fullWidth
                      variant='contained'
                      color='error'
                      size='small'
                      endIcon={<i className='ri-logout-box-r-line' />}
                      onClick={handleUserLogout}
                      sx={{ '& .MuiButton-endIcon': { marginInlineStart: 1.5 } }}
                    >
                      Logout
                    </Button>
                  </div>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default UserDropdown
