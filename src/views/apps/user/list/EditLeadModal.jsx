import React, { useState } from 'react'

import { Box, Button, Modal, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material'
import { doc, updateDoc } from 'firebase/firestore'

import { app, database } from '../../../../firebase/firebase.utils.js'

const EditLeadModal = ({ open, handleClose, leadId }) => {
  const [notes, setNotes] = useState()
  const [response, setResponse] = useState('')

  const submitResponse = async leadId => {
    try {
      if (response.length > 0) {
        await updateDoc(doc(database, 'data', leadId), {
          response: response
        })
      }

      if (notes.length > 0) {
        await updateDoc(doc(database, 'data', leadId), {
          notes: notes
        })
      }
    } catch (error) {
      console.log('Error', error)
    }
  }

  const handleResponse = event => {
    if (event.target.name === leadId) {
      setResponse(event.target.value)
    }
  }

  const handleNotes = event => {
    if (event.target.name === leadId) {
      setNotes(event.target.value)
    }
  }

  const clearValues = () => {
    handleClose()
    setResponse('')
    setNotes('')
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
        <FormControl fullWidth style={{ marginBottom: '16px' }}>
          <InputLabel id={leadId}>Select Response</InputLabel>
          <Select
            fullWidth
            label='Select Response'
            labelId='Response'
            value={response}
            name={leadId}
            inputProps={{ placeholder: 'Response' }}
            onChange={e => handleResponse(e)}
          >
            <MenuItem value='No-Response'>No-Response</MenuItem>
            <MenuItem value='Positive'>Positive</MenuItem>
            <MenuItem value='Negative'>Negative</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label='Notes'
          fullWidth
          multiline
          value={notes}
          name={leadId}
          rows={4}
          style={{ marginBottom: '16px' }}
          onChange={e => handleNotes(e)}
        />
        <Box sx={{ display: 'flex', justifyContent: 'left', gap: 2 }}>
          <Button
            onClick={() => (submitResponse(leadId), clearValues())}
            variant='contained'
            className='is-full sm:is-auto'
          >
            Save
          </Button>
          <Button onClick={() => clearValues()} variant='contained' className='is-full sm:is-auto'>
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default EditLeadModal
