import { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import API from "../api/api";
import CodeBlock from "../components/CodeBlock";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaBrain } from "react-icons/fa";

function CodeGenerator() {
  const [task, setTask] = useState("");
  const [language, setLanguage] = useState("python");
  const [runTests, setRunTests] = useState(false);

  const [result, setResult] = useState(null);

  // Current editable code
  const [generatedCode, setGeneratedCode] = useState("");

  // Original AI generated code
  const [originalCode, setOriginalCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [explaining, setExplaining] = useState(false);

  const generateCode = async (e) => {
    e.preventDefault();

    if (!task.trim()) return;

    setLoading(true);
    setExplanation("");
    setGeneratedCode("");
    setOriginalCode("");
    setResult(null);

    try {
      const formData = new FormData();

      formData.append("user_task", task);
      formData.append("language", language);
      formData.append("run_tests", runTests);

      const response = await API.post(
        "/generate_code",
        formData
      );

      setResult(response.data);

      setGeneratedCode(response.data.code);
      setOriginalCode(response.data.code);

    } catch (err) {
      console.error(err);

      setResult({
        code: "Failed to generate code.",
        notes: "An unexpected error occurred.",
      });

      setGeneratedCode("Failed to generate code.");
      setOriginalCode("Failed to generate code.");
    }

    setLoading(false);
  };

  const resetCode = () => {
    setGeneratedCode(originalCode);
  };
  const explainCode = async () => {
    if (!generatedCode) return;

    setExplaining(true);

    try {
      const formData = new FormData();

      formData.append("code", generatedCode);
      formData.append("language", language);

      const response = await API.post(
        "/explain_code",
        formData
      );

      setExplanation(response.data.explanation);

    } catch (err) {
      console.error(err);

      setExplanation(
        "Unable to generate explanation."
      );

    } finally {
      setExplaining(false);
    }
  };

  const downloadCode = () => {
    if (!generatedCode) return;

    const extensions = {
      python: "py",
      cpp: "cpp",
      c: "c",
      java: "java",
      javascript: "js",
    };

    const blob = new Blob([generatedCode], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = `generated.${extensions[language] || "txt"}`;

    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">

        {/* Header */}

        <div className="mb-10">

          <h1 className="text-4xl font-bold text-white">
            🤖 AI Code Generator
          </h1>

          <p className="text-gray-400 mt-2">
            Generate production-ready code using AI.
          </p>

        </div>

        {/* Form */}

        <form
          onSubmit={generateCode}
          className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl"
        >

          <label className="block mb-3 text-lg font-semibold">
            Describe your task
          </label>

          <textarea
            rows={6}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Example: Create a Binary Search Tree in C++"
            className="w-full rounded-xl bg-slate-900 border border-slate-700 p-4 outline-none focus:border-blue-500"
          />

          <div className="flex flex-wrap items-center gap-6 mt-6">

            <div>

              <label className="block mb-2 font-semibold">
                Language
              </label>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3"
              >
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
              </select>

            </div>

            <label className="flex items-center gap-3 mt-7">

              <input
                type="checkbox"
                checked={runTests}
                onChange={(e) => setRunTests(e.target.checked)}
              />

              Run Tests

            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-7 bg-blue-600 hover:bg-blue-700 transition px-8 py-3 rounded-xl font-semibold shadow-lg disabled:bg-gray-600"
            >
              {loading ? "Generating..." : "Generate Code"}
            </button>

          </div>

        </form>

        {/* Output */}

        {result && (

          <div className="mt-10">

            <div className="flex justify-between items-center mb-4">

              <h2 className="text-2xl font-bold">
                Generated Code
              </h2>

              <div className="flex gap-3">

                <button
                  onClick={downloadCode}
                  className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg transition"
                >
                  Download
                </button>

                <button
                  onClick={explainCode}
                  disabled={explaining}
                  className="flex
                            items-center
                            gap-2
                            bg-purple-600
                            hover:bg-purple-700
                            disabled:bg-gray-600
                            px-5
                            py-2
                            rounded-lg
                            transition
                            "
                >
                  <FaBrain />

                  {explaining
                    ? "Explaining..."
                    : "Explain Code"}

                </button>

              </div>

            </div>

            <CodeBlock
              language={language}
              code={generatedCode}
              setCode={setGeneratedCode}
              onReset={resetCode}
            />

            {/* AI Notes */}

            {result.notes && (

              <div className="mt-6 bg-slate-800 border border-slate-700 rounded-xl p-5">

                <h3 className="text-lg font-semibold mb-3">
                  AI Notes
                </h3>

                <p className="text-gray-300">
                  {result.notes}
                </p>

              </div>

            )}

            {/* Execution Output */}

            {result.execution_output && (

              <div className="mt-6 bg-black border border-green-700 rounded-xl p-5">

                <h3 className="text-lg font-semibold text-green-400 mb-3">
                  Execution Output
                </h3>

                <pre className="text-green-300 whitespace-pre-wrap">
                  {result.execution_output}
                </pre>

              </div>

            )}
            {/* AI Explanation */}

            {explanation && (

              <div className="mt-8">

                <h2 className="text-2xl font-bold mb-4">
                  🧠 AI Explanation
                </h2>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">

                  <div
                    className="prose
                               prose-invert
                               max-w-none
                               prose-headings:text-blue-300
                               prose-strong:text-white
                               prose-code:text-cyan-300"
                  >

                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {explanation}
                    </ReactMarkdown>

                  </div>

                </div>

              </div>

            )}

          </div>

        )}

      </div>
    </MainLayout>
  );
}


export default CodeGenerator;