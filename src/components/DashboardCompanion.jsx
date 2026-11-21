import React, { lazy, Suspense, useState } from "react";
import { PawPrint } from "lucide-react";
import { companionGrowth } from "./companionGrowth";

const DogScene = lazy(() => import("./DogScene"));

export default function DashboardCompanion({ user, settings }) {
  const growth = companionGrowth(user, settings?.levels);
  const [action, setAction] = useState(null);
  const pet = () => setAction({ type: "pet", at: Date.now() });
  return (
    <button
      type="button"
      className="dashboard-companion"
      aria-label={`Pet your Level ${growth.level} ${growth.name.toLowerCase()} companion`}
      title={`${growth.name} companion · Click to pet`}
      onClick={pet}
    >
      <Suspense fallback={<PawPrint size={42} />}>
        <DogScene stage={growth.stage} action={action} onPet={pet} />
      </Suspense>
    </button>
  );
}
