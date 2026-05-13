import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { EdgeHubDashboard } from "./components/EdgeHubDashboard";
import { CentralCoordinationDashboard } from "./components/CentralCoordinationDashboard";
import { AuthorityTerminal } from "./components/AuthorityTerminal";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: EdgeHubDashboard },
      { path: "edge-hub", Component: EdgeHubDashboard },
      { path: "central", Component: CentralCoordinationDashboard },
      { path: "authority", Component: AuthorityTerminal },
    ],
  },
]);
