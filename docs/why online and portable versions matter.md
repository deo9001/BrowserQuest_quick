

People often say “just install it locally” or “just run the open-source version yourself,” but that advice assumes a level of computer control that many people do not have.

Not everyone is using a personal machine with admin rights. A lot of people are on school, work, library, lab, shared, managed, or restricted computers. On those machines, installing Node, Git, Python, Docker, package managers, build tools, drivers, certificates, or system dependencies may be impossible. Even so-called “simple local setup” can fail the moment it needs admin permission, PATH changes, background services, security approval, or executable permissions.

That is why online versions and truly portable versions matter.

A developer may say:
“Just clone the repo, install dependencies, and run the dev server.”

But for a non-admin situation, that can mean:
“You cannot use this app at all.”

Even portable ZIP setups are not always enough. Some tools still need system access, still trigger security restrictions, still depend on blocked downloads, or still require executables that managed PCs will not allow. In many real-world environments, an Electron portable app or a single-folder app that runs without installation may be the only practical option.

Online apps help too, but only when the site is not blocked. If the official hosted app is blocked by school or workplace filtering, then the “just use the website” answer also fails.

So the issue is not laziness. It is access.

Portable and online versions are not unnecessary duplicates. They are accessibility paths for people who cannot install software, cannot change system settings, cannot use package managers, and cannot rely on a hosted site being allowed. If an app claims to be for everyone, then distribution matters as much as source code.

Open source is great, but source code alone is not always usable software for certain situations. A repo that requires a developer toolchain is not the same thing as an app a restricted user can actually run.

That is why projects should consider:

- a hosted web version,
- a portable desktop build,
- a no-admin ZIP release,
- a single-click local mode where possible,
- and clear separation between “developer setup” and “user setup.”

For most situations with full admin rights, local setup may be easy. For more restricted situations, it can be a dead end. Your wrok can't get done or work arounds are needed. Portable apps are not just a convenience, not just a fad, they are the difference between being able to use the software anywhere and being locked out.


