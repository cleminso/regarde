import { co as i, z as t, Group as d } from "jazz-tools";
const m = i.map({
  github: t.optional(t.string()),
  twitter: t.optional(t.string()),
  website: t.optional(t.string())
}), y = i.map({
  title: t.string(),
  year: t.string(),
  client: t.optional(t.string()),
  link: t.optional(t.string()),
  description: t.optional(t.string())
}), f = i.list(y), R = i.map({
  title: t.string(),
  from: t.date(),
  to: t.optional(t.string()),
  company: t.string(),
  location: t.optional(t.string()),
  url: t.optional(t.string()),
  description: t.optional(t.string())
}), u = i.list(R), k = i.map({
  title: t.string(),
  year: t.string(),
  publisher: t.optional(t.string()),
  url: t.optional(t.string()),
  description: t.optional(t.string())
}), v = i.list(k), w = i.map({
  from: t.date(),
  to: t.optional(t.string()),
  degree: t.string(),
  institution: t.string(),
  location: t.optional(t.string()),
  url: t.optional(t.string()),
  description: t.optional(t.string())
}), b = i.list(w), L = i.map({
  issued: t.date(),
  expire: t.optional(t.string()),
  name: t.string(),
  organization: t.string(),
  url: t.optional(t.string()),
  description: t.optional(t.string())
}), h = i.list(L), C = i.map({
  title: t.string(),
  year: t.date(),
  event: t.optional(t.string()),
  location: t.optional(t.string()),
  url: t.optional(t.string()),
  description: t.optional(t.string())
}), N = i.list(C), a = i.profile({
  // TODO: make `name` optional and nickname required
  name: t.string(),
  nickname: t.optional(t.string()),
  bio: t.optional(t.string()),
  avatar: t.optional(t.string()),
  socialLinks: t.optional(m),
  projects: t.optional(f),
  workExp: t.optional(u),
  writing: t.optional(v),
  education: t.optional(b),
  certification: t.optional(h),
  speaking: t.optional(N)
}).withHelpers((n) => ({
  validate(o) {
    return !o.name || o.name.trim() === "" ? {
      isValid: !1,
      message: "Name must be present and non-empty."
    } : { isValid: !0 };
  }
})), g = i.map({
  creationMessage: t.optional(t.string())
}), l = i.map({
  container: g
}), x = i.account({
  // Rule 1.3 (paraphrased): An account schema should define `profile` and `root`. `profile` points to a `co.profile` schema. `root` points to a `co.map` schema for private per-user data.
  profile: a,
  root: l
}).withMigration(
  (n, o) => {
    if (n.profile === void 0)
      try {
        const e = d.create({
          owner: n
        });
        e.addMember("everyone", "reader"), n.profile = a.create(
          {
            name: (o == null ? void 0 : o.name) || "Public Profile"
          },
          { owner: e }
        );
      } catch (e) {
        console.warn("Group could not be created, likely unlogged", e);
      }
    if (n.root === void 0)
      try {
        const e = o != null && o.name ? `Container initialized for ${o.name}.` : "Container initialized.", p = g.create({
          creationMessage: e
        });
        n.root = l.create({ container: p });
      } catch (e) {
        console.warn("Container could not be created, likely unlogged", e);
      }
  }
), r = i.record(t.string(), t.string()), s = i.record(t.string(), t.string()), c = i.map({
  registry: r,
  reverseRegistry: s
}), E = i.account({
  profile: i.profile(),
  root: c
}).withMigration(async (n) => {
  try {
    const o = await n.ensureLoaded({
      resolve: {
        root: !0
      }
    });
    if (console.dir("Loaded via ensureLoaded", o), o.root.registry === void 0) {
      const e = r.create({});
      o.root.registry = e, console.log("NicknameRegistry created in worker account root.");
    }
    if (o.root.reverseRegistry === void 0) {
      const e = s.create({});
      o.root.reverseRegistry = e, console.log("ReverseNicknameRegistry created in worker account root.");
    }
  } catch (o) {
    if (console.log("EnsureLoaded Root failed, fallback", n, o), n.root === void 0) {
      const e = c.create({
        registry: r.create({}),
        reverseRegistry: s.create({})
      });
      n.root = e, console.log(
        "Root created with NicknameRegistry and ReverseNicknameRegistry in worker account since it was missing."
      );
    } else {
      if (n.root.registry === void 0) {
        const e = r.create({});
        n.root.registry = e, console.log("NicknameRegistry created in existing root during fallback.");
      }
      if (n.root.reverseRegistry === void 0) {
        const e = s.create({});
        n.root.reverseRegistry = e, console.log("ReverseNicknameRegistry created in existing root during fallback.");
      }
    }
  }
});
export {
  l as AccountRoot,
  L as Certification,
  g as Container,
  w as Education,
  h as ListOfCertification,
  b as ListOfEducation,
  f as ListOfProjects,
  N as ListOfSpeaking,
  u as ListOfWorkExp,
  v as ListOfWriting,
  r as NicknameRegistryCoRecord,
  x as OnboardingAccount,
  a as OnboardingProfile,
  y as Project,
  E as RegistryWorkerAccount,
  c as RegistryWorkerAccountRoot,
  s as ReverseNicknameRegistryCoRecord,
  m as SocialLinks,
  C as Speaking,
  R as WorkExp,
  k as Writing
};
//# sourceMappingURL=shared-schemas.es.js.map
