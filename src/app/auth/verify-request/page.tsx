import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px] border-gray-200">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900">Check your email</CardTitle>
          <CardDescription className="text-gray-600">
            A sign in link has been sent to your email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">
            Please check your inbox and click the link in the email to continue.
            The link will expire in 24 hours.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}