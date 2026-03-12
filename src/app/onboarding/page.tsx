"use client";

import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default function OnboardingPage() {
  const router = useRouter();
  const { saveProfile } = useProfile();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">Careo</h1>
          <p className="text-gray-900 font-semibold mt-3">あなたのことを教えてください</p>
          <p className="text-sm text-gray-400 mt-1">AIがあなたに合ったアドバイスをします</p>
        </div>
        <ProfileForm
          onSubmit={async (data) => {
            await saveProfile(data);
            router.push("/");
          }}
          submitLabel="はじめる →"
        />
      </div>
    </div>
  );
}
