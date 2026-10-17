import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Invitation, MusicToggle, OpeningLoader } from "@/components/wedding-invitation";
import { useMusic } from "@/hooks/use-music";
import { absoluteUrl, couple, wedding } from "@/lib/wedding-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${couple} — A Wedding Invitation` },
      {
        name: "description",
        content: `With love and the blessings of our families, join us for two days of wedding celebrations on ${wedding.dates} in ${wedding.city}.`,
      },
      {
        property: "og:title",
        content: `${couple} — A Wedding Invitation`,
      },
      {
        property: "og:description",
        content: `Two little souls. One beautiful story. Celebrate our new beginning on ${wedding.dates}.`,
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: absoluteUrl(wedding.photos.share) },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: `${couple} — ${wedding.dates}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: absoluteUrl(wedding.photos.share) },
      { name: "twitter:image:alt", content: `${couple} — ${wedding.dates}` },
    ],
  }),
  component: Index,
});

/**
 * The gate sits on top of the invitation, which renders underneath from the start.
 * A tap anywhere on the gate swings the door open, starts the music and fades the gate onto the invitation.
 */
function Index() {
  const music = useMusic(wedding.music.src);
  const [opened, setOpened] = useState(false);
  const [gateGone, setGateGone] = useState(false);

  return (
    <>
      {!gateGone && (
        <OpeningLoader
          onOpen={(delaySec, riseSec) => {
            if (wedding.music.startOnOpen) music.start(delaySec, riseSec);
          }}
          onOpened={() => setOpened(true)}
          onGone={() => setGateGone(true)}
        />
      )}
      <Invitation opened={opened} />
      <MusicToggle state={music.state} onToggle={music.toggle} />
    </>
  );
}
