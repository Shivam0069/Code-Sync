"use client";

import { useUser } from "@/context/userContext";
import { Edit, Plus, Trash, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Profile() {
  const router = useRouter();
  const { userData, deleteFile } = useUser();
  console.log(userData);

  const handleEdit = (id) => {
    console.log("Edit file with id:", id);
    router.push(`/edit/${id}`);
  };

  const handleDelete = (id) => {
    console.log("Delete file with id:", id);
    deleteFile({ fileId: id });
  };

  const handleCreateRoom = () => {
    console.log("Create room clicked");
    router.push("/create-room");
  };

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen bg-gray-50">
      {/* Left Panel - User Profile */}
      <div className="w-full md:w-1/4 bg-white p-6 shadow-md">
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 rounded-full flex items-center justify-center overflow-hidden mb-4">
            {/* <Image
              src={user.avatar || "/placeholder.svg"}
              alt="User profile"
              fill
              className="object-cover"
            /> */}
            <User className="w-20 h-20" />
          </div>
          <h2 className="text-xl font-bold">{userData?.userName}</h2>
          <p className="text-gray-600">{userData?.email}</p>
        </div>
      </div>

      {/* Middle Section - Files */}
      <div className="w-full md:w-3/4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Files</h1>
          <button
            onClick={handleCreateRoom}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Create Room
          </button>
        </div>

        {/* Files List */}
        <div className="bg-white rounded-md shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    createdAt
                  </th>

                  <th className="text-right py-3 px-4 font-semibold text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {userData?.files?.map((file, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">{file.name}</td>
                    <td className="py-3 px-4">
                      {new Date(file?.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleEdit(file.fileId)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(file.fileId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {userData?.files.length === 0 && (
            <div className="py-8 text-center text-gray-500">No files found</div>
          )}
        </div>
      </div>
    </div>
  );
}
