import { Outlet, Link } from "react-router-dom";
import { useAccount, useIsAuthenticated } from "jazz-react";
import { AuthButton } from "./AuthButton.tsx";

export function Layout() {
  const { me } = useAccount();
  const isAuthenticated = useIsAuthenticated();

  return (
    <>
      <header className="bg-zinc-800 text-white shadow-lg">
        <nav className="container flex justify-between items-center py-4">
          <div>
            <Link to="/my-new-page" className="text-xl font-bold mr-6">
              onboarding.jazz
            </Link>
            <Link to="/" className="text-sm hover:text-slate-300">
              (Back to Jazz Starter)
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <span>
                {me?.profile?.name
                  ? `Hello, ${me.profile.name}`
                  : "Logged In"}{" "}
              </span>
            ) : (
              <span>Welcome, Guest! (New App Layout)</span>
            )}
            <AuthButton />{" "}
          </div>
        </nav>
      </header>

      <main className="container mt-8 py-6">
        <Outlet />
      </main>

      <footer className=""></footer>
    </>
  );
}
