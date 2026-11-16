import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./components/auth/RequireAuth";
import { RequireCapability } from "./components/auth/RequireCapability";
import { Toaster } from "./components/ui/Sonner";
import { ApiModeProvider } from "./contexts/ApiModeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { EventFilterProvider } from "./contexts/EventFilterContext";
import { AppLayout } from "./layouts/AppLayout";
import { setApiMode } from "./lib/apiClient";
import { homePathFor } from "./lib/permissions";
import { queryClient } from "./lib/queryClient";
// import { CreateOrderPage } from "./pages/CreateOrderPage";
// import { DashboardPage } from "./pages/DashboardPage";
// import { EmailHistoryPage } from "./pages/EmailHistoryPage";
// import { EventDetailPage } from "./pages/EventDetailPage";
// import { EventsPage } from "./pages/EventsPage";
import { LoginPage } from "./pages/LoginPage";
// import { NotFoundPage } from "./pages/NotFoundPage";
// import { OrderDetailPage } from "./pages/OrderDetailPage";
// import { OrdersPage } from "./pages/OrdersPage";
// import { PaymentsPage } from "./pages/PaymentsPage";
// import { ScannerPage } from "./pages/ScannerPage";
// import { SettingsPage } from "./pages/SettingsPage";
// import { TicketsPage } from "./pages/TicketsPage";

const guard = (capability, element) => (
  <RequireCapability capability={capability}>{element}</RequireCapability>
);

/** Sends roles without dashboard access (e.g. scanners) to their own landing page. */
function HomeRoute() {
  const { user, can } = useAuth();
  if (!can("viewDashboard")) return <Navigate to={homePathFor(user)} replace />;
  return <DashboardPage />;
}

export function App({ dataSource = "demo" }) {
  setApiMode(dataSource);
  const previous = useRef(dataSource);

  useEffect(() => {
    if (previous.current !== dataSource) {
      previous.current = dataSource;
      // Tokens are namespaced per data source; restart cleanly so sessions and cache never mix.
      queryClient.clear();
      window.location.reload();
    }
  }, [dataSource]);

  return (
    <QueryClientProvider client={queryClient}>
      <ApiModeProvider mode={dataSource}>
        <BrowserRouter>
          <AuthProvider>
            <EventFilterProvider>
              <Routes>
                <Route path="login" element={<LoginPage />} />
                <Route
                  element={
                    <RequireAuth>
                      <AppLayout />
                    </RequireAuth>
                  }
                >
                  <Route index element={<HomeRoute />} />
                  {/* <Route
                    path="events"
                    element={guard("viewEvents", <EventsPage />)}
                  />
                  <Route
                    path="events/:eventId"
                    element={guard("viewEvents", <EventDetailPage />)}
                  />
                  <Route
                    path="orders"
                    element={guard("viewOrders", <OrdersPage />)}
                  />
                  <Route
                    path="orders/new"
                    element={guard("createOrders", <CreateOrderPage />)}
                  />
                  <Route
                    path="orders/:orderId"
                    element={guard("viewOrders", <OrderDetailPage />)}
                  />
                  <Route
                    path="payments"
                    element={guard("viewPayments", <PaymentsPage />)}
                  />
                  <Route
                    path="tickets"
                    element={guard("viewTickets", <TicketsPage />)}
                  />
                  <Route
                    path="scanner"
                    element={guard("checkIn", <ScannerPage />)}
                  />
                  <Route
                    path="emails"
                    element={guard("viewDeliveries", <EmailHistoryPage />)}
                  />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFoundPage />} /> */}
                </Route>
              </Routes>
              <Toaster position="top-right" richColors closeButton />
            </EventFilterProvider>
          </AuthProvider>
        </BrowserRouter>
      </ApiModeProvider>
    </QueryClientProvider>
  );
}
