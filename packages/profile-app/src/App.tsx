import { useAccount, useIsAuthenticated, usePasskeyAuth } from "jazz-react";
import { Link, useNavigate } from "react-router-dom";
import { AuthButton } from "./AuthButton.tsx";
import { Button } from "./components/ui/button.tsx";
import { APPLICATION_NAME } from "./main.tsx";
import { ThemeToggle } from "./components/themeToggle.tsx"; // Added for the new header

export function App() {
  const { me } = useAccount({ resolve: { profile: true, root: true } });
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  const auth = usePasskeyAuth({
    appName: APPLICATION_NAME,
  });

  const handleLogin = async () => {
    try {
      await auth.logIn();
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      // Optionally, display an error message to the user
    }
  };

  const handleCreateProfile = async () => {
    try {
      await auth.signUp("");
      navigate("/edit");
    } catch (error) {
      console.error("Sign up failed:", error);
      // Optionally, display an error message to the user
    }
  };

  return (
    <>
      {/* Header from Layout.tsx */}
      <header className="bg-background text-card-foreground shadow-lg">
        <nav className="@container-normal flex justify-between items-center py-4 mx-16">
          <div>
            <Link to="/" className="text-xl font-bold mr-6">
              profile.jazz.dev
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
              <span></span>
            )}
            <ThemeToggle />
            <AuthButton />{" "}
          </div>
        </nav>
      </header>

      {/* Existing main content from the previous App.tsx version */}
      <main className="container mt-16 flex flex-col">
        {isAuthenticated ? (
          <div className="content-center">
            <h1 className="text-center">
              Welcome{me?.profile?.name ? <>, {me.profile.name}</> : ""}!
            </h1>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-6 py-12">
            <h1 className="text-4xl font-bold">profile.jazz.dev</h1>
            <p className="text-lg text-muted-foreground max-w-md">
              The last public profile you will ever need. Build one, share
              everywhere.
            </p>
            <div className="flex gap-4 mt-4">
              <Button size="lg" variant="outline" onClick={handleLogin}>
                Log in
              </Button>
              <Button size="lg" variant="default" onClick={handleCreateProfile}>
                Register Handle
              </Button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default App;
