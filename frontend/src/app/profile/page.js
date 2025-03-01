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
    <div className="flex flex-col md:flex-row w-full md:max-h-screen  bg-[#1c1e29] text-[#fff] ">
      {/* Left Panel - User Profile */}
      <div className="w-full md:w-1/4 md:h-screen bg-[#1c1e29] text-[#fff] p-6 border-r border-x-gray-500">
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
          <p className="">{userData?.email}</p>
        </div>
      </div>

      {/* Middle Section - Files */}
      <div className="w-full md:w-3/4 p-6 max-h-screen   ">
        <div className="flex justify-between items-center mb-6 border-b border-x-gray-500 pb-4">
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
        <div className=" text-[#fff] shadow-md  shadow-gray-500 md:overflow-y-auto md:max-h-[80vh] ">
          <div className="overflow-x-auto  ">
            <table className="w-full ">
              <thead className="bg-gray-900 text-[#fff] sticky top-0 left-0 z-10">
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
              <tbody className="">
                {userData?.files?.map((file, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-white bg-gray-700 hover:bg-gray-800"
                  >
                    <td className="py-3 px-4">
                      {file.name}
                      {file.extension}
                    </td>
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
