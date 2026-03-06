import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { User, Phone, Briefcase, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export default function Profile() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [churchRole, setChurchRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setDisplayName(user.displayName || data.displayName || "");
          setPhoneNumber(data.phoneNumber || "");
          setChurchRole(data.churchRole || "");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      // Update Firebase Auth profile
      await updateProfile(user, { displayName });

      // Update Firestore user document
      await updateDoc(doc(db, "users", user.uid), {
        displayName,
        phoneNumber,
        churchRole,
        updatedAt: new Date().toISOString()
      });

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex h-64 items-center justify-center">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <PageHeader 
        title="Edit Details" 
        subtitle="Update your personal information and church role."
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Full Name"
            icon={User}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your full name"
            required
          />

          <Input
            label="Phone Number"
            icon={Phone}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g. +1 234 567 8900"
          />

          <Input
            label="Church Role / Department"
            icon={Briefcase}
            value={churchRole}
            onChange={(e) => setChurchRole(e.target.value)}
            placeholder="e.g. Youth Leader, Choir Member"
          />

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> {success}
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            className="w-full py-4"
            icon={Save}
          >
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
