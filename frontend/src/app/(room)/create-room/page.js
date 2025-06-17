"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";
import Image from "next/image";
import { useUser } from "@/context/userContext";
import logo from "../../../assets/code-sync.png";
import { House } from "lucide-react";

const Home = () => {
  const router = useRouter();
  const { userData } = useUser();

  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState(userData?.userName || "");

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidV4();
    setRoomId(id);
    toast.success("Created a new room");
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("Room Id & Username is required");
      return;
    }
    localStorage.setItem("username", username);

    // Redirect to the editor page
    router.push(`/editor/${roomId}`);
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  return (
    <div className="homePageWrapper ">
      <div className="formWrapper">
        <div className="flex justify-between ">
          <Image
            className="homePageLogo"
            src={logo.src}
            alt="Code Sync Logo"
            width={200}
            height={50}
            priority
          />
          <House
            onClick={() => router.push("/profile")}
            className="cursor-pointer hover:scale-125 transition-all duration-300 ease-in-out"
          />
        </div>
        <h4 className="mainLabel">Paste invitation ROOM ID</h4>
        <div className="inputGroup ">
          <input
            type="text"
            className="inputBox text-black placeholder:text-gray-600"
            placeholder="Room Id"
            onChange={(e) => setRoomId(e.target.value)}
            value={roomId}
            onKeyUp={handleInputEnter}
          />
          <input
            type="text"
            className="inputBox text-black placeholder:text-gray-600 "
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            onKeyUp={handleInputEnter}
          />
          <button className="btn joinBtn" onClick={joinRoom}>
            Join
          </button>
          <span className="createInfo">
            If you don't have an invite, then create &nbsp;
            <button onClick={createNewRoom} className="createNewBtn">
              New Room
            </button>
          </span>
        </div>
      </div>
      <footer>
        <h4>
          Built with 💛 by &nbsp;
          <a
            href="https://github.com/Shivam0069/RealTimeCodeEditor"
            target="_blank"
            rel="noopener noreferrer"
          >
            Shivam Singh
          </a>
        </h4>
      </footer>
    </div>
  );
};

export default Home;
