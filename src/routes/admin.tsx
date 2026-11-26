import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ location }) => {
    const auth = sessionStorage.getItem("admin_auth");
    if (!auth && location.pathname !== "/admin") {
      throw redirect({ to: "/admin" });
    }
  },
  component: () => <Outlet />,
});
