"use client";

import { useLayoutEffect, useState } from "react";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import type { PublicRule } from "@/content/rules";
import type { RULE_FAMILIES } from "@/content/rules/families";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Chapter } from "@/components/ui/chapter";
import { Tex } from "@/components/math/katex";
import { MathText } from "@/components/math/math-text";

type Family = (typeof RULE_FAMILIES)[number];

/**
 * Where you were, written onto the history entry on the way out.
 *
 * Both halves of "where you were" - the scroll offset and which groups were
 * open - live on the entry, and for the same reason: an entry is per-visit, so
 * this gives the behaviour its edges for free. Pressing back returns to the
 * entry that carries them, so it restores. Arriving at `/rules` from the
 * navigation bar makes a *new* entry with neither key on it, so it does not,
 * and you get the shut page a first visit should get. Checked in the browser
 * that keys of one's own survive the round trip beside Next's `__NA` and its
 * router tree.
 *
 * Written on the click that leaves, which is the only way into a rule from
 * here, rather than continuously on scroll.
 */
const PLACE_KEY = "deriveRulesPlace";

type Place = { y: number; open: string[] };

function rememberPlace(open: Set<string>) {
  const place: Place = { y: window.scrollY, open: [...open] };
  window.history.replaceState(
    { ...window.history.state, [PLACE_KEY]: place },
    "",
  );
}

function readPlace(): Place | null {
  if (typeof window === "undefined") return null;
  const place = window.history.state?.[PLACE_KEY];
  return place && Array.isArray(place.open) ? (place as Place) : null;
}

/**
 * The grouped formula list, with which groups are open kept in the URL.
 *
 * ## Why the URL and not component state
 *
 * Open a group, scroll to a rule, read it, press back - and you used to land
 * at the top of a page with everything shut again. Both halves of that are the
 * same cause: the open group lived only in the DOM, so coming back rendered
 * the collapsed page, and the browser cannot restore a scroll position into a
 * page that is now a fifth of the height it was.
 *
 * Keeping it in `?open=` fixes both at once, and in that order. The server
 * renders the group open on the *first* paint, so the page is already its full
 * height when the browser restores the scroll - which is the part that fails
 * with `sessionStorage` or an effect, where the restore happens before the
 * height comes back.
 *
 * `replaceState` rather than `push`: opening a group is not somewhere you
 * navigated to, and back should leave the page rather than shut a group at a
 * time.
 *
 * It is also shareable now, which the practice setup page argues for at
 * length - a URL that describes what is on screen is one you can send someone,
 * and it is what the back link on a rule page aims at.
 *
 * ## Why the prop is not enough on its own
 *
 * A bare `replaceState` changes the address bar without telling the App
 * Router, whose entry keeps `renderedSearch: ""`. Pressing back then restored
 * the payload cached for a paramless `/rules`: `open` arrived empty and every
 * group came back shut with the URL still reading `?open=exp`. Going through
 * `router.replace` would keep the router honest at the cost of a server round
 * trip every time a group is opened, which is far too much for a disclosure
 * triangle.
 *
 * The obvious repair - read `location.search` instead of the prop - is wrong
 * in the other direction, and measurably so. On a *forward* client navigation
 * React renders before the URL is updated, so following the back link from a
 * rule to `/rules?open=exp` rendered while `location.search` was still the
 * rule page's empty one, and the group it named came back shut.
 *
 * So neither source is right on its own, and the entry decides between them:
 * the place recorded on this entry when it was left, if there is one, and
 * otherwise the server's opinion. Back gets the first, every other arrival
 * gets the second.
 */
export function RuleGroups({
  groups,
  locale,
  initialOpen,
  allOpen,
}: {
  groups: { family: Family; rules: PublicRule[] }[];
  locale: Locale;
  initialOpen: string[];
  /** A search has already said what you are looking for; show the matches. */
  allOpen: boolean;
}) {
  /*
   * Lazily, so it runs on this mount's first client render. Coming back from a
   * rule remounts the list, which is what makes that enough: the groups are
   * open in the very first commit, so the page is its full height before the
   * scroll is put back below. An effect would be a paint too late and would
   * restore against a page still collapsed - the failure this whole component
   * exists to avoid.
   */
  const [open, setOpen] = useState(
    () => new Set(readPlace()?.open ?? initialOpen),
  );

  /*
   * Put the scroll back before the browser paints, which it can do honestly
   * because the groups above are already open in this same commit - the page
   * is its full height, so the offset means what it meant when it was written.
   *
   * Applied twice. Next does its own scroll handling on a back navigation and
   * it lands *after* this commit - the first attempt at this restored 820 and
   * was then overwritten with 70, the top of the page content. The frame after
   * is late enough to have the last word, and the layout-effect pass is what
   * keeps it from being visible.
   *
   * `behavior: "instant"`: `globals.css` sets `scroll-behavior: smooth` for
   * the in-page anchors, and without the override a restore animates - you
   * would watch the page scroll itself down after every back.
   *
   * The `#rule-…` case is the back link on a rule page, arriving forwards. The
   * browser's own anchor scrolling loses the same argument with Next that the
   * offset did - the card is in the document at 1,493 and the page still sat
   * at 5 - so it is done here too, by the one mechanism that is known to win.
   * The target is recomputed inside `put` because on a forward navigation the
   * address bar is still the old one when this effect first runs.
   */
  useLayoutEffect(() => {
    const saved = readPlace()?.y;

    const targetFor = () => {
      if (typeof saved === "number" && saved > 0) return saved;
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return null;
      const card = document.getElementById(id);
      if (!card) return null;
      // Clear of the sticky header, matching the `scroll-mt-24` on the card.
      return card.getBoundingClientRect().top + window.scrollY - 96;
    };

    const put = () => {
      const top = targetFor();
      if (top === null || top <= 0) return;
      window.scrollTo({ top, behavior: "instant" });
    };

    put();
    const frame = requestAnimationFrame(put);
    return () => cancelAnimationFrame(frame);
  }, []);

  function toggle(prefix: string, isOpen: boolean) {
    setOpen((current) => {
      const next = new Set(current);
      if (isOpen) next.add(prefix);
      else next.delete(prefix);

      const url = new URL(window.location.href);
      if (next.size > 0) url.searchParams.set("open", [...next].join(","));
      else url.searchParams.delete("open");
      /*
       * `history.state` passed through rather than `null`. The App Router
       * keeps its tree in there, and replacing it with nothing breaks every
       * later back and forward.
       */
      window.history.replaceState(window.history.state, "", url);

      return next;
    });
  }

  return (
    <div className="mt-6 space-y-3">
      {groups.map(({ family, rules }) => (
        <Chapter
          key={family.prefix}
          id={family.prefix}
          title={family.name[locale]}
          meta={family.blurb[locale]}
          trailing={
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
              {rules.length}
            </span>
          }
          open={allOpen || open.has(family.prefix)}
          onToggle={(isOpen) => toggle(family.prefix, isOpen)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {rules.map((rule) => (
              <Link
                key={rule.id}
                id={`rule-${rule.id}`}
                href={`/rules/${rule.id}`}
                /* Written on the way out, while this entry is still current. */
                onClick={() => rememberPlace(open)}
                /* `scroll-mt`: the header is sticky, so an anchored card would
                   otherwise land underneath it. */
                className="scroll-mt-24"
              >
                <Card className="h-full space-y-2 transition-colors hover:border-accent/50">
                  <CardTitle className="text-base">
                    {rule.name[locale]}
                  </CardTitle>
                  <Tex tex={rule.statement} display className="py-1" />
                  {rule.mnemonic ? (
                    <p className="border-l-2 border-accent pl-2 text-sm">
                      <MathText text={rule.mnemonic[locale]} />
                    </p>
                  ) : null}
                  <CardDescription>
                    <MathText text={rule.plain[locale]} />
                  </CardDescription>
                </Card>
              </Link>
            ))}
          </div>
        </Chapter>
      ))}
    </div>
  );
}
