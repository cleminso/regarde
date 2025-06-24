import { co as i, z as e, Group as p } from "jazz-tools";
const y = i.map({
  github: e.optional(e.string()),
  twitter: e.optional(e.string()),
  website: e.optional(e.string())
}), m = i.map({
  title: e.string(),
  year: e.string(),
  client: e.optional(e.string()),
  link: e.optional(e.string()),
  description: e.optional(e.string())
}), R = i.list(m), f = i.map({
  title: e.string(),
  from: e.date(),
  to: e.optional(e.string()),
  company: e.string(),
  location: e.optional(e.string()),
  url: e.optional(e.string()),
  description: e.optional(e.string())
}), k = i.list(f), v = i.map({
  title: e.string(),
  year: e.string(),
  publisher: e.optional(e.string()),
  url: e.optional(e.string()),
  description: e.optional(e.string())
}), u = i.list(v), a = i.profile({
  name: e.string(),
  nickname: e.optional(e.string()),
  bio: e.optional(e.string()),
  avatar: e.optional(e.string()),
  socialLinks: e.optional(y),
  projects: e.optional(R),
  workExp: e.optional(k),
  writing: e.optional(u)
}).withHelpers((r) => ({
  validate(t) {
    return !t.name || t.name.trim() === "" ? {
      isValid: !1,
      message: "Name must be present and non-empty."
    } : { isValid: !0 };
  }
})), g = i.map({
  creationMessage: e.optional(e.string())
}), l = i.map({
  container: g
}), b = i.account({
  // Rule 1.3 (paraphrased): An account schema should define `profile` and `root`. `profile` points to a `co.profile` schema. `root` points to a `co.map` schema for private per-user data.
  profile: a,
  root: l
}).withMigration(
  (r, t) => {
    if (r.profile === void 0)
      try {
        const o = p.create({
          owner: r
        });
        o.addMember("everyone", "reader"), r.profile = a.create(
          {
            name: (t == null ? void 0 : t.name) || "Public Profile"
          },
          { owner: o }
        );
      } catch (o) {
        console.warn("Group could not be created, likely unlogged", o);
      }
    if (r.root === void 0)
      try {
        const o = t != null && t.name ? `Container initialized for ${t.name}.` : "Container initialized.", d = g.create({
          creationMessage: o
        });
        r.root = l.create({ container: d });
      } catch (o) {
        console.warn("Container could not be created, likely unlogged", o);
      }
  }
), n = i.record(e.string(), e.string()), s = i.record(e.string(), e.string()), c = i.map({
  registry: n,
  reverseRegistry: s
}), h = i.account({
  profile: i.profile(),
  root: c
}).withMigration(async (r) => {
  try {
    const t = await r.ensureLoaded({
      resolve: {
        root: !0
      }
    });
    if (console.dir("Loaded via ensureLoaded", t), t.root.registry === void 0) {
      const o = n.create({});
      t.root.registry = o, console.log("NicknameRegistry created in worker account root.");
    }
    if (t.root.reverseRegistry === void 0) {
      const o = s.create({});
      t.root.reverseRegistry = o, console.log("ReverseNicknameRegistry created in worker account root.");
    }
  } catch (t) {
    if (console.log("EnsureLoaded Root failed, fallback", r, t), r.root === void 0) {
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
  g as Container,
  R as ListOfProjects,
  k as ListOfWorkExp,
  u as ListOfWriting,
  n as NicknameRegistryCoRecord,
  b as OnboardingAccount,
  a as OnboardingProfile,
  m as Project,
  h as RegistryWorkerAccount,
  c as RegistryWorkerAccountRoot,
  s as ReverseNicknameRegistryCoRecord,
  y as SocialLinks,
  f as WorkExp,
  v as Writing
};
//# sourceMappingURL=shared-schemas.es.js.map
