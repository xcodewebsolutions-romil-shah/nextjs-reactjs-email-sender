// MUI Imports
import Grid from '@mui/material/Grid'

import EmailFollowUpTable from './EmailFollowUpTable'

// Component Imports

const EmailList = ({ userData }) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <EmailFollowUpTable tableData={userData} />
      </Grid>
    </Grid>
  )
}

export default EmailList
