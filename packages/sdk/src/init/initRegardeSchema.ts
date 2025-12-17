import { Account, co, Group } from "jazz-tools";
import { RegardeSDK, RegardeAuth } from "../auth/schemas/auth";
import { UserHandle } from "../regarde-users";
import { PaymentManager, ListOfPaymentEvents, App } from "../payments/schemas";
import { z } from "zod";

/**
 * Initializes the Regarde SDK schema for a user account.
 * This sets up the root `RegardeSDK` object, including:
 * - Connecting to the official Regarde Worker group for shared permissions.
 * - Creating the `UserHandle` (profile).
 * - Initializing the `RegardeAuth` token container.
 * - Setting up `PaymentManager` and app lists.
 */
export const initRegardeSchema = async (
    account: Account,
): Promise<co.loaded<typeof RegardeSDK>> => {
    // 1. Load the Official Regarde Worker Group
    // This group acts as a "bridge" to allow the worker to access user data.
    const regardeProfileWorkerGroup = await co
        .group()
        .load("co_zoppoxWWJaHYKPgSgUkuCCXQX21", {
            loadAs: account,
        });

    if (!regardeProfileWorkerGroup.$isLoaded) {
        console.error(
            "[ERROR] No public group found. Check: (1) Network connectivity, (2) Worker account ID is correct: co_zoppoxWWJaHYKPgSgUkuCCXQX21, (3) Jazz network is accessible from your environment",
        );
        throw new Error("Group not available");
    }

    // 2. Create a "User Group" owned by the user
    const userGroup = Group.create({
        owner: account,
    });

    // 3. Add the Worker Group as a "writer" to this User Group.
    // This grants the worker write access to everything owned by 'userGroup'.
    userGroup.addMember(regardeProfileWorkerGroup as Group, "writer");

    // 4. Wait for sync to ensure permissions propagate
    await userGroup.$jazz.waitForSync();

    // 5. Create the Root Schema owned by the User Group
    return RegardeSDK.create(
        {
            myUserHandle: UserHandle.create(
                {
                    nickname: "not-yet",
                    registeredAt: 0,
                    lastModified: 0,
                    isActive: false,
                },
                {
                    owner: userGroup,
                },
            ),
            auth: RegardeAuth.create(
                {
                    token: "not-valid-yet-" + Math.random(),
                    expiresAt: 0,
                },
                {
                    owner: userGroup,
                }
            ),
            myApps: co.list(App).create([], { owner: userGroup }),
            myPayments: PaymentManager.create(
                {
                    allMyPayments: ListOfPaymentEvents.create([], { owner: userGroup }),
                    paymentHistoryByApp: co
                        .record(z.string(), ListOfPaymentEvents)
                        .create({}, { owner: userGroup }),
                    version: 1,
                },
                {
                    owner: userGroup,
                },
            ),
            version: 2,
        },
        {
            owner: userGroup,
        },
    );
};
