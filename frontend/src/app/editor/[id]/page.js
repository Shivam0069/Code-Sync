"use client";
import ACTIONS from "@/Actions";
import { use, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import Client from "@/components/Client";
import Editor from "@/components/Editor";
import Modal from "@/components/Model";
import { useUser } from "@/context/userContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import Image from "next/image";
import ai from "../../../assets/ai.jpg";
import askGemini from "@/helper/Gemini";
import Loader from "@/components/Loader";

const EditorPage = ({ params }) => {
  const socketRef = useRef(null);
  const codeRef = useRef("");
  const router = useRouter();
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.id;
  const [clients, setClients] = useState([]);
  const [initialCode, setInitialCode] = useState("");
  const { createFile, userData } = useUser();
  const [question, setQuestion] = useState("");
  const [askAIOpen, setAskAIOpen] = useState(false);
  const [askCode, setAskCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Voice chat state
  const [isInVoiceChat, setIsInVoiceChat] = useState(false);
  const [isListening, setIsListening] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const audioRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const rtp_aud_sendersRef = useRef({});
  const audioElementsRef = useRef({});
  const [fileType, setFileType] = useState("new");

  const [importedFileId, setImportedFileId] = useState("");
  const username = useRef(
    userData?.userName ||
      localStorage.getItem("username") ||
      `User-${Math.floor(Math.random() * 1000)}`
  );

  const [showImportModal, setShowImportModal] = useState(false);

  // Function to handle file import selection
  const handleFileImport = async (file) => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/files/getFile/${file.fileId}`,
        {
          withCredentials: true,
        }
      );
      if (res.status == 200) {
        setInitialCode(res.data?.file?.content);
        codeRef.current = res.data?.file?.content;
        toast.success("File imported successfully");
        setFileType("imported");
        setImportedFileId(file.fileId);
      }
    } catch (error) {
      console.log("Error importing file:", error);
      toast.error("Error importing file");
    } finally {
      setShowImportModal(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target.result;
      setInitialCode(fileContent);

      codeRef.current = fileContent; // Update the codeRef with the file content
      setFileType("uploaded");
      socketRef.current.emit(ACTIONS.CODE_CHANGE, {
        roomId,
        code: fileContent,
      });
    };
    reader.readAsText(file); // Read the file as text
  };

  const iceConfiguration = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
      {
        urls: "stun:stun1.l.google.com:19302",
      },
    ],
  };

  async function loadAudio() {
    try {
      // Only get a new stream if we don't already have one
      if (!audioRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        audioRef.current = stream.getAudioTracks()[0];
        audioRef.current.enabled = !isAudioMuted; // Set initial state based on mute status
      }
      return audioRef.current;
    } catch (e) {
      console.error("Error getting audio stream:", e);
      toast.error("Could not access microphone");
      return null;
    }
  }

  function createAudioElement(connId) {
    if (!audioElementsRef.current[connId]) {
      const audioEl = document.createElement("audio");
      audioEl.id = `audio_${connId}`;
      audioEl.autoplay = true;
      document.body.appendChild(audioEl);
      audioElementsRef.current[connId] = audioEl;
    }

    console.log("audioElementsRef", audioElementsRef);

    return audioElementsRef.current[connId];
  }

  function connection_status(connection) {
    if (
      connection &&
      (connection.connectionState === "new" ||
        connection.connectionState === "connecting" ||
        connection.connectionState === "connected")
    ) {
      return true;
    } else {
      return false;
    }
  }

  async function updateMediaSenders(track) {
    for (const connId in peerConnectionsRef.current) {
      if (connection_status(peerConnectionsRef.current[connId])) {
        if (
          rtp_aud_sendersRef.current[connId] &&
          rtp_aud_sendersRef.current[connId].track
        ) {
          rtp_aud_sendersRef.current[connId].replaceTrack(track);
        } else {
          rtp_aud_sendersRef.current[connId] =
            peerConnectionsRef.current[connId].addTrack(track);
        }
      }
    }
  }

  function removeMediaSenders() {
    for (const connId in peerConnectionsRef.current) {
      if (
        rtp_aud_sendersRef.current[connId] &&
        connection_status(peerConnectionsRef.current[connId])
      ) {
        peerConnectionsRef.current[connId].removeTrack(
          rtp_aud_sendersRef.current[connId]
        );
        rtp_aud_sendersRef.current[connId] = null;
      }
    }
  }

  async function setConnection(connid) {
    const connection = new RTCPeerConnection(iceConfiguration);

    connection.onnegotiationneeded = async function () {
      await setOffer(connid);
    };

    connection.onicecandidate = function (event) {
      if (event.candidate) {
        socketRef.current.emit("SDPProcess", {
          message: JSON.stringify({ icecandidate: event.candidate }),
          to_connid: connid,
        });
      }
    };

    connection.ontrack = function (event) {
      if (event.track.kind === "audio") {
        const audioEl = createAudioElement(connid);
        const remoteStream = new MediaStream();
        remoteStream.addTrack(event.track);
        audioEl.srcObject = remoteStream;
      }
    };

    peerConnectionsRef.current[connid] = connection;

    // If audio is already enabled, add it to the new connection
    if (audioRef.current && !isAudioMuted) {
      rtp_aud_sendersRef.current[connid] = connection.addTrack(
        audioRef.current
      );
    }

    return connection;
  }

  async function setOffer(connid) {
    const connection = peerConnectionsRef.current[connid];
    try {
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);

      socketRef.current.emit("SDPProcess", {
        message: JSON.stringify({
          offer: connection.localDescription,
        }),
        to_connid: connid,
      });
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }

  async function SDPProcess(message, from_connid) {
    message = JSON.parse(message);

    if (message.answer) {
      await peerConnectionsRef.current[from_connid].setRemoteDescription(
        new RTCSessionDescription(message.answer)
      );
    } else if (message.offer) {
      if (!peerConnectionsRef.current[from_connid]) {
        await setConnection(from_connid);
      }

      await peerConnectionsRef.current[from_connid].setRemoteDescription(
        new RTCSessionDescription(message.offer)
      );

      const answer = await peerConnectionsRef.current[
        from_connid
      ].createAnswer();
      await peerConnectionsRef.current[from_connid].setLocalDescription(answer);

      socketRef.current.emit("SDPProcess", {
        message: JSON.stringify({
          answer: answer,
        }),
        to_connid: from_connid,
      });
    } else if (message.icecandidate) {
      if (!peerConnectionsRef.current[from_connid]) {
        await setConnection(from_connid);
      }

      try {
        await peerConnectionsRef.current[from_connid].addIceCandidate(
          message.icecandidate
        );
      } catch (e) {
        console.error("Error adding ICE candidate:", e);
      }
    }
  }

  useEffect(() => {
    const init = async () => {
      socketRef.current = io(process.env.NEXT_PUBLIC_BACKEND_URL);

      socketRef.current.on("connect", () => {
        if (socketRef.current.connected) {
          console.log("Connected to server", socketRef.current.id);

          socketRef.current.emit(ACTIONS.JOIN, {
            roomId,
            username: username.current,
          });
        }
      });

      socketRef.current.on("new_user", async ({ username, connection_id }) => {
        console.log("new user", username, connection_id);

        setClients((prevUsers) => {
          // Check if this client is already in the list
          const exists = prevUsers.some(
            (user) => user.connection_id === connection_id
          );
          if (exists) return prevUsers;

          return [...prevUsers, { username, connection_id }];
        });

        await setConnection(connection_id);
      });

      socketRef.current.on("old_users", async ({ clients }) => {
        setClients(clients);

        // Setup connections with all existing clients
        await Promise.all(
          clients.map(async (client) => {
            if (client.connection_id !== socketRef.current.id) {
              await setConnection(client.connection_id);
            }
          })
        );
      });

      socketRef.current.on("SDPProcess", async function (data) {
        await SDPProcess(data.message, data.from_connid);
      });

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId }) => {
        // Remove the disconnected client from the list
        setClients((prev) =>
          prev.filter((client) => client.connection_id !== socketId)
        );

        // Close and clean up the peer connection
        if (peerConnectionsRef.current[socketId]) {
          peerConnectionsRef.current[socketId].close();
          delete peerConnectionsRef.current[socketId];
          delete rtp_aud_sendersRef.current[socketId];

          // Clean up audio element
          if (audioElementsRef.current[socketId]) {
            audioElementsRef.current[socketId].remove();
            delete audioElementsRef.current[socketId];
          }
        }
      });
    };

    if (roomId) {
      init();
    }

    return () => {
      // Clean up all audio elements
      Object.values(audioElementsRef.current).forEach((el) => {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });

      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach((conn) => {
        if (conn) {
          conn.close();
        }
      });

      // Stop audio track if it exists
      if (audioRef.current) {
        audioRef.current.enabled = false;
        const tracks = [audioRef.current];
        tracks.forEach((track) => {
          if (track) track.stop();
        });
      }

      socketRef.current?.disconnect();
    };
  }, [roomId]);

  async function muteUnMuteHandler() {
    console.log("rtp_aud_sendersRef", rtp_aud_sendersRef.current);
    try {
      // Make sure we have audio access
      if (!audioRef.current) {
        await loadAudio();
      }

      if (!audioRef.current) {
        toast.error("Audio permission has not been granted");
        return;
      }

      if (isAudioMuted) {
        // Unmute - just enable the track instead of creating a new one
        audioRef.current.enabled = true;
        await updateMediaSenders(audioRef.current);
        setIsAudioMuted(false);
        toast.success("Microphone activated");
      } else {
        // Mute - just disable the track instead of stopping it
        audioRef.current.enabled = false;
        setIsAudioMuted(true);
        toast.success("Microphone muted");

        // Note: We're no longer stopping or nullifying the track
        // This allows us to re-enable it later without having to request permissions again
      }
    } catch (error) {
      console.error("Error toggling mute:", error);
      toast.error("Could not toggle microphone");
    }
  }

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard");
    } catch (err) {
      toast.error("Could not copy the Room ID");
    }
  }

  function leaveRoom() {
    if (socketRef.current) {
      socketRef.current.emit(ACTIONS.LEAVE);
      socketRef.current.disconnect();
    }
    router.push("/profile");
  }

  function downloadHandler() {
    if (!codeRef.current) {
      toast.error("No code to download");
      return;
    }

    // Prompt user for file name and type
    const fileName = prompt("Enter file name (without extension):", "code");
    if (!fileName) return; // If user cancels, stop execution

    const fileType = prompt(
      "Enter file extension (e.g., txt, js, py, cpp):",
      "txt"
    );
    if (!fileType) return; // If user cancels, stop execution

    const validExtensions = ["txt", "js", "py", "cpp"];
    if (!validExtensions.includes(fileType)) {
      toast.error("Invalid file type. Please enter a valid extension.");
      return;
    }

    const blob = new Blob([codeRef.current], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.${fileType}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const saveCodeHandler = async () => {
    if (fileType === "imported") {
      try {
        const res = await axios.put(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/files/update`,
          {
            fileId: importedFileId,
            content: codeRef.current,
          },
          { withCredentials: true }
        );
        if (res.status == 200) {
          toast.success("File updated successfully");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error updating file");
      }
      return;
    }

    const content = codeRef.current;
    if (!content) {
      toast.error("No code to save");
      return;
    }

    // Prompt user for file name and type
    const fileName = prompt("Enter file name:", "code");
    if (!fileName) return; // If user cancels, stop execution

    // const extension = prompt(
    //   "Enter file extension (e.g., txt, js, py, cpp):",
    //   "txt"
    // );
    // if (!extension) return; // If user cancels, stop execution

    // const validExtensions = ["txt", "js", "py", "cpp"];
    // if (!validExtensions.includes(extension)) {
    //   toast.error("Invalid file type. Please enter a valid extension.");
    //   return;
    // }
    const fileData = { name: fileName, content: content, extension: ".txt" };

    try {
      const res = await createFile(fileData);
      if (res) toast.success("File saved successfully");
    } catch (error) {
      toast.error("Error saving file");
      console.error("Error saving file:", error);
    }
  };

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
      setQuestion("");
    }
  };

  return (
    <div className="mainWrap relative w-full h-screen">
      {loading && <Loader />}
      <div className="absolute bottom-10 right-4 z-40 flex space-x-2">
        {/* Import Button - New */}
        <button
          onClick={() => setShowImportModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-purple-700 transition"
        >
          Import
        </button>

        {/* Upload Button */}
        <label
          htmlFor="fileInput"
          className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700 transition"
        >
          Upload File
        </label>
        <input
          id="fileInput"
          type="file"
          accept=".txt,.cpp,.py,.js"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Download Button */}
        <button
          onClick={downloadHandler}
          className="bg-green-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-green-700 transition"
        >
          Download
        </button>

        {/* Save Button */}
        <button
          onClick={saveCodeHandler}
          className="bg-yellow-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-yellow-700 transition"
        >
          Save
        </button>
      </div>

      <div className="aside">
        <div className="asideInner">
          <h3>Connected Users</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client
                key={client.connection_id}
                username={client.username}
                MicButton={muteUnMuteHandler}
                isSelf={client.connection_id === socketRef.current?.id}
                isAudioMuted={isAudioMuted}
              />
            ))}
          </div>
        </div>

        <button className="btn copyBtn" onClick={copyRoomId}>
          Copy Room ID
        </button>
        <button className="btn leaveBtn" onClick={leaveRoom}>
          Leave Room
        </button>
        <button
          onClick={() => setAskAIOpen(true)}
          className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          <Image src={ai} alt="AI" width={40} height={40} className="rounded" />
          Ask Gemini
        </button>
      </div>
      <div className="editorWrap">
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          onCodeChange={(code) => {
            codeRef.current = code;
          }}
          initialCode={initialCode}
          geminiCode={askCode}
        />
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <Modal
          title="Import from Saved Files"
          onClose={() => setShowImportModal(false)}
        >
          <div className="overflow-y-auto max-h-64 scroll-smooth scrollbar-hide">
            {userData?.files && userData.files.length > 0 ? (
              <div className="grid gap-2">
                {userData.files.map((file, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleFileImport(file)}
                    className="flex justify-between items-center p-3 bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer transition"
                  >
                    <div className="flex items-center">
                      <span className="text-lg font-medium">
                        {file?.name}
                        {file?.extension}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(file?.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No saved files found.</p>
            )}
          </div>
        </Modal>
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

export default EditorPage;
