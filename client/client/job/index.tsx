import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import axiosInstance from '..'

export const useGetAllJobsQuery = (params:{
    status?:string,
    sort?:string,
    page?:number
}) => {
    let query = ''
    if(params.status){
        query += `status=${params.status}`
    }
    if(params.sort){
        query += `&sort=${params.sort}`
    }
    if(params.page){
        query += `&page=${params.page}`
    }

    const { data, isLoading, error,refetch } = useQuery({
        queryKey: ['jobs',params],
        queryFn: async () => {
            const response = await axiosInstance.get(`/jobs?${query}`)
            return response.data
        }
    }
    )
    return { data:data?.jobs, isLoading, error,refetch,totalPages:data?.totalPages }
}
export const useCreateJobMutation = () => {
    const queryClient = useQueryClient()
    const { mutate, isPending, error } = useMutation({
        mutationFn: async (newJob) => {
            const response = await axiosInstance.post('/jobs', newJob)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['jobs']
            })
        }
    })
    return { mutate, isPending, error }
}
export const useGetJobByIdQuery= (id?:string) => {
    const { data, isLoading, error,refetch } = useQuery({
        queryKey: ['jobs', id],
        queryFn: async () => {
            const response = await axiosInstance.get(`/jobs/${id}`)
            return response.data
        },
        enabled: !!id
    })
    return { data, isLoading, error,refetch }
}