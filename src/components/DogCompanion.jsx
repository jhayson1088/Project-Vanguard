import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Heart,
  Cookie,
  CircleDot,
  PawPrint,
  LockKeyhole,
  Check,
  Sparkles,
  Trophy,
} from "lucide-react";
import { companionGrowth } from "./companionGrowth";
const DogScene = lazy(() => import("./DogScene"));

export default function DogCompanion({ user, settings }) {
  const growth = companionGrowth(user, settings.levels);
  const [action, setAction] = useState(null);
  const [message, setMessage] = useState(
    "Your campus buddy is happy to see you.",
  );
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  function interact(type) {
    setAction({ type, at: Date.now() });
    setMessage(
      {
        pet: "That’s the spot! Your buddy loves a little affection.",
        treat: "Crunch, crunch. One very happy pup!",
        play: "Fetch time! Look at that tail go.",
      }[type],
    );
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setMessage("Your campus buddy is happy to see you."),
      4000,
    );
  }
  const remaining = Math.max(
    0,
    (growth.next ?? user.nextThreshold) - user.points,
  );
  const progressMax = Math.max(1, user.nextThreshold - user.levelStart);
  return (
    <section className="panel companion-card">
      <div className="companion-heading">
        <div>
          <span className="eyebrow">A LITTLE CARE. A GROWING FRIEND.</span>
          <h2>
            Meet your campus buddy<span>.</span>
          </h2>
        </div>
        <span className="companion-stage">
          <PawPrint size={14} />
          {growth.name}
        </span>
      </div>
      <div className="companion-world">
        <span className="companion-level">Level {growth.level} companion</span>
        <Suspense
          fallback={
            <div className="dog-scene companion-loading" role="status">
              Your buddy is getting ready…
            </div>
          }
        >
          <DogScene
            stage={growth.stage}
            action={action}
            onPet={() => interact("pet")}
          />
        </Suspense>
        <span className="companion-drag-hint">
          Drag to look around · Tap your buddy to pet
        </span>
      </div>
      <p className="companion-message" role="status" aria-live="polite">
        {message}
      </p>
      <div className="companion-actions">
        <button onClick={() => interact("pet")}>
          <Heart size={17} />
          Pet
        </button>
        <button onClick={() => interact("treat")}>
          <Cookie size={17} />
          Give treat
        </button>
        <button onClick={() => interact("play")}>
          <CircleDot size={17} />
          Play
        </button>
      </div>
      <div className="companion-points">
        <span>
          <Trophy size={18} />
          <strong>{user.points}</strong> contribution points
        </span>
        <span>{user.level}</span>
      </div>
      <progress
        aria-label="Contribution level progress"
        value={Math.min(
          progressMax,
          Math.max(0, user.points - user.levelStart),
        )}
        max={progressMax}
      />
      <p className="companion-growth-copy">
        {growth.stage < 3 ? (
          <>
            {remaining} more points until your buddy grows into{" "}
            {growth.stage === 1 ? "an adolescent" : "an adult"}.
          </>
        ) : (
          <>All grown up. Keep making a difference together.</>
        )}
      </p>
      <ol className="companion-milestones">
        {["Puppy", "Adolescent", "Adult"].map((label, index) => (
          <li
            key={label}
            className={
              growth.stage === index + 1
                ? "current"
                : growth.stage > index + 1
                  ? "earned"
                  : "locked"
            }
          >
            <span>
              {growth.stage > index + 1 ? (
                <Check size={16} />
              ) : growth.stage < index + 1 ? (
                <LockKeyhole size={15} />
              ) : (
                <PawPrint size={16} />
              )}
            </span>
            <strong>{label}</strong>
            <small>Level {index + 1}</small>
          </li>
        ))}
      </ol>
      <p className="companion-footnote">
        <Sparkles size={14} />
        Your contributions help your companion grow. Petting, treats, and play
        are just for fun.
      </p>
    </section>
  );
}
