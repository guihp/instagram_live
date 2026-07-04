import { createServerFn } from "@tanstack/react-start";

import { getSetupStatus } from "../setup-status.server";

export const fetchSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  return getSetupStatus();
});
