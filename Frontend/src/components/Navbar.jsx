import { NavLink } from "react-router-dom";

function Navbar() {
  const linkClass = ({ isActive }) =>
    isActive
      ? "text-blue-400 font-semibold"
      : "text-gray-300 hover:text-blue-400 transition";

  return (
    <nav className="bg-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <h1 className="text-2xl font-bold text-blue-400">
          AI Workspace 🚀
        </h1>

        {/* Navigation */}
        <div className="flex gap-8">

          <NavLink to="/" className={linkClass}>
            Home
          </NavLink>

          <NavLink to="/upload" className={linkClass}>
            Upload
          </NavLink>

          <NavLink to="/chat" className={linkClass}>
            Chat
          </NavLink>

          <NavLink to="/code" className={linkClass}>
            Code Generator
          </NavLink>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;