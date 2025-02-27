"use client";
import Profile from "@/components/Profile";
import { useUser } from "@/context/userContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const { userData } = useUser();

  return (
    <div className="min-h-screen  py-12 relative">
      <div className=" p-4 absolute top-0 right-0 ">
        <button
          onClick={() => router.push("/create-room")}
          className="bg-green-500 text-white px-3 py-2 rounded-md "
        >
          Create Room
        </button>
      </div>
      <Profile userData={userData} />
    </div>
  );
}
