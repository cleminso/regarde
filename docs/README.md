# Project Context: `onboarding.jazz` Application

## Introduction

**Objective:**
The primary goal is to develop an application named `onboarding.jazz`. This application will serve as the designated platform for users to create, manage, and update their public-facing user profiles within a Jazz-based ecosystem.

**Core Functionality:**

1.  **Profile Creation & Management:** Users will be able to define and edit various aspects of their public profile. This includes standard fields like display name, avatar, biography, and potentially other custom public information.
2.  **Leveraging Jazz `Account.profile`:** The application will utilize the Jazz framework's built-in `Account.profile` mechanism. The data edited by the user in `onboarding.jazz` will be stored in their `Account.profile` CoMap.
3.  **Schema Definition:** We will define a specific `OnboardingProfile` schema (extending `jazz.Profile`) that dictates the structure and fields of the user's public profile. A corresponding `OnboardingAccount` schema (extending `jazz.Account`) will reference this `OnboardingProfile`.
4.  **Centralized Public Identity:** The profile data managed through `onboarding.jazz` is intended to be readable by other Jazz applications. This allows for a consistent public user identity across different applications within the same Jazz environment, provided those applications are designed to use the same`OnboardingAccount` and `OnboardingProfile` schemas.

**Interaction with Other Jazz Applications:**
Other Jazz applications will not directly integrate with the `onboarding.jazz` application's code. Instead, they will achieve interoperability by:

1.  Using the same `OnboardingAccount` and `OnboardingProfile` schema definitions.
2.  Reading the profile data directly from the user's `Account.profile` (which `onboarding.jazz` populates).
3.  Conventionally, other applications will treat this profile data as read-only, with `onboarding.jazz` being the canonical source for profile modifications.

**User Authentication:**
User authentication is handled by the underlying Jazz framework. `onboarding.jazz` will operate on the context of the already authenticated user.

**In essence, we are building the primary interface for users to control their public Jazz identity, which can then be consumed by a wider ecosystem of Jazz
applications.**

## Difficulty Points

Evaluating the technical nature of the `onboarding.jazz` project, here are the potential difficulty points:

1.  **Schema Design and Long-Term Management:**

    - **Initial Design:** While defining the initial `OnboardingProfile` schema is straightforward, anticipating all future needs can be hard.
    - **Schema Evolution:** If the `OnboardingProfile` schema needs to change after launch (e.g., adding new fields, renaming, or removing old ones), managing this evolution requires careful planning. The `migrate()` function in `OnboardingAccount` will need to handle these changes gracefully for existing users. Ensuring all consuming applications are aware of and adapt to schema changes is a coordination challenge.

2.  **Shared Schema Distribution and Versioning:**

    - The core concept relies on other Jazz applications using the _exact same_ `OnboardingAccount` and `OnboardingProfile` schema definitions. The mechanism for distributing these schema files (e.g., as a shared library, npm package) needs to be reliable.
    - Versioning these shared schemas will be important if breaking changes are ever introduced, so consuming apps can adapt or pin to specific versions.

3.  **Robust `Account.migrate()` Implementation:**

    - The `migrate()` method in `OnboardingAccount` is critical. It must correctly initialize the `OnboardingProfile` for new users.
    - More complex is ensuring it can handle future additions or modifications to the `OnboardingProfile` schema without losing data or causing errors for existing users. This involves careful checks for `undefined` fields and potentially data transformation logic.

4.  **User Interface for Profile Editing:**

    - Building a user-friendly and comprehensive UI for editing all the defined profile fields can be time-consuming.
    - Handling specific field types, like image uploads for avatars (which involves `ImageDefinition` in Jazz and the corresponding UI), or potentially complex nested data within the profile, can add complexity.

5.  **Data Validation:**

    - While Jazz enforces type correctness based on the schema, any application-specific validation (e.g., ensuring a social media link is a valid URL, character limits for a bio) will need to be implemented within the `onboarding.jazz` application's UI and logic.

6.  **Ensuring Public Readability of Profile Correctly:**
    - Care must be taken in the `migrate()` function (or wherever the `OnboardingProfile` CoMap is created) to ensure its associated `Group` is correctly configured to allow `"everyone"` the `"reader"` role, making the profile truly public as intended. Misconfiguration here could lead to profiles not being visible to other apps.

While Jazz provides a strong foundation, these points represent areas where careful design, implementation, and ongoing management will be key to the project's success and its utility within a broader Jazz ecosystem.
