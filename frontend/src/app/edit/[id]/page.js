"use client";
import CodeMirrorEditor from "@/components/CodeMirror";
import axios from "axios";
import { use, useEffect, useRef, useState } from "react";
import { House, PanelLeft, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ai from "../../../assets/ai.jpg";
import Image from "next/image";
import Modal from "@/components/Model";
import askGemini from "@/helper/Gemini";
import Loader from "@/components/Loader";

const FilePage = ({ params }) => {
  const unwrappedParams = use(params);
  const fileId = unwrappedParams.id;
  const [fileContent, setFileContent] = useState("");
  const [file, setFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [askAIOpen, setAskAIOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [askCode, setAskCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLeftMenuOpen, setIsLeftMenuOpen] = useState(false);
  const codeRef = useRef("");
  const router = useRouter();

  const askHandler = async () => {
    if (question.trim() === "") return;

    try {
      setLoading(true);
      const result = await askGemini(codeRef.current, question); // Await the async call

      const codeOnly =
        result.match(/```(?:\w+)?\n([\s\S]*?)```/)?.[1] || result;

      console.log("Gemini Response:\n", codeOnly);

      setAskCode(codeOnly); // Triggers useEffect to update CodeMirror
      setAskAIOpen(false);
    } catch (err) {
      console.error("Error from Gemini:", err);
    } finally {
      setLoading(false);
    }
  };

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
      toast.success("File saved successfully!");
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
    <div className="flex h-screen text-white bg-gray-900 relative">
      {loading && <Loader />}
      {/* Left Panel */}
      <div className="hidden md:flex w-64 bg-gray-800 p-4 flex-col border-r border-gray-700">
        <div className="border-b border-gray-700 mb-6 pb-4 mt-2 ">
          <House
            onClick={() => router.push("/profile")}
            className="cursor-pointer"
          />
        </div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold truncate">
            {file.name}
            {/* {file.extension} */}
          </h1>
          <p className="text-gray-400 text-sm mt-1">File Editor</p>
        </div>

        <div className="mt-auto flex flex-col gap-4">
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
          <button
            onClick={() => setAskAIOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            <Image
              src={ai}
              alt="AI"
              width={40}
              height={40}
              className="rounded"
            />
            Ask Gemini
          </button>
        </div>
      </div>
      {isLeftMenuOpen ? (
        <X
          className="text-white cursor-pointer absolute top-3 left-4 z-40 md:hidden"
          onClick={() => setIsLeftMenuOpen(false)}
        />
      ) : (
        <PanelLeft
          className="text-white w-4 h-4 cursor-pointer absolute top-3 left-4 z-40 md:hidden"
          onClick={() => setIsLeftMenuOpen(true)}
        />
      )}
      {isLeftMenuOpen && (
        <div className="md:hidden flex w-full bg-gray-800 p-4 flex-col border-r border-gray-700">
          <div className="border-b border-gray-700 mb-6 pb-4 mt-2 flex justify-end">
            <House
              onClick={() => router.push("/profile")}
              className="cursor-pointer "
            />
          </div>
          <div className="mb-6">
            <h1 className="text-xl font-semibold truncate">
              {file.name}
              {/* {file.extension} */}
            </h1>
            <p className="text-gray-400 text-sm mt-1">File Editor</p>
          </div>

          <div className="mt-auto flex flex-col gap-4">
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
            <button
              onClick={() => setAskAIOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              <Image
                src={ai}
                alt="AI"
                width={40}
                height={40}
                className="rounded"
              />
              Ask Gemini
            </button>
          </div>
        </div>
      )}

      {/* Right Panel - Editor */}
      {!isLeftMenuOpen && (
        <div className="flex-1 overflow-hidden">
          <CodeMirrorEditor
            initialCode={fileContent}
            fileId={fileId}
            onContentChange={(code) => (codeRef.current = code)}
            onSave={handleSave}
            geminiCode={askCode}
          />
        </div>
      )}

      {askAIOpen && (
        <Modal
          title="Ask Gemini"
          onClose={() => {
            setAskAIOpen(false);
            setQuestion("");
          }}
        >
          <textarea
            onChange={(e) => setQuestion(e.target.value)}
            value={question}
            className="w-full h-32 p-2 border border-gray-700 rounded-md bg-gray-800 text-white"
            placeholder="Type your question here..."
          ></textarea>
          <button
            onClick={askHandler}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            {loading ? "Generating..." : "Ask"}
          </button>
        </Modal>
      )}
    </div>
  );
};

export default FilePage;
