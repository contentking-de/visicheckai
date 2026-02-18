"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

type InviteInfo = {
  email: string;
  role: string;
  teamName: string;
};

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<
    "loading" | "show_invite" | "accepting" | "success" | "error"
  >("loading");
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const acceptInvite = useCallback(async () => {
    setStatus("accepting");
    try {
      const res = await fetch("/api/team/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Einladung erfolgreich angenommen!");
        setTimeout(() => router.push("/dashboard"), 1500);
      } else if (res.status === 401) {
        // Not logged in — should not happen if flow is correct,
        // but handle gracefully by redirecting to login
        router.push(`/login?callbackUrl=/invite/${token}`);
      } else {
        setStatus("error");
        setMessage(data.error || "Ein Fehler ist aufgetreten");
      }
    } catch {
      setStatus("error");
      setMessage("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    }
  }, [token, router]);

  useEffect(() => {
    async function init() {
      // Step 1: Validate the token and get invite info
      try {
        const infoRes = await fetch(`/api/team/invite/accept?token=${token}`);
        const infoData = await infoRes.json();

        if (!infoRes.ok) {
          setStatus("error");
          if (infoData.error === "AlreadyAccepted") {
            setMessage("Diese Einladung wurde bereits angenommen.");
          } else if (infoData.error === "Expired") {
            setMessage("Diese Einladung ist abgelaufen. Bitte fordern Sie eine neue an.");
          } else {
            setMessage(infoData.error || "Einladung nicht gefunden.");
          }
          return;
        }

        setInvite(infoData);

        // Step 2: Try to accept (which checks if logged in)
        const acceptRes = await fetch("/api/team/invite/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const acceptData = await acceptRes.json();

        if (acceptRes.ok) {
          // Already logged in — auto-accepted!
          setIsLoggedIn(true);
          setStatus("success");
          setMessage(acceptData.message || "Einladung erfolgreich angenommen!");
          setTimeout(() => router.push("/dashboard"), 1500);
        } else if (acceptRes.status === 401) {
          // Not logged in — show the invite page with login option
          setIsLoggedIn(false);
          setStatus("show_invite");
        } else {
          setStatus("error");
          setMessage(acceptData.error || "Ein Fehler ist aufgetreten");
        }
      } catch {
        setStatus("error");
        setMessage("Verbindungsfehler. Bitte versuchen Sie es erneut.");
      }
    }

    if (token) init();
  }, [token, router, acceptInvite]);

  const roleLabel = invite?.role === "owner" ? "Owner" : "Mitglied";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          {/* Loading */}
          {(status === "loading" || status === "accepting") && (
            <div>
              <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-black rounded-full mx-auto mb-4" />
              <p className="text-gray-600">
                {status === "accepting"
                  ? "Einladung wird angenommen..."
                  : "Einladung wird geladen..."}
              </p>
            </div>
          )}

          {/* Show invite info + login options (not logged in) */}
          {status === "show_invite" && invite && (
            <div>
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>

              <h1 className="text-xl font-bold mb-2">Team-Einladung</h1>

              <p className="text-gray-600 mb-1">
                Sie wurden eingeladen, dem Team
              </p>
              <p className="text-lg font-semibold text-black mb-1">
                „{invite.teamName}"
              </p>
              <p className="text-gray-600 mb-6">
                als <span className="font-medium">{roleLabel}</span> beizutreten.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500 mb-1">Einladung für</p>
                <p className="font-medium">{invite.email}</p>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Melden Sie sich an, um die Einladung anzunehmen.
                Sie können sich mit der eingeladenen E-Mail-Adresse oder mit Google anmelden.
              </p>

              <a
                href={`/login?callbackUrl=/invite/${token}`}
                className="block w-full py-3 px-4 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 transition"
              >
                Anmelden und Einladung annehmen
              </a>
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div>
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold mb-2">Willkommen im Team!</h1>
              <p className="text-green-700 font-medium">{message}</p>
              <p className="text-gray-500 text-sm mt-2">
                Sie werden zum Dashboard weitergeleitet...
              </p>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div>
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-bold mb-2">Einladung ungültig</h1>
              <p className="text-red-700">{message}</p>
              <a
                href="/"
                className="inline-block mt-5 py-2.5 px-5 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 transition"
              >
                Zur Startseite
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
