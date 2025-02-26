// pages/files/[id].js
"use client";
import CodeMirrorEditor from "@/components/CodeMirror";
// Adjust the import path as needed
import axios from "axios";
import { use, useEffect, useState } from "react";

const FilePage = ({ params }) => {
  const unwrappedParams = use(params);
  const fileId = unwrappedParams.id;
  const [fileContent, setFileContent] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (fileId) {
      // Fetch file content when `fileId` is available
      axios
        .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/files/getFile/${fileId}`, {
          withCredentials: true,
        })
        .then((response) => {
          setFile(response.data?.file);
          setFileContent(response.data.file.content);
        })
        .catch((error) => {
          console.error("Error fetching file content:", error);
        });
    }
  }, [fileId]); // Fetch data whenever `fileId` changes

  if (!fileContent) {
    return <div>Loading...</div>; // Show a loading state while fetching
  }

  return (
    <div className="text-white relative">
      <h1 className="absolute top-0 right-0 text-lg p-2 text-white z-50">
        {file.name}
        {file.extension}
      </h1>
      <CodeMirrorEditor initialCode={fileContent} fileId={fileId} />
    </div>
  );
};

export default FilePage;
