import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-black hover:bg-gray-800 text-white',
              card: 'shadow-lg',
            }
          }}
        />
      </div>
    </div>
  )
}
