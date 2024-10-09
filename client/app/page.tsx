'use client'
import MainComponent from "@/components/main"
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast';
export default function Home() {
  const queryClient = new QueryClient()
  return (
    
    <main className="min-h-screen p-24">
      <QueryClientProvider client={queryClient}><MainComponent />
      <Toaster />
      </QueryClientProvider>
    </main>
    
  )
}