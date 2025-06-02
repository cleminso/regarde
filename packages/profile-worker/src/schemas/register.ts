import { z } from "zod";

export const RegisterRequestSchema = z.object({
  nickname: z.string().describe(`
    New nickname to register. This field supports polymorphic behavior:
    - To REGISTER a new nickname: Provide the desired nickname (oldNickname should be empty)
    - To SWAP/UPDATE a nickname: Provide the new nickname along with oldNickname
    - To DELETE a nickname: Leave this empty and provide the nickname to delete in oldNickname
  `),
  jazzAccountID: z.string().min(1).describe("Jazz account ID that owns or will own the nickname"),
  oldNickname: z.string().default("").describe(`
    Current nickname to remove/swap from. This field supports polymorphic behavior:
    - To REGISTER a new nickname: Leave this empty (account must not have an existing nickname)
    - To SWAP/UPDATE a nickname: Provide the current nickname that the account owns
    - To DELETE a nickname: Provide the nickname to delete (nickname field should be empty)
  `)
}).refine((data) => {
  return data.nickname || data.oldNickname;
}, {
  message: "Either nickname or oldNickname must be provided",
  path: ["nickname"]
}).describe(`
  Polymorphic registration endpoint that supports three operations:
  
  1. REGISTER NEW NICKNAME:
     - nickname: "desired_name"
     - jazzAccountID: "account_id"
     - oldNickname: "" (empty)
  
  2. SWAP/UPDATE NICKNAME:
     - nickname: "new_name"
     - jazzAccountID: "account_id" 
     - oldNickname: "current_name"
  
  3. DELETE NICKNAME:
     - nickname: "" (empty)
     - jazzAccountID: "account_id"
     - oldNickname: "name_to_delete"
`);