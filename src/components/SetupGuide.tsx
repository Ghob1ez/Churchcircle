import React from 'react';
import { ShieldAlert, Copy, Check } from 'lucide-react';

interface SetupGuideProps {
  error: string;
}

export default function SetupGuide({ error }: SetupGuideProps) {
  const [copied, setCopied] = React.useState(false);

  const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is an admin
    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if isAdmin();
    }

    // Booking Requests
    match /bookingRequests/{requestId} {
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null;
      allow update, delete: if isAdmin();
    }

    // Bookings
    match /bookings/{bookingId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rules);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-8 bg-white border border-neutral-200 rounded-3xl shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-red-50 rounded-2xl">
          <ShieldAlert className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Firestore Permission Error</h2>
          <p className="text-neutral-500 text-sm">Your Security Rules are blocking access to the database.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-800">
          <p className="font-bold mb-1">Why is this happening?</p>
          <p className="mb-2">Firestore projects start in "Locked Mode" by default. You must explicitly allow your app to read and write data by updating your Security Rules in the Firebase Console.</p>
          <p className="font-bold mb-1 mt-3">Using iOS or an Ad-blocker?</p>
          <p>If you see a "Network Request Failed" error, it is likely because an ad-blocker or Safari's "Prevent Cross-Site Tracking" feature is blocking Firebase. Please try disabling ad-blockers or using a different browser.</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Required Security Rules</h3>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy Rules</>}
            </button>
          </div>
          <pre className="bg-neutral-900 text-neutral-300 p-4 rounded-2xl text-xs overflow-x-auto font-mono leading-relaxed">
            {rules}
          </pre>
        </div>

        <div className="pt-4 border-t border-neutral-100 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 mb-2">1. Apply Security Rules</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-600">
              <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Firebase Console</a>.</li>
              <li>Select your project and go to <strong>Firestore Database</strong>.</li>
              <li>Click on the <strong>Rules</strong> tab.</li>
              <li>Paste the code above and click <strong>Publish</strong>.</li>
            </ol>
          </div>

          <div>
            <h3 className="text-sm font-bold text-neutral-900 mb-2">2. Set Admin Role (Optional)</h3>
            <p className="text-sm text-neutral-600 mb-2">To access the Admin Dashboard, you must manually set your role to "admin" in the database:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-600">
              <li>Go to the <strong>Data</strong> tab in Firestore.</li>
              <li>Find the <code>users</code> collection and your user ID.</li>
              <li>Change the <code>role</code> field from <code>"member"</code> to <code>"admin"</code>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
