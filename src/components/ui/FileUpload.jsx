"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

export default function FileUpload({
  name = "proof",
  accept = "image/*",
  required = false,
  label = "Receipt / Proof",
}) {
  const id = useId();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function applyFile(next) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next || null);
    setPreview(next ? URL.createObjectURL(next) : "");
  }

  function handleChange(e) {
    applyFile(e.target.files?.[0] || null);
  }

  function clearFile(e) {
    e.preventDefault();
    e.stopPropagation();
    if (inputRef.current) inputRef.current.value = "";
    applyFile(null);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped || !dropped.type.startsWith("image/")) return;
    const transfer = new DataTransfer();
    transfer.items.add(dropped);
    if (inputRef.current) inputRef.current.files = transfer.files;
    applyFile(dropped);
  }

  return (
    <div>
      <p className="mb-1 text-xs text-white/50">{label}</p>
      <input
        ref={inputRef}
        id={id}
        type="file"
        name={name}
        accept={accept}
        required={required}
        className="sr-only"
        onChange={handleChange}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer items-center gap-3 rounded-2xl border bg-black/40 px-3.5 py-3 transition ${
          dragging
            ? "border-magenta/50 shadow-[0_0_0_1px_rgba(255,105,180,0.25)]"
            : "border-white/10 hover:border-magenta/40"
        }`}
      >
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
            preview ? "border border-white/10" : "bg-pink-glow shadow-glow"
          }`}
        >
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-5 w-5 text-white" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white">
            {file ? file.name : "Upload receipt photo"}
          </span>
          <span className="mt-0.5 block text-[11px] text-white/40">
            {file ? "Tap to replace · PNG or JPG" : "Tap to choose · PNG or JPG"}
          </span>
        </span>
        {file ? (
          <button
            type="button"
            onClick={clearFile}
            className="rounded-full border border-white/10 p-1.5 text-white/50 transition hover:border-magenta/40 hover:text-white"
            aria-label="Remove file"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="shrink-0 rounded-full bg-pink-glow px-3 py-1.5 text-[11px] font-medium text-white">
            Choose
          </span>
        )}
      </div>
    </div>
  );
}
