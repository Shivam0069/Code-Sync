"use client";
import Loader from "@/components/Loader";
import Profile from "@/components/Profile";
import { useUser } from "@/context/userContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const { userData, isAuth, isLoading } = useUser();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isAuth && !isLoading) {
      router.push("/login");
    }
    if (isAuth && !isLoading) {
      setLoading(false);
    }
  }, [isAuth, isLoading]);

  if (isLoading || loading) {
    return <Loader />;
  }

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
