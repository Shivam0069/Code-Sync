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
import ACTIONS from "@/Actions";

const Editor = ({ onCodeChange, socketRef, roomId, initialCode }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    async function init() {
      if (editorRef.current) {
        editorRef.current.toTextArea(); // Removes the CodeMirror instance and restores the textarea
        editorRef.current = null;
      }

      editorRef.current = Codemirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: { name: "javascript", json: true }, // Default mode
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
          value: initialCode || "", // Set initial code if provided
        }
      );

      editorRef.current.on("change", (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        if (origin !== "setValue") {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
        }
      });
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

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null && code !== editorRef.current.getValue()) {
          editorRef.current.setValue(code);
        }
      });
    }

    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE);
    };
  }, [socketRef.current]);

  return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;
