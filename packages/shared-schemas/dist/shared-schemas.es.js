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
}), f = i.list(y), u = i.map({
  title: t.string(),
  from: t.string(),
  to: t.optional(t.string()),
  company: t.string(),
  location: t.optional(t.string()),
  url: t.optional(t.string()),
  description: t.optional(t.string())
}), R = i.list(u), k = i.map({
  title: t.string(),
  year: t.string(),
  publisher: t.optional(t.string()),
  url: t.optional(t.string()),
  description: t.optional(t.string())
}), v = i.list(k), w = i.map({
  from: t.string(),
  to: t.optional(t.string()),
  degree: t.string(),
  institution: t.string(),
  location: t.optional(t.string()),
  url: t.optional(t.string()),
  description: t.optional(t.string())
}), b = i.list(w), L = i.map({
  issued: t.string(),
  expire: t.optional(t.string()),
  name: t.string(),
  organization: t.string(),
  url: t.optional(t.string()),
  description: t.optional(t.string())
}), O = i.list(L), h = i.map({
  title: t.string(),
  year: t.string(),
  event: t.optional(t.string()),
  location: t.optional(t.string()),
  url: t.optional(t.string()),
  description: t.optional(t.string())
}), C = i.list(h), N = i.map({
  title: t.string(),
  year: t.string(),
  presenter: t.string(),
  url: t.optional(t.string()),
  description: t.optional(t.string())
}), x = i.list(N), A = i.map({
  from: t.string(),
  to: t.optional(t.string()),
  title: t.string(),
  organization: t.string(),
  location: t.optional(t.string()),
  url: t.optional(t.string()),
  description: t.optional(t.string())
}), j = i.list(A), E = i.map({
  title: t.string(),
  year: t.string(),
  client: t.optional(t.string()),
  url: t.optional(t.string()),
  description: t.optional(t.string())
}), M = i.list(E), a = i.profile({
  // TODO: make `name` optional and nickname required
  name: t.string(),
  nickname: t.optional(t.string()),
  bio: t.optional(t.string()),
  avatar: t.optional(t.string()),
  socialLinks: t.optional(m),
  projects: t.optional(f),
  workExp: t.optional(R),
  writing: t.optional(v),
  education: t.optional(b),
  certification: t.optional(O),
  speaking: t.optional(C),
  award: t.optional(x),
  volunteering: t.optional(j),
  sideProject: t.optional(M)
}).withHelpers((e) => ({
  validate(o) {
    return !o.name || o.name.trim() === "" ? {
      isValid: !1,
      message: "Name must be present and non-empty."
    } : { isValid: !0 };
  }
})), c = i.map({
  creationMessage: t.optional(t.string())
}), l = i.map({
  container: c
}), W = i.account({
  // Rule 1.3 (paraphrased): An account schema should define `profile` and `root`. `profile` points to a `co.profile` schema. `root` points to a `co.map` schema for private per-user data.
  profile: a,
  root: l
}).withMigration(
  (e, o) => {
    if (e.profile === void 0)
      try {
        const n = d.create({
          owner: e
        });
        n.addMember("everyone", "reader"), e.profile = a.create(
          {
            name: (o == null ? void 0 : o.name) || "Public Profile"
          },
          { owner: n }
        );
      } catch (n) {
        console.warn("Group could not be created, likely unlogged", n);
      }
    if (e.root === void 0)
      try {
        const n = o != null && o.name ? `Container initialized for ${o.name}.` : "Container initialized.", p = c.create({
          creationMessage: n
        });
        e.root = l.create({ container: p });
      } catch (n) {
        console.warn("Container could not be created, likely unlogged", n);
      }
  }
), r = i.record(t.string(), t.string()), s = i.record(t.string(), t.string()), g = i.map({
  registry: r,
  reverseRegistry: s
}), z = i.account({
  profile: i.profile(),
  root: g
}).withMigration(async (e) => {
  try {
    const o = await e.ensureLoaded({
      resolve: {
        root: !0
      }
    });
    if (console.dir("Loaded via ensureLoaded", o), o.root.registry === void 0) {
      const n = r.create({});
      o.root.registry = n, console.log("NicknameRegistry created in worker account root.");
    }
    if (o.root.reverseRegistry === void 0) {
      const n = s.create({});
      o.root.reverseRegistry = n, console.log("ReverseNicknameRegistry created in worker account root.");
    }
  } catch (o) {
    if (console.log("EnsureLoaded Root failed, fallback", e, o), e.root === void 0) {
      const n = g.create({
        registry: r.create({}),
        reverseRegistry: s.create({})
      });
      e.root = n, console.log(
        "Root created with NicknameRegistry and ReverseNicknameRegistry in worker account since it was missing."
      );
    } else {
      if (e.root.registry === void 0) {
        const n = r.create({});
        e.root.registry = n, console.log("NicknameRegistry created in existing root during fallback.");
      }
      if (e.root.reverseRegistry === void 0) {
        const n = s.create({});
        e.root.reverseRegistry = n, console.log("ReverseNicknameRegistry created in existing root during fallback.");
      }
    }
  }
});
export {
  l as AccountRoot,
  N as Award,
  L as Certification,
  c as Container,
  w as Education,
  x as ListOfAward,
  O as ListOfCertification,
  b as ListOfEducation,
  f as ListOfProjects,
  M as ListOfSideProject,
  C as ListOfSpeaking,
  j as ListOfVolunteering,
  R as ListOfWorkExp,
  v as ListOfWriting,
  r as NicknameRegistryCoRecord,
  W as OnboardingAccount,
  a as OnboardingProfile,
  y as Project,
  z as RegistryWorkerAccount,
  g as RegistryWorkerAccountRoot,
  s as ReverseNicknameRegistryCoRecord,
  E as SideProject,
  m as SocialLinks,
  h as Speaking,
  A as Volunteering,
  u as WorkExp,
  k as Writing
};
//# sourceMappingURL=shared-schemas.es.js.map
