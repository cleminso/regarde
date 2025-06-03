import { co as i, z as e, Group as y } from "jazz-tools";
const p = i.map({
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
}), k = i.list(f), a = i.profile({
  name: e.string(),
  nickname: e.optional(e.string()),
  bio: e.optional(e.string()),
  avatar: e.optional(e.string()),
  socialLinks: e.optional(p),
  projects: e.optional(R),
  workExp: e.optional(k)
}).withHelpers((r) => ({
  validate(o) {
    return !o.name || o.name.trim() === "" ? {
      isValid: !1,
      message: "Name must be present and non-empty."
    } : { isValid: !0 };
  }
})), g = i.map({
  creationMessage: e.optional(e.string())
}), c = i.map({
  container: g
}), u = i.account({
  // Rule 1.3 (paraphrased): An account schema should define `profile` and `root`. `profile` points to a `co.profile` schema. `root` points to a `co.map` schema for private per-user data.
  profile: a,
  root: c
}).withMigration(
  (r, o) => {
    if (r.profile === void 0)
      try {
        const t = y.create({
          owner: r
        });
        t.addMember("everyone", "reader"), r.profile = a.create(
          {
            name: (o == null ? void 0 : o.name) || "Public Profile"
          },
          { owner: t }
        );
      } catch (t) {
        console.warn("Group could not be created, likely unlogged", t);
      }
    if (r.root === void 0)
      try {
        const t = o != null && o.name ? `Container initialized for ${o.name}.` : "Container initialized.", d = g.create({
          creationMessage: t
        });
        r.root = c.create({ container: d });
      } catch (t) {
        console.warn("Container could not be created, likely unlogged", t);
      }
  }
), n = i.record(e.string(), e.string()), s = i.record(e.string(), e.string()), l = i.map({
  registry: n,
  reverseRegistry: s
}), w = i.account({
  profile: i.profile(),
  root: l
}).withMigration(async (r) => {
  try {
    const o = await r.ensureLoaded({
      resolve: {
        root: !0
      }
    });
    if (console.dir("Loaded via ensureLoaded", o), o.root.registry === void 0) {
      const t = n.create({});
      o.root.registry = t, console.log("NicknameRegistry created in worker account root.");
    }
    if (o.root.reverseRegistry === void 0) {
      const t = s.create({});
      o.root.reverseRegistry = t, console.log("ReverseNicknameRegistry created in worker account root.");
    }
  } catch (o) {
    if (console.log("EnsureLoaded Root failed, fallback", r, o), r.root === void 0) {
      const t = l.create({
        registry: n.create({}),
        reverseRegistry: s.create({})
      });
      r.root = t, console.log(
        "Root created with NicknameRegistry and ReverseNicknameRegistry in worker account since it was missing."
      );
    } else {
      if (r.root.registry === void 0) {
        const t = n.create({});
        r.root.registry = t, console.log("NicknameRegistry created in existing root during fallback.");
      }
      if (r.root.reverseRegistry === void 0) {
        const t = s.create({});
        r.root.reverseRegistry = t, console.log("ReverseNicknameRegistry created in existing root during fallback.");
      }
    }
  }
});
export {
  c as AccountRoot,
  g as Container,
  R as ListOfProjects,
  k as ListOfWorkExp,
  n as NicknameRegistryCoRecord,
  u as OnboardingAccount,
  a as OnboardingProfile,
  m as Project,
  w as RegistryWorkerAccount,
  l as RegistryWorkerAccountRoot,
  s as ReverseNicknameRegistryCoRecord,
  p as SocialLinks,
  f as WorkExp
};
//# sourceMappingURL=shared-schemas.es.js.map
