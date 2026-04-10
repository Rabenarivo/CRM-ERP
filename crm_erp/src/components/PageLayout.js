import AppNavbar from "./AppNavbar";

export default function PageLayout({ children }) {
  return (
    <div className="app-shell">
      <AppNavbar />
      <main className="page-content container">{children}</main>
    </div>
  );
}