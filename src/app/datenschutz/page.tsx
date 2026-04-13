export const metadata = {
  title: "Datenschutzerklärung – Bensel Media Posting Planer",
  description: "Datenschutzerklärung für den Bensel Media Posting Planer",
};

export default function DatenschutzPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Datenschutzerklärung</h1>
      <p className="text-sm text-gray-500 mb-10">Stand: April 2026 · Bensel Media</p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">1. Verantwortlicher</h2>
        <p>
          Verantwortlich für die Datenverarbeitung im Sinne der DSGVO ist:
        </p>
        <address className="not-italic mt-2 text-gray-700">
          Bensel Media<br />
          Erick Bensel<br />
          Deutschland<br />
          E-Mail: kontakt@erickbensel.de
        </address>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">2. Zweck der Anwendung</h2>
        <p>
          Der Bensel Media Posting Planer ist ein internes Social-Media-Management-Tool.
          Es ermöglicht autorisierten Nutzern, Beiträge für verbundene Social-Media-Konten
          (Instagram, Facebook, TikTok, YouTube, LinkedIn) zu erstellen, zu planen und
          automatisch zu veröffentlichen.
        </p>
        <p className="mt-2">
          Die Anwendung wird ausschließlich von Mitarbeitern und Kunden von Bensel Media
          genutzt. Es handelt sich nicht um eine öffentlich zugängliche Plattform.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">3. Erhobene Daten</h2>
        <h3 className="font-medium mt-4 mb-1">3.1 Kontodaten</h3>
        <p>
          Bei der Verbindung eines Social-Media-Kontos werden folgende Daten gespeichert:
        </p>
        <ul className="list-disc ml-6 mt-2 space-y-1 text-gray-700">
          <li>Plattform-spezifische Nutzer- oder Seiten-ID</li>
          <li>Benutzername / Seitenname</li>
          <li>OAuth Access Token (verschlüsselt in der Datenbank)</li>
          <li>Token-Ablaufdatum</li>
        </ul>

        <h3 className="font-medium mt-4 mb-1">3.2 Beitragsdaten</h3>
        <p>
          Für geplante und veröffentlichte Beiträge werden gespeichert:
        </p>
        <ul className="list-disc ml-6 mt-2 space-y-1 text-gray-700">
          <li>Beitragstext / Caption</li>
          <li>Medien-URLs (Bilder, Videos – gespeichert bei Cloudinary)</li>
          <li>Geplanter Veröffentlichungszeitpunkt</li>
          <li>Veröffentlichungsstatus und Plattform-Post-ID nach Veröffentlichung</li>
        </ul>

        <h3 className="font-medium mt-4 mb-1">3.3 Meta-Plattformen (Instagram & Facebook)</h3>
        <p>
          Für die Integration mit Instagram und Facebook nutzen wir die Meta Graph API.
          Dabei werden folgende Berechtigungen verwendet:
        </p>
        <ul className="list-disc ml-6 mt-2 space-y-1 text-gray-700">
          <li><code className="bg-gray-100 px-1 rounded">pages_show_list</code> – Zugriff auf verbundene Facebook-Seiten</li>
          <li><code className="bg-gray-100 px-1 rounded">pages_read_engagement</code> – Lesezugriff auf Seiteninhalte</li>
          <li><code className="bg-gray-100 px-1 rounded">pages_manage_posts</code> – Veröffentlichen von Beiträgen auf Facebook-Seiten</li>
          <li><code className="bg-gray-100 px-1 rounded">instagram_basic</code> – Grundlegende Kontoinformationen</li>
          <li><code className="bg-gray-100 px-1 rounded">instagram_content_publish</code> – Veröffentlichen von Fotos und Reels auf Instagram</li>
        </ul>
        <p className="mt-2">
          Diese Berechtigungen werden ausschließlich genutzt, um im Auftrag des Kontoinhabers
          Inhalte zu veröffentlichen. Es werden keine Daten an Dritte weitergegeben.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">4. Datenspeicherung</h2>
        <p>
          Alle Daten werden in einer PostgreSQL-Datenbank (Neon, EU-Region) gespeichert.
          Medien werden über Cloudinary gespeichert. Beide Dienste verarbeiten Daten
          in der Europäischen Union.
        </p>
        <p className="mt-2">
          Access Tokens werden nur so lange gespeichert, wie das jeweilige Konto aktiv
          verbunden ist. Nach Trennung des Kontos werden alle zugehörigen Token gelöscht.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">5. Datenweitergabe</h2>
        <p>
          Daten werden nicht an Dritte verkauft oder für Werbezwecke genutzt.
          Eine Weitergabe erfolgt ausschließlich an die jeweiligen Plattform-APIs
          (Meta, TikTok, Google, LinkedIn) zum Zweck der Veröffentlichung von Inhalten
          im Auftrag des Nutzers.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">6. Rechte der Nutzer</h2>
        <p>Nutzer haben das Recht auf:</p>
        <ul className="list-disc ml-6 mt-2 space-y-1 text-gray-700">
          <li>Auskunft über gespeicherte Daten</li>
          <li>Berichtigung unrichtiger Daten</li>
          <li>Löschung aller gespeicherten Daten</li>
          <li>Widerruf der Plattform-Verbindungen jederzeit</li>
        </ul>
        <p className="mt-2">
          Anfragen bitte an: <a href="mailto:kontakt@erickbensel.de" className="text-blue-600 underline">kontakt@erickbensel.de</a>
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">7. Datenlöschung über Meta</h2>
        <p>
          Nutzer können die Verbindung zu Facebook und Instagram jederzeit über die
          Facebook-Einstellungen unter <strong>Einstellungen → Apps und Websites</strong> widerrufen.
          Dadurch werden alle gespeicherten Zugriffstoken sofort ungültig.
        </p>
        <p className="mt-2">
          Auf Anfrage löschen wir alle gespeicherten Daten innerhalb von 30 Tagen.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">8. Kontakt</h2>
        <p>
          Bei Fragen zum Datenschutz:{" "}
          <a href="mailto:kontakt@erickbensel.de" className="text-blue-600 underline">
            kontakt@erickbensel.de
          </a>
        </p>
      </section>
    </main>
  );
}
