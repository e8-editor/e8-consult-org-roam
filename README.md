# e8-consult-org-roam

Org-roam with consult, for [E8](https://github.com/e8-editor/e8): nodes are chosen with consult's live preview, a note's backlinks and forward links can be chosen among, and `consult-buffer` lists the notes open by their titles in a group of their own. A port of [consult-org-roam](https://github.com/jgru/consult-org-roam) 0.1.

## Installing

In `~/.config/e8/init.ts`:

```ts
e8.usePackage("e8-editor/e8-consult-org-roam");
e8.call("consult-org-roam-mode");
```

E8 installs it, and [e8-consult](https://github.com/e8-editor/e8-consult) and [e8-org-roam](https://github.com/e8-editor/e8-org-roam), which it needs, at their newest version tags into `repos/` beside `init.ts`, records the commits in `e8-lock.json`, and requires it. `M-x package-vc-upgrade` brings it up to date. Pin a version with `{ rev: "v0.1.0" }`. It needs E8 0.3.1 or newer.

## Using it

With `consult-org-roam-mode` on, every command of org-roam's that reads a node, such as `org-roam-node-find` and `org-roam-node-insert`, reads it with consult, showing each node in the window as it is moved to, and `consult-buffer` lists the notes open under their `#+title:`s, in an "Org-roam" group that `n SPC` narrows to.

| Command | Does |
| --- | --- |
| `consult-org-roam-backlinks` | Choose among the notes that link to the node at point. |
| `consult-org-roam-forward-links` | Choose among the nodes the current buffer links to. |
| `consult-org-roam-file-find` | Choose among the file nodes. |
| `consult-org-roam-search` | Search the notes' text as you type, with `consult-grep` or `consult-ripgrep`. |

With `C-u`, the first three visit the node in another window.

Variables:

- `consult-org-roam-grep-func`: the search `consult-org-roam-search` runs, `"consult-grep"` or `"consult-ripgrep"`.
- `consult-org-roam-buffer-enabled`: whether `consult-buffer` lists the notes in a group of their own (true).
- `consult-org-roam-buffer-narrow-key`: the key that narrows to them (`"n"`).
- `consult-org-roam-buffer-after-buffers`: whether the group comes straight after the buffers rather than last (false).

## Differences from consult-org-roam

- There is no `consult-org-roam-backlinks-recursive` and no `consult-org-roam-ref-read`.
- `consult-org-roam-node-read` takes no sort function: nodes are listed most recently changed first, as e8-org-roam lists them.
- `consult-org-roam-grep-func` names the search command rather than holding a function, and `consult-org-roam-search` takes no initial input.
- A note's title in `consult-buffer` is read from its buffer's `#+title:` rather than from org-roam's index.

## Credit

This is a port to E8 of [consult-org-roam](https://github.com/jgru/consult-org-roam) 0.1, with its `consult-org-roam-buffer.el`, by jgru, copyright jgru, and distributed in MELPA, under the GNU General Public License version 3 or later. It is not the upstream authors' work as published, and they do not endorse it: report problems with the port here, not upstream.

## Developing

With an E8 on your PATH (a [release](https://github.com/e8-editor/e8/releases), or built from source) and TypeScript 5.8 or newer:

```bash
make test
make types
```

Both clone the packages it needs, e8-org-roam, e8-consult and e8-magit-section and, for the tests, e8-vertico, into `.e8/deps`, which git ignores. The tests in `test/consult-org-roam-tests.ts` make a directory of notes for each test and check what `consult-org-roam-backlinks`, `consult-org-roam-forward-links` and `consult-buffer` list, and that `org-roam-node-find` read with consult visits a heading node.

## Licence

GPL-3.0-or-later: see `LICENSE`.
