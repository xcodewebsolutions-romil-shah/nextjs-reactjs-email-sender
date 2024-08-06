'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback } from 'react'

// MUI Imports

import { useRouter } from 'next/navigation.js'

import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'

// Third-party Imports
import classnames from 'classnames'
import Papa from 'papaparse'
import { rankItem } from '@tanstack/match-sorter-utils'
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

// Firebase Imports

import { collection, doc, getDocs, updateDoc, Timestamp, addDoc } from 'firebase/firestore'

import { Client } from '@microsoft/microsoft-graph-client'

import { toast } from 'react-toastify'

import { database } from '../../../../firebase/firebase.utils.js'

// Component Imports
import AddUserDrawer from './AddUserDrawer'
import DeleteLeadModal from './DeleteLeadModal'
import EditLeadModal from './EditLeadModal'
import EmailHelper from './EmailHelper.js'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const fuzzyFilter = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  // States
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])
  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

// Column Definitions
const columnHelper = createColumnHelper()

const UserListTable = () => {
  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [usersData, setUsersData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [leadId, setLeadId] = useState()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [csvData, setCsvData] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const tokenExpirationTime = localStorage.getItem('tokenExpirationTime')
    const currentTime = Date.now()

    if (tokenExpirationTime < currentTime) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('tokenExpirationTime')
      router.push('/en/login')
    }
  }, [usersData, router])

  useEffect(() => {
    setTimeout(() => {
      async function fetchData() {
        const data = await fetchDataFromFirestore()

        setUsersData(data)
      }

      fetchData()
    }, 2000)
  }, [deleteModalOpen, addUserOpen, editModalOpen, csvData])

  const handleImportCSV = () => {
    const inputElement = document.createElement('input')

    inputElement.type = 'file'
    inputElement.accept = '.csv'
    inputElement.addEventListener('change', handleOnChange)
    inputElement.click()
  }

  const handleOnChange = event => {
    const file = event.target.files[0]

    Papa.parse(file, {
      header: true,
      complete: results => {
        setCsvData(results.data)
        handleStoreToFirestore(results.data)
      }
    })
  }

  const handleStoreToFirestore = data => {
    data.forEach(async (row, index) => {
      if (Object.values(row).length > 1) {
        await addDoc(collection(database, 'data'), {
          company: row.company ? row.company : '',
          userName: row.userName ? row.userName : '',
          email: row.email ? row.email : '',
          business: row.business ? row.business : '',
          country: row.country ? row.country.toUpperCase() : ''
        })
      }
    })
  }

  const fetchDataFromFirestore = async () => {
    const querySnapshot = await getDocs(collection(database, 'data'))

    const data = []

    querySnapshot.forEach(doc => {
      data.push({ id: doc.id, ...doc.data() })
    })

    return data
  }

  const handleEmail = async event => {
    const id = event.currentTarget.id

    try {
      const token = localStorage.getItem('accessToken')

      if (token) {
        const client = Client.init({
          authProvider: async done => {
            done(null, token)
          }
        })

        const messages = await client
          .api('/me/mailFolders/sentitems/messages')
          .select('id')
          .select('toRecipients')
          .get()

        const emails = messages.value.map(obj1 => ({
          id: obj1.id,
          emailId: obj1.toRecipients[0].emailAddress.address
        }))

        const filteredEmails = usersData.filter(val1 => !emails.some(({ emailId }) => val1.email === emailId))

        let found

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

        filteredEmails.find(c => {
          usersData.find(async u => {
            if (id === c.id) {
              found = true
              await EmailHelper(c.email)
              const currentTimeStamp = Timestamp.now()

              const currentDate = currentTimeStamp.toDate()
              const currentDateInString = formatTimestamp(currentDate)

              const futureDate = new Date(currentDate)

              futureDate.setDate(currentDate.getDate() + 3)

              const futureDateInString = formatTimestamp(futureDate)
              const futureTimeStamp = Timestamp.fromDate(futureDate)

              const queryOptions = {
                select: 'id, conversationId',
                search: `"to:${c.email}"`
              }

              setTimeout(async function () {
                const res = await client.api(`/me/mailFolders/sentitems/messages`).query(queryOptions).top(1).get()

                const recipientId = res.value[0].id
                const conversationId = res.value[0].conversationId

                await updateDoc(doc(database, 'data', id), {
                  initialDateAndTimeTimeStamp: currentTimeStamp,
                  initialDateAndTime: currentDateInString,
                  expectedFollowupDateTimeStamp: futureTimeStamp,
                  expectedFollowupDate: futureDateInString,
                  recipientId: recipientId,
                  conversationId: conversationId,
                  followUpNo: 1
                })

                const data = await fetchDataFromFirestore()

                setUsersData(data)
              }, 2000)
            }
          })
        })

        if (!found) {
          toast('Mail already sent to user')
        }
      }
    } catch (error) {
      console.log('ERROR', error)
    }
  }

  const columns = useMemo(
    () => [
      // {
      //   id: 'select',
      //   header: ({ table }) => (
      //     <Checkbox
      //       {...{
      //         checked: table.getIsAllRowsSelected(),
      //         indeterminate: table.getIsSomeRowsSelected(),
      //         onChange: table.getToggleAllRowsSelectedHandler()
      //       }}
      //     />
      //   ),
      //   cell: ({ row }) => (
      //     <Checkbox
      //       {...{
      //         checked: row.getIsSelected(),
      //         disabled: !row.getCanSelect(),
      //         indeterminate: row.getIsSomeSelected(),
      //         onChange: row.getToggleSelectedHandler()
      //       }}
      //     />
      //   )
      // },
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
      columnHelper.accessor('country', {
        header: 'Country',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.country}
          </Typography>
        )
      }),
      columnHelper.accessor('business', {
        header: 'Business',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.business}</Typography>
      }),
      columnHelper.accessor('Initial D&T', {
        header: 'Initial D&T',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.initialDateAndTime}</Typography>
      }),
      columnHelper.accessor('Status', {
        header: 'Response',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.response}</Typography>
      }),
      columnHelper.accessor('Notes', {
        header: 'Notes',
        cell: ({ row }) => (
          <div>
            <Typography color='text.primary' variant='body1' style={{ whiteSpace: 'pre-line' }}>
              {row.original.notes}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('delete', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <IconButton id={row.original.id} onClick={e => handleEmail(e)}>
              <i className='ri-send-plane-2-line text-[22px] text-textSecondary' />
            </IconButton>
            <IconButton onClick={() => (setLeadId(row.original.id), setEditModalOpen(!editModalOpen))}>
              <i className='ri-edit-box-line text-[22px]' />
            </IconButton>
            <IconButton onClick={() => (setLeadId(row.original.id), setDeleteModalOpen(!deleteModalOpen))}>
              <i className='ri-delete-bin-7-line text-[22px] text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usersData]
  )

  const table = useReactTable({
    data: usersData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    enableRowSelection: true,

    // enableRowSelection: row => row.original.age > 18, // or enable row selection conditionally per row
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
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
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search User'
            className='is-full sm:is-auto'
          />
          <div className='flex gap-4'>
            <Button variant='contained' onClick={handleImportCSV} className='is-full sm:is-auto'>
              Import CSV
            </Button>

            <Button variant='contained' onClick={() => setAddUserOpen(!addUserOpen)} className='is-full sm:is-auto'>
              Add New Lead
            </Button>
          </div>
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
                            onClick={header.column.getToggleSortingHandler()}
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
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
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
      <AddUserDrawer open={addUserOpen} handleClose={() => setAddUserOpen(!addUserOpen)} />
      <DeleteLeadModal
        leadId={leadId}
        open={deleteModalOpen}
        handleClose={() => setDeleteModalOpen(!deleteModalOpen)}
      />
      <EditLeadModal leadId={leadId} open={editModalOpen} handleClose={() => setEditModalOpen(!editModalOpen)} />
    </>
  )
}

export default UserListTable
