"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useState, useEffect } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!filename) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/status/${filename}`);
      const data = await res.json();
      if (data.ready) {
        setReady(true);
        setLoading(false)
        clearInterval(interval);
      }
    }, 2000); // poll every 2s

    return () => clearInterval(interval);
  }, [filename]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    
    setLoading(true);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setFilename(data.filename);

    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div className="flex flex-col items-center mt-20">
      <div className="text-9xl font-bold">BitTorr</div>
      <div className="text-2xl font-light text-blue-500">
        Upload a .torrent file
      </div>
      <form
        onSubmit={handleSubmit}
        className="mt-4 flex flex-col items-center gap-4"
      >
        <div>
          <Input
            id="file"
            type="file"
            accept=".torrent"
            onChange={handleFileChange}
          />
        </div>
        {!loading ? (
          <Button type="submit" disabled={!file}>
            Upload
          </Button>
        ) : (
          <div>
            <Spinner></Spinner> loading
          </div>
        )}
      </form>
      {ready && filename && (
        <a
          href={`/downloads/${filename}`}
          className="text-blue-600 underline mt-4"
          download
        >
          Download your file
        </a>
      )}
    </div>
  );
}
