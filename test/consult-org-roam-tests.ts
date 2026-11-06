// SPDX-License-Identifier: GPL-3.0-or-later
//
// consult-org-roam's tests, with ERT: nodes read with consult's preview,
// a note's backlinks and forward links, and the notes open listed in
// consult-buffer, in a notes directory of their own made for each test.
// They read with vertico, as E8's own tests of the port did, and see what
// it lists in the minibuffer's overlays. `make test` runs them in
// e8 --batch, as CI does.

import { ertDeftest, should, shouldEqual } from "ert";
import "vertico";
import "consult";
import "org-roam";
import "consult-org-roam";

const ALPHA = ":PROPERTIES:\n:ID:       alpha-id\n:END:\n#+title: Alpha\n#+filetags: :one:\n\nAlpha mentions [[id:beta-id][Beta]] here.\n";
const BETA = "#+title: Notes\n\n* Beta\n:PROPERTIES:\n:ID:       beta-id\n:ROAM_ALIASES: \"Second letter\"\n:END:\nBeta's text.\n* Not a node\n";

e8.callWithPrefix(1, "vertico-mode" as e8.DefinedCommand);
e8.callWithPrefix(1, "org-roam-db-autosync-mode" as e8.DefinedCommand);
e8.callWithPrefix(1, "consult-org-roam-mode" as e8.DefinedCommand);

/** TEXT as keys typed one by one, spaces as SPC. */
const spell = (text: string): string => [...text].map((c) => (c === " " ? "SPC" : c)).join(" ");

/**
 * Runs BODY with a notes directory holding alpha.org and beta.org as
 * org-roam-directory, its index brought up to date, and afterwards kills
 * the buffers of its files and deletes it.
 */
function withNotes(body: (dir: string) => void): void {
  const dir = e8.makeTempFile("consult-org-roam-tests", { dir: true });
  e8.writeTextFile(`${dir}/alpha.org`, ALPHA);
  e8.writeTextFile(`${dir}/beta.org`, BETA);
  const saved = { directory: e8.variable("org-roam-directory") ?? null, db: e8.variable("org-roam-db-location") ?? null };
  e8.setVariable("org-roam-directory", `${dir}/`);
  e8.setVariable("org-roam-db-location", `${dir}/.cache.json`);
  e8.call("org-roam-db-sync" as e8.DefinedCommand);
  try {
    body(dir);
  } finally {
    e8.call("delete-other-windows");
    for (const b of e8.bufferList()) {
      const file = e8.withCurrentBuffer(b, () => e8.bufferFileName());
      if (file?.startsWith(`${dir}/`) || b === "*org-roam*") {
        e8.withCurrentBuffer(b, () => e8.setBufferModified(false));
        e8.call("kill-buffer", b);
      }
    }
    e8.call("switch-to-buffer", "*scratch*");
    e8.setVariable("org-roam-directory", saved.directory);
    e8.setVariable("org-roam-db-location", saved.db);
    e8.deleteDirectory(dir, { recursive: true });
  }
}

/** What vertico shows below the input: the after-strings of the minibuffer's overlays ending at its end. */
function minibufferStrings(): string {
  const end = e8.pointMax();
  return e8
    .overlaysIn(e8.pointMin(), end + 1)
    .filter((o) => e8.overlayEnd(o) === end)
    .sort((a, b) => Number(e8.overlayGet(a, "priority") ?? 0) - Number(e8.overlayGet(b, "priority") ?? 0) || a - b)
    .map((o) => {
      const s = e8.overlayGet(o, "after-string");
      return typeof s === "string" ? s : s && typeof s === "object" && "string" in s ? String(s.string) : "";
    })
    .join("");
}

/**
 * Types KEYS, which may open prompts and must answer them, giving what the
 * minibuffer lists under PROMPT after the first command run there: a key
 * such as C-e that changes nothing shows what the prompt lists at first.
 * KEYS that end in C-g quit the prompt, as they are meant to.
 */
function shownAt(prompt: string, keys: string): string {
  let shown: string | undefined;
  const watch = () => {
    if (shown === undefined && e8.minibufferDepth() > 0 && e8.bufferText(e8.pointMin(), e8.minibufferPromptEnd()) === prompt) shown = minibufferStrings();
  };
  e8.addHook("post-command-hook", watch);
  try {
    if (keys.endsWith(" C-g")) e8.conditionCase(() => e8.executeKbdMacro(keys), { quit: () => undefined });
    else e8.executeKbdMacro(keys);
  } finally {
    e8.removeHook("post-command-hook", watch);
  }
  should(shown !== undefined, `the prompt ${JSON.stringify(prompt)} opened`);
  return shown!;
}

/** Keys that run COMMAND, as M-x does. */
const mx = (command: string): string => `M-x ${spell(command)} RET`;

const lineAtPoint = (): number => e8.lineOf(e8.point());

ertDeftest("consult-org-roam-previews-nodes-and-lists-backlinks-and-notes", () =>
  withNotes((dir) => {
    e8.call("find-file", `${dir}/beta.org`);
    e8.gotoChar(e8.lineStart(7));
    // The backlinks of Beta: Alpha.
    shouldEqual(shownAt("Node: ", `${mx("consult-org-roam-backlinks")} C-e RET`), " \nAlpha\n");
    shouldEqual(e8.bufferName(), "alpha.org");
    // The forward links of Alpha: Beta, by its title and its alias.
    shouldEqual(shownAt("Node: ", `${mx("consult-org-roam-forward-links")} C-e C-g`), " \nBeta\nSecond letter\n");
    // consult-buffer lists the notes open by title, in their own group.
    const shown = shownAt("Switch to: ", `${mx("consult-buffer")} C-e C-g`);
    should(shown.includes("Org-roam") && shown.includes("\nAlpha\n") && shown.includes("\nNotes\n"), JSON.stringify(shown));
  }),
);

ertDeftest("consult-org-roam-node-find-visits-a-heading-node", () =>
  withNotes((dir) => {
    e8.call("dired", dir);
    const before = e8.messages().length;
    e8.executeKbdMacro(`${mx("org-roam-node-find")} B e t a RET`);
    shouldEqual([e8.bufferName(), lineAtPoint()], ["beta.org", 2]);
    shouldEqual(e8.messages().slice(before), [], "nothing is said");
  }),
);
