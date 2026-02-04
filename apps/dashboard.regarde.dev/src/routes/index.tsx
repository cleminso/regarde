import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { useRegardeAuth } from "@regarde-dev/core/react";

export const Route = createFileRoute("/")({
  component: RegardeAuthComponent,
});

function RegardeAuthComponent() {
  const { state, signUp, logIn, logOut, regardeSDK } = useRegardeAuth();
  const [input, setInput] = useState("");

  const isSignedIn = state === "signedIn";

  if (isSignedIn === true) {
    return (
      <div>
        <div>Welcome! Account loaded.</div>
        <div>SDK Version: {regardeSDK?.version}</div>
        <button onClick={logOut}>Log Out</button>
      </div>
    );
  }

  return (
    <div>
      <h3>Sign Up</h3>
      <button
        onClick={async () => {
          const result = await signUp("my-username");
          alert(`SAVE THIS:\n\nPassphrase:\n${result.passphrase}\n\nAccount ID:\n${result.accountId}`);
        }}
      >
        Create Account
      </button>

      <h3>Log In</h3>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your BIP39 passphrase"
        rows={5}
      />
      <button onClick={() => logIn(input)}>Log In</button>
    </div>
  );
}
