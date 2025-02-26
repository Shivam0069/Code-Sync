"use client";
import { useUser } from "@/context/userContext";
import { User } from "lucide-react";
import FileList from "./FileList";

export default function Profile({ userData }) {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
        {/* <Avatar src={avatarSrc} alt={userData.userName} size={128} /> */}
        <User className="w-20 h-20" />
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-bold">{userData?.userName}</h1>
          <p className="text-gray-600">{userData?.email}</p>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Files</h2>
        <FileList files={userData?.files} />
      </div>
    </div>
  );
}
