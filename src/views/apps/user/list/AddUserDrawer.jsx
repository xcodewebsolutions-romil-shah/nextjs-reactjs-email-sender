// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

// Firebase
import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore'

import { toast } from 'react-toastify'

import { Client } from '@microsoft/microsoft-graph-client'

import EmailHelper from './EmailHelper'

import { app, database } from '../../../../firebase/firebase.utils.js'

// Vars
const initialData = {
  userName: '',
  email: '',
  company: '',
  country: '',
  business: 'IT',
  recipientId: '',
  conversationId: '',
  initialDateAndTime: '',
  followUpNo: 1
}

const AddUserDrawer = ({ open, handleClose }) => {
  // States
  const [formData, setFormData] = useState(initialData)
  let docId

  const formatTimestamp = timestamp => {
    const date = new Date(timestamp)

    const options = {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }

    return date.toLocaleString('en-US', options)
  }

  const handleSendEmail = async () => {
    try {
      const token = localStorage.getItem('accessToken')

      if (token) {
        const client = Client.init({
          authProvider: async done => {
            done(null, token)
          }
        })

        const recipientEmail = formData.email
        const snapShot = query(collection(database, 'data'), where('email', '==', formData.email))

        const querySnapshot = await getDocs(snapShot)

        if (!querySnapshot.empty) {
        } else if (formData.country.length > 0) {
          const currentTimeStamp = Timestamp.now()
          const currentDate = currentTimeStamp.toDate()
          const currentDateInString = formatTimestamp(currentDate)
          const futureDate = new Date(currentDate)

          futureDate.setDate(currentDate.getDate() + 3)
          const futureDateInString = formatTimestamp(futureDate)
          const futureTimeStamp = Timestamp.fromDate(futureDate)

          await EmailHelper(recipientEmail)

          const queryOptions = {
            select: 'id, conversationId',
            search: `"to:${recipientEmail}"`
          }

          setTimeout(async function () {
            const id = await client.api(`/me/mailFolders/sentitems/messages`).query(queryOptions).top(1).get()

            const recipientId = id.value[0].id
            const conversationId = id.value[0].conversationId

            await updateDoc(doc(database, 'data', docId), {
              recipientId: recipientId,
              conversationId: conversationId,
              followUpNo: formData.followUpNo,
              initialDateAndTimeTimeStamp: currentTimeStamp,
              initialDateAndTime: currentDateInString,
              expectedFollowupDateTimeStamp: futureTimeStamp,
              expectedFollowupDate: futureDateInString
            })
          }, 2000)
        }
      }
    } catch (error) {
      console.log('error', error)
      toast(error)
    }
  }

  const writeFireStore = async formData => {
    try {
      const docRef = await addDoc(collection(database, 'data'), {
        userName: formData.userName,
        company: formData.company,
        email: formData.email,
        country: formData.country,
        business: formData.business,
        response: ''
      })

      docId = docRef.id
    } catch (error) {
      console.log('error', error)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()

    try {
      const snapShot = query(collection(database, 'data'), where('email', '==', formData.email))

      const querySnapshot = await getDocs(snapShot)

      if (!querySnapshot.empty) {
        toast('Mail already exists in Database')
      } else {
        await writeFireStore(formData)

        toast('Lead added successfully')

        handleClose()
        setFormData(initialData)
      }
    } catch (error) {
      console.log('Error checking duplicate email:', error)
    }
  }

  const handleReset = () => {
    handleClose()
    setFormData({
      userName: '',
      email: '',
      company: '',
      country: '',
      business: 'IT'
    })
  }

  return (
    <>
      <Drawer
        open={open}
        anchor='right'
        variant='temporary'
        onClose={handleReset}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
      >
        <div className='flex items-center justify-between pli-5 plb-[15px]'>
          <Typography variant='h5'>Add New Lead</Typography>
          <IconButton onClick={handleReset}>
            <i className='ri-close-line' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
            <TextField
              label='Company'
              fullWidth
              value={formData.company}
              onChange={e => setFormData({ ...formData, company: e.target.value })}
              required
            />
            <TextField
              label='Email'
              fullWidth
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <TextField
              label='Contact Person'
              fullWidth
              value={formData.userName}
              onChange={e => setFormData({ ...formData, userName: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel id='country'>Select Country</InputLabel>
              <Select
                fullWidth
                id='country'
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                label='Select Country'
                labelId='country'
                inputProps={{ placeholder: 'Country' }}
                required
              >
                <MenuItem value='UK'>UK</MenuItem>
                <MenuItem value='USA'>USA</MenuItem>
                <MenuItem value='Australia'>Australia</MenuItem>
                <MenuItem value='Germany'>Germany</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <Select
                fullWidth
                id='Business'
                value={formData.business}
                onChange={e => setFormData({ ...formData, business: e.target.value })}
                labelId='Business'
                inputProps={{ placeholder: 'Business' }}
                required
              >
                <MenuItem value='IT'>IT</MenuItem>
                <MenuItem value='NON-IT'>NON-IT</MenuItem>
              </Select>
            </FormControl>
            <div className='flex items-center gap-4'>
              <Button variant='contained' type='submit'>
                Save
              </Button>
              <Button variant='outlined' color='error' type='submit-send' onClick={() => handleSendEmail()}>
                Save & Send
              </Button>
            </div>
          </form>
        </div>
      </Drawer>
    </>
  )
}

export default AddUserDrawer
