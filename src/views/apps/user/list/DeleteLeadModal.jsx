import React, { useState } from 'react'

import { Box, Button, Modal, DialogContentText } from '@mui/material'
import { toast } from 'react-toastify'
import { deleteDoc, doc } from 'firebase/firestore'

import { app, database } from '../../../../firebase/firebase.utils.js'

const DeleteLeadModal = ({ leadId, open, handleClose }) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async leadId => {
    try {
      setIsDeleting(true)
      await deleteDoc(doc(database, 'data', leadId))
      console.log('Document successfully deleted!')
    } catch (error) {
      console.error('Error deleting document: ', error)
    } finally {
      setIsDeleting(false)
    }

    toast('Lead deleted successfully')
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby='modal-modal-title'
      aria-describedby='modal-modal-description'
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 1
        }}
      >
        <DialogContentText id='modal-modal-title' variant='h6' component='h2' sx={{ mb: 4 }}>
          Are you sure you want to delete this lead?
        </DialogContentText>
        <Box sx={{ display: 'flex', justifyContent: 'left', gap: 2 }}>
          <Button
            sx={{
              backgroundColor: 'red',
              '&:hover': {
                backgroundColor: '#FF5A5A'
              }
            }}
            onClick={() => {
              handleDelete(leadId), handleClose()
            }}
            variant='contained'
            className='is-full sm:is-auto'
          >
            Yes
          </Button>
          <Button onClick={() => handleClose()} color='secondary' variant='outlined' className='is-full sm:is-auto'>
            No
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default DeleteLeadModal
