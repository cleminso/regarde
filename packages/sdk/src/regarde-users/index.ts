export { registerNickname, checkNicknameAvailability } from "./nicknameApi";
export type {
  RegisterNicknameParams,
  CheckAvailabilityParams,
  CheckAvailabilityResponse,
  RegisterNicknameResponse,
} from "./types";
export {
  UserHandle,
  type UserHandleLoaded,
  setNicknameFromRegistry,
  deactivate,
} from "./userHandle";
