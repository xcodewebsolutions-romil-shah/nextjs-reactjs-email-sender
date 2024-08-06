'use client'

import { useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'

import { Button, Card, Typography, Checkbox } from '@mui/material'
import classnames from 'classnames'

import { collection, doc, getDocs, query, updateDoc, where, Timestamp } from 'firebase/firestore'

import TablePagination from '@mui/material/TablePagination'
import { toast } from 'react-toastify'

import { Client } from '@microsoft/microsoft-graph-client'

import { database } from '../../../../firebase/firebase.utils.js'
import FollowUpEmail from './FollowUpEmail.js'

import tableStyles from '@core/styles/table.module.css'

const columnHelper = createColumnHelper()

const EmailFollowUpTable = () => {
  const [userData, setUserData] = useState([])
  const [ids, setIds] = useState([])
  const router = useRouter()

  useEffect(() => {
    const tokenExpirationTime = localStorage.getItem('tokenExpirationTime')
    const currentTime = Date.now()

    if (tokenExpirationTime < currentTime) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('tokenExpirationTime')
      router.push('/en/login')
    }
  }, [userData, router])

  useEffect(() => {
    async function fetchData() {
      const data = await fetchDataFromFireStore()

      setUserData(data)
    }

    fetchData()
  }, [])

  const fetchDataFromFireStore = async () => {
    const currentTimeStamp = Timestamp.now()

    const snapShot = query(
      collection(database, 'data'),
      where('response', 'in', ['No-Response', '']),
      where('followUpNo', '<=', 4),
      where('expectedFollowupDateTimeStamp', '<=', currentTimeStamp)
    )

    const querySnapshot = await getDocs(snapShot)

    const data = []

    querySnapshot.forEach(doc => {
      data.push({ id: doc.id, ...doc.data() })
    })

    return data
  }

  const handleCheckbox = event => {
    const isChecked = event.target.checked

    const newIds = event.target.id

    if (isChecked === true) {
      setIds(prevIds => [...prevIds, newIds])
    } else if (isChecked === false) {
      setIds(prevIds => prevIds.filter(id => id !== newIds))
    }
  }

  const sendBulkEmails = async (id, followUpNo, conversationId, expectedFollowupDate) => {
    const token = localStorage.getItem('accessToken')

    if (token) {
      const client = Client.init({
        authProvider: async done => {
          done(null, token)
        }
      })

      setTimeout(async function () {
        const response = await client.api('/me/mailFolders/sentitems/messages').orderby('sentDateTime desc').get()

        const message = response.value.find(mssg => mssg.conversationId === conversationId)

        const newRecipientId = message.id

        const currentDate = expectedFollowupDate.toDate()
        const futureDate = new Date(currentDate)

        futureDate.setDate(currentDate.getDate() + 4)
        const futureDateInString = formatTimestamp(futureDate)
        const futureTimeStamp = Timestamp.fromDate(futureDate)

        await updateDoc(doc(database, 'data', id), {
          followUpNo: followUpNo,
          recipientId: newRecipientId,
          expectedFollowupDateTimeStamp: futureTimeStamp,
          expectedFollowupDate: futureDateInString
        })
        const data = await fetchDataFromFireStore()

        setUserData(data)
      }, 2000)
    }
  }

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

  const handleBulkEmails = async () => {
    try {
      const filteredIds = userData.filter(val1 => ids.includes(val1.id))
      let followUpNo
      let sent = false

      filteredIds.forEach(f => {
        ids.forEach(async i => {
          if (f.id === i) {
            if (f.recipientId && f.followUpNo === 1) {
              sent = true
              await FollowUpEmail(f.recipientId, f.followUpNo)
              followUpNo = 2
              await sendBulkEmails(f.id, followUpNo, f.conversationId, f.expectedFollowupDateTimeStamp)
            } else if (f.recipientId && f.followUpNo === 2) {
              sent = true
              await FollowUpEmail(f.recipientId, f.followUpNo)
              followUpNo = 3
              await sendBulkEmails(f.id, followUpNo, f.conversationId, f.expectedFollowupDateTimeStamp)
            } else if (f.recipientId && f.followUpNo === 3) {
              sent = true
              await FollowUpEmail(f.recipientId, f.followUpNo)
              followUpNo = 4
              await sendBulkEmails(f.id, followUpNo, f.conversationId, f.expectedFollowupDateTimeStamp)
            } else if (f.recipientId && f.followUpNo === 4) {
              sent = true
              await FollowUpEmail(f.recipientId, f.followUpNo)
              followUpNo = 5
              await sendBulkEmails(f.id, followUpNo, f.conversationId, f.expectedFollowupDateTimeStamp)
            }
          }
        })
      })

      if (sent) {
        toast('Mail sent successfully')
      }
    } catch (error) {
      console.log(error)
    }
  }

  const columns = useMemo(
    () => [
      {
        id: 'select',
        cell: ({ row }) => (
          <Checkbox
            id={row.original.id}
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            indeterminate={row.getIsSomeSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        )
      },
      columnHelper.accessor('company', {
        header: 'Company Name',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.company}</Typography>
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.email}</Typography>
      }),
      columnHelper.accessor('userName', {
        header: 'Contact Person',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary'>{row.original.userName}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('expectedFollowupDate', {
        header: 'Follow Up Date',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.expectedFollowupDate}</Typography>
      }),
      columnHelper.accessor('followUpNo', {
        header: 'Follow Up No',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.followUpNo}</Typography>
      })
    ],
    []
  )

  const table = useReactTable({
    data: userData,
    columns,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  return (
    <>
      <Card>
        <div className='flex justify-end p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <Button variant='contained' onClick={() => handleBulkEmails()} className='is-full sm:is-auto'>
            Send
          </Button>
        </div>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <>
                          <div
                            className={classnames({
                              'flex items-center': header.column.getIsSorted(),
                              'cursor-pointer select-none': header.column.getCanSort()
                            })}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <i className='ri-arrow-up-s-line text-xl' />,
                              desc: <i className='ri-arrow-down-s-line text-xl' />
                            }[header.column.getIsSorted()] ?? null}
                          </div>
                        </>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {table.getFilteredRowModel().rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    No data available
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table
                  .getRowModel()
                  .rows.slice(0, table.getState().pagination.pageSize)
                  .map(row => {
                    return (
                      <tr
                        key={row.id}
                        onClick={event => handleCheckbox(event)}
                        className={classnames({ selected: row.getIsSelected() })}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    )
                  })}
              </tbody>
            )}
          </table>
        </div>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          className='border-bs'
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          SelectProps={{
            inputProps: { 'aria-label': 'rows per page' }
          }}
          onPageChange={(_, page) => {
            table.setPageIndex(page)
          }}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />
      </Card>
    </>
  )
}

export default EmailFollowUpTable
