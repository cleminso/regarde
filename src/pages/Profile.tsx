import { ProfileEditor } from "../components/profile/editor";

export function Profile() {
  return (
    <div className="flex flex-col items-center gap-8">
      <h1 className="text-3xl font-bold">Welcome to Onboarding Jazz!</h1>
      <p className="text-lg">
        Start your Jazz journey by creating your public profile.
      </p>
      <ProfileEditor />
    </div>
  );
}
