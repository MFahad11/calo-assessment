'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCw, Plus, X, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,} from "lucide-react"
import { useCreateJobMutation, useGetAllJobsQuery, useGetJobByIdQuery } from '@/client/job'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Pagination from '../pagination'
import Loader from '../ui/loader'
import Error from '../ui/error'


export default function MainComponent() {
  const [selectedJob, setSelectedJob] = useState<{
    id: string
    status: string
    createdAt: string
    result?: string
    error?: string
  } | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const {
    data:jobs,
    isLoading,
    error,
    refetch,
    totalPages
  }=useGetAllJobsQuery({
    status:statusFilter,
    sort:sortOrder,
    page:currentPage
  })
  const {
    data:jobData,
    isLoading:jobIsLoading,
    error:jobError
  }=useGetJobByIdQuery(selectedJob?.id)
  const {
    mutate:createJob,
    isPending,
    error:createError
  }=useCreateJobMutation()
  const handleRefresh = () => {
    refetch()
  }

  const handleCreateJob = () => {
    createJob()
  }
  const handlePageChange = (page:number) => {
    setCurrentPage(page)
  }
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Job Management</h1>
      <div className="flex justify-between mb-4">
        <Button onClick={handleCreateJob}>
          <Plus className="mr-2 h-4 w-4" /> Create New Job
        </Button>
        <div className="flex space-x-2">
          <Select value={statusFilter} onValueChange={
            (value:string) => {
              setStatusFilter(value)
              setCurrentPage(1)
            }
          }>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={
            (value:string) => {
              setSortOrder(value)
              setCurrentPage(1)
            }
          }>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>
      {
        isLoading ? (
          <Loader/>
        ) : error ? (
          <Error message='An error occurred while fetching jobs' />
        ) : (
            <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {
                  jobs?.length>=1 ? (jobs?.map((job:{
                    id: string
                    status: string
                    createdAt: string
                    result?: string
                  }) => (
                    <TableRow key={job.id}>
                      <TableCell>{job.id}</TableCell>
                      <TableCell>{job.status}</TableCell>
                      <TableCell>{new Date(job.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="link" onClick={() => setSelectedJob(job)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))):(
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">No Jobs Found</TableCell>
                    </TableRow>
                  )
                }
              </TableBody>
            </Table>
            {
              totalPages>=1 && (<Pagination currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />)
            }
            
            
            </div>
        )
      }
      <Dialog open={(selectedJob !== null
        && jobData?.id
      )} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
            {jobIsLoading && <Loader/>}
            {jobError && <Error 
              message='An error occurred while fetching job details'
            />}
          {jobData && (
            <div>
              <p><strong>Job ID:</strong> {jobData.id}</p>
              <p><strong>Status:</strong> {jobData.status}</p>
              <p><strong>Created At:</strong> {new Date(jobData.createdAt).toLocaleString()}</p>
              {(jobData.status === 'completed' && jobData.result) && (
                <div>
                  <p><strong>Result:</strong></p>
                  <Link href={jobData.result} target="_blank" className="mt-2 block max-w-full h-auto">
                  View Result
                  </Link>
                </div>
              )}
              {jobData.status === 'failed' && (
                <p><strong>Error:</strong> {jobData.error}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}