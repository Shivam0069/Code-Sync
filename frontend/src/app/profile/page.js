"use client";
import Profile from "@/components/Profile";
import { useRouter } from "next/navigation";

const sampleFiles = [
  { name: "document.txt", type: "txt" },
  { name: "script.js", type: "js" },
  { name: "analysis.py", type: "py" },
  { name: "image.jpg", type: "jpg" },
];

export default function ProfilePage() {
  const router = useRouter();
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
      <Profile
        username="John Doe"
        email="john.doe@example.com"
        avatarSrc="/placeholder.svg?height=128&width=128"
        files={sampleFiles}
      />
    </div>
  );
}
