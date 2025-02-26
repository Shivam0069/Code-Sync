"use client";
import { useUser } from "@/context/userContext";
import {
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function FileList({ files }) {
  const router = useRouter();
  const { deleteFile } = useUser();
  const getFileIcon = (type) => {
    switch (type) {
      case ".txt":
        return <FileTextIcon className="w-6 h-6 text-blue-500" />;
      case ".js":
        return <FileCodeIcon className="w-6 h-6 text-yellow-500" />;
      case ".py":
        return <FileCodeIcon className="w-6 h-6 text-green-500" />;
      default:
        return <FileIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <ul className="space-y-2">
      {files?.map((file, index) => (
        <li
          key={index}
          className=" cursor-pointer flex items-center justify-between space-x-2 p-2 bg-gray-100 rounded"
        >
          <div className="flex space-x-2 items-center">
            {getFileIcon(file.extension)}
            <span>{file.name}</span>
          </div>
          <div className="flex space-x-2 items-center">
            <Pencil
              onClick={() => {
                router.push(`/edit/${file.fileId}`);
              }}
              className=" text-green-600"
            />
            <Trash2
              onClick={() => {
                deleteFile({ fileId: file.fileId });
              }}
              className="text-red-600"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
