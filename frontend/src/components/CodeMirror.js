"use client";
import React, { useEffect, useRef } from "react";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/python/python";
import "codemirror/mode/clike/clike"; // For C++ and similar languages
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import axios from "axios";

const CodeMirrorEditor = ({ initialCode, fileId }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    async function init() {
      console.log("initializing codemirror");
      if (editorRef.current) {
        editorRef.current.toTextArea(); // Removes the CodeMirror instance and restores the textarea
        editorRef.current = null;
      }

      editorRef.current = Codemirror.fromTextArea(
        document.getElementById("codeEditor"),
        {
          mode: { name: "javascript", json: true }, // Default mode
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
          value: initialCode || "", // Set initial code if provided
        }
      );
    }
    init();

    return () => {
      if (editorRef.current) {
        editorRef.current.toTextArea();
        editorRef.current = null;
      }
    };
  }, []); // Initialize CodeMirror only once

  // Update CodeMirror instance when initialCode changes
  useEffect(() => {
    if (editorRef.current && initialCode !== editorRef.current.getValue()) {
      editorRef.current.setValue(initialCode || "");
    }
  }, [initialCode]); // Watch for changes in initialCode

  const handleSave = async () => {
    const code = editorRef.current.getValue();
    console.log("Code to save:", code);
    try {
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/files/update`,
        {
          fileId: fileId, // Replace with actual file ID
          content: code,
        },
        { withCredentials: true }
      );
      console.log("Save successful:", res.data);
    } catch (error) {
      console.error("Error saving code:", error);
    }
  };

  return (
    <div className="relative">
      <textarea id="codeEditor"></textarea>
      <button
        onClick={handleSave}
        className="absolute bottom-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-md"
      >
        Save
      </button>
    </div>
  );
};

export default CodeMirrorEditor;
