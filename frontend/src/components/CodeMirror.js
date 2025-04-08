"use client";
import { useEffect, useRef, useState } from "react";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/python/python";
import "codemirror/mode/clike/clike"; // For C++ and similar languages
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";

const CodeMirrorEditor = ({
  initialCode,
  fileId,
  onContentChange,
  onSave,
  geminiCode,
}) => {
  const editorRef = useRef(null);
  const [currentContent, setCurrentContent] = useState(initialCode || "");

  useEffect(() => {
    async function init() {
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
          lineWrapping: true,
        }
      );

      // Add change event listener
      editorRef.current.on("change", (editor) => {
        const value = editor.getValue();
        onContentChange(value);
      });

      // Add keyboard shortcut for save (Ctrl+S or Cmd+S)
      editorRef.current.setOption("extraKeys", {
        "Ctrl-S": (cm) => {
          if (onSave) onSave(cm.getValue());
        },
        "Cmd-S": (cm) => {
          if (onSave) onSave(cm.getValue());
        },
      });
    }
    init();

    return () => {
      if (editorRef.current) {
        editorRef.current.toTextArea();
        editorRef.current = null;
      }
    };
  }, [initialCode, onContentChange, onSave]); // Initialize CodeMirror only once

  // Update CodeMirror instance when initialCode changes
  useEffect(() => {
    if (editorRef.current && initialCode !== editorRef.current.getValue()) {
      editorRef.current.setValue(initialCode || "");
    }
  }, [initialCode]); // Watch for changes in initialCode
  useEffect(() => {
    if (
      geminiCode.length > 0 &&
      editorRef.current &&
      geminiCode !== editorRef.current.getValue()
    ) {
      editorRef.current.setValue(geminiCode || "");
    }
  }, [geminiCode]); // Watch for changes in initialCode

  return (
    <div className="h-full">
      <textarea id="codeEditor" className="h-full w-full"></textarea>
    </div>
  );
};

export default CodeMirrorEditor;
