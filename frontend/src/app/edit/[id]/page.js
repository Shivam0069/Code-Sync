"use client";
import CodeMirrorEditor from "@/components/CodeMirror";
import axios from "axios";
import { use, useEffect, useRef, useState } from "react";
import { House, Save } from "lucide-react";
import { useRouter } from "next/navigation";

const FilePage = ({ params }) => {
  const unwrappedParams = use(params);
  const fileId = unwrappedParams.id;
  const [fileContent, setFileContent] = useState("");
  const [file, setFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const codeRef = useRef("");
  const router = useRouter();

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

  const handleSave = async (code) => {
    setIsSaving(true);
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/files/update`,
        {
          fileId: fileId,
          content: code,
        },
        { withCredentials: true }
      );
      setIsSaving(false);
    } catch (error) {
      console.error("Error saving code:", error);
      setIsSaving(false);
    }
  };

  if (!file) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen text-white bg-gray-900">
      {/* Left Panel */}
      <div className="w-64 bg-gray-800 p-4 flex flex-col border-r border-gray-700">
        <div className="border-b border-gray-700 mb-6 pb-4 mt-2 ">
          <House
            onClick={() => router.push("/profile")}
            className="cursor-pointer"
          />
        </div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold truncate">
            {file.name}
            {file.extension}
          </h1>
          <p className="text-gray-400 text-sm mt-1">File Editor</p>
        </div>

        <div className="mt-auto">
          <button
            onClick={() => {
              if (codeRef) handleSave(codeRef.current);
            }}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            <Save size={18} />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Right Panel - Editor */}
      <div className="flex-1 overflow-hidden">
        <CodeMirrorEditor
          initialCode={fileContent}
          fileId={fileId}
          onContentChange={(code) => (codeRef.current = code)}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default FilePage;
