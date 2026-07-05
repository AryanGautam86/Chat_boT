import { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import API from "../api/api";

function Upload() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("title", title);
      formData.append("content", content);

      const response = await API.post("/upload", formData);

      setMessage(response.data.message);

      setTitle("");
      setContent("");
    } catch (error) {
      console.error(error);
      setMessage("Upload Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">

        <h1 className="text-5xl font-bold mb-10 text-center">
          Upload Documents
        </h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg text-center font-semibold ${
              message.includes("success")
                ? "bg-green-600"
                : "bg-red-600"
            }`}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={handleUpload}
          className="bg-slate-800 p-8 rounded-xl shadow-lg space-y-6"
        >

          <input
            type="text"
            placeholder="Document Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-4 rounded-lg bg-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <textarea
            rows="10"
            placeholder="Document Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 rounded-lg bg-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-8 py-3 rounded-lg font-semibold transition"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>

        </form>

      </div>
    </MainLayout>
  );
}

export default Upload;