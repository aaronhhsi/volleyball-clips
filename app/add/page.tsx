import AddClipForm from '@/components/AddClipForm'
import Link from 'next/link'

export default function AddClipPage() {
  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to Gallery
          </Link>
        </div>
        
        <h1 className="text-4xl text-gray-600 font-bold mb-2">Add New Clip</h1>
        <p className="text-gray-600 mb-8">
          Add a volleyball clip from Instagram to your database
        </p>
        
        <div className="bg-black rounded-lg shadow-md p-8">
          <AddClipForm />
        </div>
      </div>
    </div>
  )
}