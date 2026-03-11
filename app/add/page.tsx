import AddClipForm from '@/components/AddClipForm'
import Link from 'next/link'

export default function AddClipPage() {
  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-white hover:text-gray-300 flex items-center gap-2"
          >
            ← Back to Gallery
          </Link>
        </div>

        <h1 className="text-4xl text-white font-bold mb-2">Add New Clip</h1>
        <p className="text-gray-300 mb-8">
          Paste an Instagram reel URL and metadata — it will be downloaded and uploaded to YouTube automatically.
        </p>
        
        <div className="bg-black rounded-lg shadow-md p-8">
          <AddClipForm />
        </div>
      </div>
    </div>
  )
}