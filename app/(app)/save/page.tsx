"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SaveForm } from "@/components/save/SaveForm";
import { DepositTracker } from "@/components/save/DepositTracker";

export default function SavePage() {
  return (
    <Suspense>
      <SaveRouter />
    </Suspense>
  );
}

function SaveRouter() {
  const deposit = useSearchParams().get("deposit");
  return deposit ? <DepositTracker id={deposit} /> : <SaveForm />;
}
