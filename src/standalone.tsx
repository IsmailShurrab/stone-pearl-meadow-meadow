import { createRoot } from "react-dom/client";
import { LedgerApp } from "@/components/electricity/ledger-app";
import "@/styles.css";

const root = document.getElementById("root");
if (root) createRoot(root).render(<LedgerApp />);
