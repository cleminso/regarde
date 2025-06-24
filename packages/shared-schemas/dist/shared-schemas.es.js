import { co as e, z as t, Group as p } from "jazz-tools";
const m = e.map({
  github: t.optional(t.string()),
  twitter: t.optional(t.string()),
  website: t.optional(t.string())
}), y = e.map({
  title: t.string(),
  year: t.string(),
  client: t.optional(t.string()),
  link: t.optional(t.string()),
  description: t.optional(t.string())
}), f = e.list(y), R = e.map({
  title: t.string(),
  from: t.date(),
  to: t.optional(t.string()),
  company: t.string(),
  location: t.optional(t.string()),
  url: t.optional(t.string()),
  description: t.optional(t.string())
}), u = e.list(R), k = e.map({
  title: t.string(),
  year: t.string(),
  publisher: t.optional(t.string()),
  url: t.optional(t.string()),
  description: t.optional(t.string())
}), v = e.list(k), w = e.map({
  from: t.date(),
  to: t.optional(t.string()),
  degree: t.string(),
  institution: t.string(),
  location: t.optional(t.string()),
  url: t.optional(t.string()),
  description: t.optional(t.string())
}), b = e.list(w), L = e.map({
  issued: t.date(),
  expire: t.optional(t.string()),
  name: t.string(),
  organization: t.string(),
  url: t.optional(t.string()),
  description: t.optional(t.string())
}), h = e.list(L), a = e.profile({
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
  certification: t.optional(h)
}).withHelpers((r) => ({
  validate(i) {
    return !i.name || i.name.trim() === "" ? {
      isValid: !1,
      message: "Name must be present and non-empty."
    } : { isValid: !0 };
  }
})), g = e.map({
  creationMessage: t.optional(t.string())
}), l = e.map({
  container: g
}), N = e.account({
  // Rule 1.3 (paraphrased): An account schema should define `profile` and `root`. `profile` points to a `co.profile` schema. `root` points to a `co.map` schema for private per-user data.
  profile: a,
  root: l
}).withMigration(
  (r, i) => {
    if (r.profile === void 0)
      try {
        const o = p.create({
          owner: r
        });
        o.addMember("everyone", "reader"), r.profile = a.create(
          {
            name: (i == null ? void 0 : i.name) || "Public Profile"
          },
          { owner: o }
        );
      } catch (o) {
        console.warn("Group could not be created, likely unlogged", o);
      }
    if (r.root === void 0)
      try {
        const o = i != null && i.name ? `Container initialized for ${i.name}.` : "Container initialized.", d = g.create({
          creationMessage: o
        });
        r.root = l.create({ container: d });
      } catch (o) {
        console.warn("Container could not be created, likely unlogged", o);
      }
  }
), n = e.record(t.string(), t.string()), s = e.record(t.string(), t.string()), c = e.map({
  registry: n,
  reverseRegistry: s
}), x = e.account({
  profile: e.profile(),
  root: c
}).withMigration(async (r) => {
  try {
    const i = await r.ensureLoaded({
      resolve: {
        root: !0
      }
    });
    if (console.dir("Loaded via ensureLoaded", i), i.root.registry === void 0) {
      const o = n.create({});
      i.root.registry = o, console.log("NicknameRegistry created in worker account root.");
    }
    if (i.root.reverseRegistry === void 0) {
      const o = s.create({});
      i.root.reverseRegistry = o, console.log("ReverseNicknameRegistry created in worker account root.");
    }
  } catch (i) {
    if (console.log("EnsureLoaded Root failed, fallback", r, i), r.root === void 0) {
      const o = c.create({
        registry: n.create({}),
        reverseRegistry: s.create({})
      });
      r.root = o, console.log(
        "Root created with NicknameRegistry and ReverseNicknameRegistry in worker account since it was missing."
      );
    } else {
      if (r.root.registry === void 0) {
        const o = n.create({});
        r.root.registry = o, console.log("NicknameRegistry created in existing root during fallback.");
      }
      if (r.root.reverseRegistry === void 0) {
        const o = s.create({});
        r.root.reverseRegistry = o, console.log("ReverseNicknameRegistry created in existing root during fallback.");
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
  u as ListOfWorkExp,
  v as ListOfWriting,
  n as NicknameRegistryCoRecord,
  N as OnboardingAccount,
  a as OnboardingProfile,
  y as Project,
  x as RegistryWorkerAccount,
  c as RegistryWorkerAccountRoot,
  s as ReverseNicknameRegistryCoRecord,
  m as SocialLinks,
  R as WorkExp,
  k as Writing
};
//# sourceMappingURL=shared-schemas.es.js.map
