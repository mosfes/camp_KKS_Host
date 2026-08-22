export function isPrismaConnectionBusy(error: any) {
  return (
    error?.code === "P2024" ||
    (error?.code === "P2028" &&
      String(error?.message || "").includes("Unable to start a transaction"))
  );
}
