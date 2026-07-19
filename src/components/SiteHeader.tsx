import Link from "next/link";

/** One header for /staff, bride, and F&F (root layout). */
export function SiteHeader() {
  return (
    <header className="bg-[var(--blush)]" style={{ padding: 0 }}>
      <div className="mx-auto flex max-w-[96rem] flex-col items-center gap-1 py-0">
        <Link
          href="https://www.mybridalcloset.com/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex leading-none"
        >
          {/* Half of native 500×213 → 250 wide; shared on all three pages */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.mybridalcloset.com/cdn/shop/files/BridalClosetLogoTransparent.png?v=1672175112&width=500"
            alt="Bridal Closet"
            width={250}
            height={107}
            style={{
              width: 250,
              height: "auto",
              maxWidth: "100%",
              display: "block",
            }}
          />
        </Link>
        <p className="px-3 pb-2 text-center font-[family-name:var(--font-display)] text-sm font-normal tracking-wide text-[var(--ink)] sm:text-base">
          All Brides, All Bodies, All Beautiful
        </p>
      </div>
    </header>
  );
}
