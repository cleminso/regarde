export { registerNickname, checkNicknameAvailability } from "./nicknameApi";
export type {
  RegisterNicknameParams,
  CheckAvailabilityParams,
  TCheckAvailabilityResponse,
  RegisterNicknameResponse,
} from "./types";
export {
  UserHandle,
  type TUserHandleLoaded,
  setNicknameFromRegistry,
  deactivate,
} from "./userHandle";
