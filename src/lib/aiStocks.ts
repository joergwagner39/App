/**
 * KI-Aktie des Tages: kuratierte Liste mit Geschäftsmodell-Steckbrief.
 * Die Seite zeigt jeden Tag den nächsten Eintrag (Rotation über das Datum),
 * Kursdaten kommen – falls der Ticker im Screener-Universum ist – aus
 * data/screener/latest.json.
 */

export type AiLayer = 'Chips' | 'Fertigung' | 'Infrastruktur' | 'Cloud & Modelle' | 'Software' | 'Anwendung'

export interface AiStock {
  ticker: string
  name: string
  layer: AiLayer
  /** Ein Satz: womit verdient die Firma Geld? */
  pitch: string
  /** Wie das Geschäftsmodell funktioniert */
  model: string
  /** Welche Rolle die Firma im KI-Ökosystem spielt */
  aiRole: string
  /** Was die These kaputt machen könnte */
  risks: string
  /** Wichtigste Umsatzquellen */
  revenue: string[]
}

export const AI_STOCKS: AiStock[] = [
  {
    ticker: 'NVDA',
    name: 'Nvidia',
    layer: 'Chips',
    pitch: 'Verkauft die GPUs und kompletten Rechner-Systeme, auf denen fast alle großen KI-Modelle trainiert werden.',
    model:
      'Nvidia entwickelt Chips, lässt sie aber bei TSMC fertigen (fabless). Verkauft werden längst nicht nur einzelne GPUs, sondern ganze Rack-Systeme mit Netzwerktechnik (NVLink, InfiniBand, Spectrum-X). Die Software-Plattform CUDA bindet Entwickler seit fast 20 Jahren an die Hardware – das ist der eigentliche Burggraben.',
    aiRole: 'Der „Schaufelverkäufer“ des KI-Goldrauschs: Rechenzentrums-Umsatz macht den Großteil des Geschäfts aus.',
    risks: 'Abhängigkeit von wenigen Hyperscaler-Kunden, eigene Chips der Kunden (TPU, Trainium, MTIA), Exportbeschränkungen nach China, zyklische Investitionsbudgets.',
    revenue: ['Rechenzentrum (GPUs, Systeme, Netzwerk)', 'Gaming', 'Profi-Visualisierung', 'Automotive & Robotik'],
  },
  {
    ticker: 'TSM',
    name: 'TSMC',
    layer: 'Fertigung',
    pitch: 'Die Auftragsfertigung der Welt: produziert die modernsten Chips für Nvidia, Apple, AMD, Broadcom und Co.',
    model:
      'TSMC entwirft keine eigenen Chips, sondern fertigt im Auftrag (Foundry). Kunden zahlen pro Wafer; je moderner der Fertigungsknoten (3 nm, 2 nm), desto höher Preis und Marge. Dazu kommt Advanced Packaging (CoWoS), das für KI-Beschleuniger mit HBM-Speicher unverzichtbar ist.',
    aiRole: 'Nahezu jeder KI-Beschleuniger läuft durch TSMCs Fabriken – ein Quasi-Monopol bei Leading-Edge-Fertigung.',
    risks: 'Geopolitik rund um Taiwan, enorme Investitionen pro Fabrik, Konkurrenz durch Samsung und Intel Foundry.',
    revenue: ['High Performance Computing (KI, Server)', 'Smartphone', 'IoT', 'Automotive'],
  },
  {
    ticker: 'ASML',
    name: 'ASML',
    layer: 'Fertigung',
    pitch: 'Einziger Hersteller von EUV-Lithographiemaschinen, ohne die keine modernen Chips gebaut werden können.',
    model:
      'ASML verkauft Lithographie-Anlagen an Chipfabriken – eine EUV-Maschine kostet weit über 150 Mio. €, die neue High-NA-Generation deutlich mehr. Ein wachsender, stabiler Teil des Umsatzes kommt aus Service, Upgrades und Wartung der installierten Basis.',
    aiRole: 'Indirekter KI-Profiteur: mehr KI-Chips → mehr Leading-Edge-Kapazität → mehr EUV-Maschinen.',
    risks: 'Sehr zyklische Bestellungen, Exportbeschränkungen (China), Abhängigkeit von wenigen Kunden (TSMC, Samsung, Intel).',
    revenue: ['EUV-Systeme', 'DUV-Systeme', 'Service & Upgrades (Installed Base)'],
  },
  {
    ticker: 'AVGO',
    name: 'Broadcom',
    layer: 'Chips',
    pitch: 'Baut maßgeschneiderte KI-Chips (ASICs) für Hyperscaler und die Netzwerk-Chips in Rechenzentren – plus ein großes Software-Geschäft.',
    model:
      'Zwei Standbeine: Halbleiter (Custom-ASICs z. B. für Googles TPU, Ethernet-Switch-Chips wie Tomahawk/Jericho) und Infrastruktur-Software (VMware, Mainframe-Software). Broadcom ist bekannt für Übernahmen, Kostendisziplin und hohe Free-Cashflow-Margen.',
    aiRole: 'Profitiert, wenn Hyperscaler eigene Chips statt Nvidia-GPUs bauen – und vom Ethernet-Netzwerk zwischen den Beschleunigern.',
    risks: 'Hohe Kundenkonzentration bei Custom-Chips, Schulden aus Übernahmen, Kundenunmut über VMware-Preise.',
    revenue: ['Halbleiter (Custom-KI-Chips, Netzwerk, Broadband, Wireless)', 'Infrastruktur-Software (VMware)'],
  },
  {
    ticker: 'AMD',
    name: 'AMD',
    layer: 'Chips',
    pitch: 'Zweiter großer Anbieter von KI-GPUs (Instinct) neben Nvidia, dazu Server- und PC-Prozessoren.',
    model:
      'Fabless-Chipdesigner wie Nvidia. EPYC-Serverprozessoren gewinnen seit Jahren Marktanteile gegen Intel; mit der Instinct-MI-Serie und der Software ROCm greift AMD Nvidia im KI-Rechenzentrum an. Dazu PCs (Ryzen), Gaming-Konsolen-Chips und Embedded (Xilinx).',
    aiRole: 'Die wichtigste GPU-Alternative für Kunden, die nicht nur von Nvidia abhängen wollen.',
    risks: 'Software-Ökosystem hinter CUDA, Ausführungsrisiko bei neuen GPU-Generationen, zyklischer PC-Markt.',
    revenue: ['Rechenzentrum (EPYC, Instinct)', 'Client (Ryzen)', 'Gaming', 'Embedded'],
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft',
    layer: 'Cloud & Modelle',
    pitch: 'Verkauft KI über die Azure-Cloud und als Copilot in Office, GitHub und Windows.',
    model:
      'Wiederkehrende Abo-Umsätze aus Microsoft 365, Azure-Cloud nach Verbrauch abgerechnet, dazu Windows, LinkedIn, Xbox. Die Partnerschaft mit OpenAI bringt Modelle in Azure; Copilot-Lizenzen werden pro Nutzer zusätzlich zum Office-Abo verkauft.',
    aiRole: 'Größter Vertriebskanal für KI in Unternehmen – sowohl Infrastruktur (Azure) als auch Anwendung (Copilot).',
    risks: 'Sehr hohe Investitionen in Rechenzentren, Monetarisierung von Copilot, Abhängigkeit von OpenAI.',
    revenue: ['Intelligent Cloud (Azure)', 'Productivity & Business Processes (M365, LinkedIn, Dynamics)', 'Personal Computing (Windows, Xbox)'],
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet',
    layer: 'Cloud & Modelle',
    pitch: 'Verdient mit Werbung in Suche und YouTube und verkauft eigene KI-Modelle (Gemini) und TPUs über Google Cloud.',
    model:
      'Der Kern ist Werbung: Advertiser bezahlen pro Klick bzw. Einblendung in Suche, YouTube und im Werbenetzwerk. Google Cloud wächst schnell und ist profitabel. Alphabet ist eines der wenigen Unternehmen mit eigener KI-Forschung (DeepMind), eigenen Modellen und eigenen Chips (TPU).',
    aiRole: 'Vollständig integriert: Chips, Modelle, Cloud und Milliarden Nutzer in eigenen Produkten.',
    risks: 'KI-Chatbots könnten das Suchgeschäft kannibalisieren, Kartellverfahren, hohe Capex.',
    revenue: ['Google Search', 'YouTube Ads', 'Google Cloud', 'Abos, Plattformen & Geräte', 'Other Bets (Waymo)'],
  },
  {
    ticker: 'AMZN',
    name: 'Amazon',
    layer: 'Cloud & Modelle',
    pitch: 'Mit AWS der größte Cloud-Anbieter – vermietet Rechenleistung und KI-Dienste (Bedrock) an Unternehmen.',
    model:
      'Der Onlinehandel bringt Umsatz, aber AWS, Werbung und Prime-Abos bringen den Großteil des Gewinns. AWS rechnet nach Verbrauch ab; mit eigenen Chips (Trainium, Inferentia) senkt Amazon die Kosten für KI-Training und Inferenz.',
    aiRole: 'KI-Infrastruktur für Unternehmen über AWS, plus KI zur Effizienzsteigerung in Logistik und Werbung.',
    risks: 'Wettbewerb mit Azure und Google Cloud, hohe Capex, Margendruck im Handel.',
    revenue: ['Online-Shop', 'Third-Party-Seller-Services', 'AWS', 'Werbung', 'Abonnements (Prime)'],
  },
  {
    ticker: 'META',
    name: 'Meta Platforms',
    layer: 'Anwendung',
    pitch: 'Nutzt KI, um Werbung auf Facebook, Instagram und WhatsApp zielgenauer und profitabler zu machen.',
    model:
      'Fast der ganze Umsatz ist Werbung. KI-Empfehlungssysteme halten Nutzer länger in den Apps, KI-Werbetools (Advantage+) verbessern die Rendite für Werbekunden. Meta entwickelt eigene offene Modelle (Llama) und investiert massiv in Rechenzentren; Reality Labs (VR/AR) kostet Milliarden.',
    aiRole: 'Größter „interner“ KI-Anwender: KI wird direkt in höhere Werbepreise und mehr Engagement übersetzt.',
    risks: 'Regulierung und Datenschutz, sehr hohe Capex, Verluste bei Reality Labs.',
    revenue: ['Family of Apps (Werbung)', 'Reality Labs'],
  },
  {
    ticker: 'ORCL',
    name: 'Oracle',
    layer: 'Infrastruktur',
    pitch: 'Wandelt sich vom Datenbank-Anbieter zum Vermieter riesiger KI-Rechencluster (OCI).',
    model:
      'Historisch: Lizenz- und Wartungsumsätze für Datenbanken und Unternehmenssoftware. Heute wächst vor allem Oracle Cloud Infrastructure, die große GPU-Cluster per Langfristvertrag an KI-Labore vermietet. Der Auftragsbestand (RPO) ist dadurch stark gestiegen.',
    aiRole: 'Neocloud-artiger Infrastruktur-Anbieter für KI-Training – mit Datenbank-Know-how für Unternehmensdaten.',
    risks: 'Hohe Verschuldung für den Rechenzentrumsausbau, Abhängigkeit von wenigen Großkunden.',
    revenue: ['Cloud-Services & Lizenz-Support', 'Cloud-Infrastruktur (OCI)', 'Lizenzen', 'Hardware & Services'],
  },
  {
    ticker: 'PLTR',
    name: 'Palantir',
    layer: 'Software',
    pitch: 'Software, mit der Regierungen und Konzerne ihre Daten verknüpfen und KI-Modelle im operativen Alltag einsetzen.',
    model:
      'Verkauft Plattformen (Gotham für Behörden, Foundry für Unternehmen, AIP für generative KI) über mehrjährige Verträge. Typisch sind „Bootcamps“, in denen Kunden in wenigen Tagen einen Anwendungsfall bauen und dann den Vertrag ausweiten.',
    aiRole: 'Die „Betriebssystem“-Schicht zwischen KI-Modellen und echten Unternehmensdaten und -prozessen.',
    risks: 'Sehr hohe Bewertung, Abhängigkeit von staatlichen Aufträgen, Konkurrenz durch Hyperscaler-Tools.',
    revenue: ['Government (USA & international)', 'Commercial (USA & international)'],
  },
  {
    ticker: 'ARM',
    name: 'Arm Holdings',
    layer: 'Chips',
    pitch: 'Verkauft keine Chips, sondern lizenziert die Prozessor-Architektur, auf der fast alle Smartphones laufen.',
    model:
      'Kunden zahlen eine Lizenzgebühr für den Zugang zur Architektur und anschließend Royalties pro verkauftem Chip. Der Anteil steigt mit jeder neuen Generation (Armv9) und durch Compute Subsystems. Wachstum kommt zunehmend aus Rechenzentren (z. B. Nvidia Grace, AWS Graviton).',
    aiRole: 'Energieeffiziente CPUs für KI-Server und KI auf Endgeräten (Smartphones, PCs).',
    risks: 'Sehr hohe Bewertung, Konkurrenz durch RISC-V, Abhängigkeit vom Smartphone-Zyklus, Mehrheitseigner SoftBank.',
    revenue: ['Royalties', 'Lizenzen'],
  },
  {
    ticker: 'MU',
    name: 'Micron',
    layer: 'Chips',
    pitch: 'Produziert Speicherchips (DRAM, NAND) – insbesondere High Bandwidth Memory (HBM) für KI-Beschleuniger.',
    model:
      'Micron fertigt selbst (eigene Fabriken). Speicher ist ein Rohstoff-ähnliches, stark zyklisches Geschäft: Preise und Margen schwanken mit Angebot und Nachfrage. HBM ist jedoch knapp, technisch anspruchsvoll und wird oft im Voraus für das ganze Jahr verkauft.',
    aiRole: 'Jede KI-GPU braucht mehrere HBM-Stacks – Speicher wird zum Engpass beim KI-Training.',
    risks: 'Ausgeprägte Preiszyklen, Konkurrenz durch SK Hynix und Samsung, hohe Investitionen.',
    revenue: ['DRAM (inkl. HBM)', 'NAND'],
  },
  {
    ticker: 'ANET',
    name: 'Arista Networks',
    layer: 'Infrastruktur',
    pitch: 'Liefert Hochgeschwindigkeits-Ethernet-Switches, die GPUs in Rechenzentren miteinander verbinden.',
    model:
      'Arista verkauft Netzwerk-Switches mit einem einheitlichen Betriebssystem (EOS) an Cloud-Riesen wie Microsoft und Meta sowie an Unternehmen. Hohe Bruttomargen durch Software-Qualität bei Standard-Chips (u. a. von Broadcom).',
    aiRole: 'KI-Cluster mit zehntausenden GPUs brauchen extrem schnelles Netzwerk – Ethernet gewinnt dort gegenüber InfiniBand.',
    risks: 'Kundenkonzentration (Microsoft, Meta), Konkurrenz durch Nvidia-Netzwerk und Eigenbau-Switches.',
    revenue: ['Produkte (Switches, Router)', 'Services & Software-Abos'],
  },
  {
    ticker: 'VRT',
    name: 'Vertiv',
    layer: 'Infrastruktur',
    pitch: 'Liefert Stromversorgung und Kühlung (inkl. Flüssigkühlung) für Rechenzentren.',
    model:
      'Verkauft Anlagen für unterbrechungsfreie Stromversorgung, Stromverteilung und Kühlung, dazu Service-Verträge für die installierte Basis. KI-Racks verbrauchen ein Vielfaches an Strom und erzeugen so viel Wärme, dass Flüssigkühlung nötig wird.',
    aiRole: '„Picks and Shovels“ der physischen KI-Infrastruktur – jedes neue Rechenzentrum braucht Strom- und Kühltechnik.',
    risks: 'Abhängig von Rechenzentrums-Investitionen, Konkurrenz (Schneider Electric, Eaton), Lieferketten.',
    revenue: ['Produkte (Thermal, Power)', 'Services'],
  },
  {
    ticker: 'NOW',
    name: 'ServiceNow',
    layer: 'Software',
    pitch: 'Cloud-Plattform zur Automatisierung von Unternehmensabläufen (IT, HR, Kundenservice) – zunehmend mit KI-Agenten.',
    model:
      'Reines Abo-Modell (SaaS) mit sehr hoher Kundenbindung. Kunden starten meist im IT-Service-Management und kaufen dann weitere Module. Premium-Pakete mit generativer KI (Now Assist) und KI-Agenten werden mit Aufpreis verkauft.',
    aiRole: 'KI-Agenten erledigen Tickets und Workflows – ServiceNow liefert dafür Daten, Prozesse und Plattform.',
    risks: 'Hohe Bewertung, KI könnte sitzbasierte Lizenzen unter Druck setzen, Wettbewerb durch Microsoft und Salesforce.',
    revenue: ['Abonnements', 'Professional Services'],
  },
  {
    ticker: 'CRM',
    name: 'Salesforce',
    layer: 'Software',
    pitch: 'Marktführer bei CRM-Software – verkauft jetzt zusätzlich KI-Agenten (Agentforce) für Vertrieb und Service.',
    model:
      'Abo-Umsätze pro Nutzer für Sales Cloud, Service Cloud, Marketing, Slack, Tableau und MuleSoft. Mit Agentforce kommt ein verbrauchsabhängiges Preismodell pro KI-Konversation bzw. Aktion dazu.',
    aiRole: 'Kundendaten im CRM sind der Treibstoff für KI-Agenten im Vertrieb und Kundenservice.',
    risks: 'Wachstumsverlangsamung, KI könnte Nutzerzahlen (Sitze) reduzieren, Übernahmen.',
    revenue: ['Abonnements & Support (Sales, Service, Platform, Marketing, Integration/Analytics)', 'Professional Services'],
  },
  {
    ticker: 'SNOW',
    name: 'Snowflake',
    layer: 'Software',
    pitch: 'Cloud-Datenplattform: Unternehmen speichern und analysieren ihre Daten und bauen darauf KI-Anwendungen.',
    model:
      'Verbrauchsbasiertes Modell: Kunden zahlen für Rechenleistung und Speicher, nicht pro Nutzer. Läuft auf AWS, Azure und Google Cloud. Mit Cortex AI können Kunden Sprachmodelle direkt auf ihren Daten nutzen.',
    aiRole: 'Ohne saubere Daten keine Unternehmens-KI – Snowflake ist eine der zentralen Datenschichten.',
    risks: 'Konkurrenz durch Databricks und Hyperscaler, schwankender Verbrauch, aktienbasierte Vergütung.',
    revenue: ['Produktumsatz (Verbrauch)', 'Professional Services'],
  },
  {
    ticker: 'DDOG',
    name: 'Datadog',
    layer: 'Software',
    pitch: 'Überwachungs-Software (Observability) für Cloud-Anwendungen – inklusive Monitoring von KI-Modellen.',
    model:
      'SaaS mit Land-and-Expand: Kunden starten mit Infrastruktur-Monitoring und kaufen Logs, APM, Security und LLM-Observability dazu. Abrechnung überwiegend nach Nutzung (Hosts, Datenmengen).',
    aiRole: 'Mehr KI-Anwendungen → mehr Cloud-Workloads, die überwacht werden müssen; KI-native Firmen sind wichtige Kunden.',
    risks: 'Kostensenkungsprogramme bei Kunden, Abhängigkeit von großen KI-Kunden, Wettbewerb.',
    revenue: ['Infrastruktur-Monitoring', 'APM', 'Log-Management', 'Security & weitere Produkte'],
  },
  {
    ticker: 'CRWD',
    name: 'CrowdStrike',
    layer: 'Software',
    pitch: 'Cloud-basierte Cybersecurity, die Angriffe mit KI erkennt und abwehrt (Falcon-Plattform).',
    model:
      'Abo-Modell: Ein leichtgewichtiger Agent auf jedem Endgerät, Daten werden in der Cloud ausgewertet. Kunden kaufen zusätzliche Module (Cloud-Security, Identität, SIEM) – die Anzahl der Module pro Kunde ist die wichtigste Wachstumskennzahl.',
    aiRole: 'Nutzt KI zur Erkennung von Bedrohungen und schützt zugleich KI-Infrastruktur und -Anwendungen.',
    risks: 'Hohe Bewertung, Reputationsschaden nach dem Ausfall im Juli 2024, intensiver Wettbewerb.',
    revenue: ['Abonnements', 'Professional Services'],
  },
  {
    ticker: 'KLAC',
    name: 'KLA',
    layer: 'Fertigung',
    pitch: 'Marktführer bei Inspektions- und Messgeräten, die Fehler in der Chipproduktion finden.',
    model:
      'Verkauft Prozesskontroll-Systeme an Chipfabriken plus wiederkehrenden Service. Je kleiner die Strukturen, desto mehr Messschritte sind nötig – dadurch wächst KLAs Anteil an den Fabrik-Investitionen.',
    aiRole: 'Komplexe KI-Chips und Advanced Packaging erhöhen den Bedarf an Fehlerkontrolle.',
    risks: 'Zyklische Halbleiter-Investitionen, China-Exportbeschränkungen.',
    revenue: ['Halbleiter-Prozesskontrolle', 'Service', 'Spezialhalbleiter & PCB'],
  },
  {
    ticker: 'CDNS',
    name: 'Cadence Design',
    layer: 'Software',
    pitch: 'Software, mit der Chipdesigner ihre Chips entwerfen und simulieren (EDA).',
    model:
      'Langfristige Software-Lizenzverträge (meist 3 Jahre) mit sehr hoher Kundenbindung – kaum ein Chip entsteht ohne Cadence oder Synopsys. Dazu Hardware-Emulatoren und Simulationssoftware für Systeme.',
    aiRole: 'Jeder neue KI-Chip wird mit EDA-Tools entworfen; Cadence setzt selbst KI ein, um Chipdesign zu beschleunigen.',
    risks: 'Hohe Bewertung, China-Exportrisiken, Duopol-Wettbewerb mit Synopsys.',
    revenue: ['Core EDA', 'IP', 'System Design & Analysis'],
  },
  {
    ticker: 'SAP.DE',
    name: 'SAP',
    layer: 'Software',
    pitch: 'Europas größter Softwarekonzern: ERP-Systeme, mit denen Konzerne Finanzen, Einkauf und Logistik steuern.',
    model:
      'Umstieg von Lizenz + Wartung auf Cloud-Abos (RISE with SAP). Der Cloud-Auftragsbestand ist die zentrale Kennzahl. KI-Funktionen (Joule) werden in die Cloud-Produkte eingebaut und teils separat bepreist.',
    aiRole: 'Sitzt auf den wichtigsten Geschäftsdaten der Konzerne – ideal, um KI in Unternehmensprozesse zu bringen.',
    risks: 'Ausführungsrisiko bei der Cloud-Migration, Wettbewerb durch Oracle, Workday und neue KI-Anbieter.',
    revenue: ['Cloud', 'Software-Support', 'Lizenzen', 'Services'],
  },
  {
    ticker: 'IFX.DE',
    name: 'Infineon',
    layer: 'Chips',
    pitch: 'Leistungshalbleiter für Autos, Industrie – und die Stromversorgung von KI-Rechenzentren.',
    model:
      'Infineon fertigt größtenteils selbst und ist Weltmarktführer bei Leistungshalbleitern (Silizium, SiC, GaN) und Mikrocontrollern für Autos. Das Geschäft ist zyklisch und stark von Auto- und Industriekunden abhängig.',
    aiRole: 'KI-Server brauchen effiziente Stromversorgung; Infineon liefert die Leistungshalbleiter dafür.',
    risks: 'Schwache Auto- und Industrienachfrage, Zyklik, Konkurrenz aus China.',
    revenue: ['Automotive', 'Green Industrial Power', 'Power & Sensor Systems', 'Connected Secure Systems'],
  },
  {
    ticker: 'SU.PA',
    name: 'Schneider Electric',
    layer: 'Infrastruktur',
    pitch: 'Energiemanagement und Automatisierung – ein führender Ausrüster für Strom und Kühlung von Rechenzentren.',
    model:
      'Verkauft Schaltanlagen, USV-Systeme, Kühlung und Automatisierungssoftware an Industrie, Gebäude und Rechenzentren. Wachsender Software- und Service-Anteil (AVEVA).',
    aiRole: 'Rechenzentren sind eines der am schnellsten wachsenden Segmente – KI treibt den Strombedarf.',
    risks: 'Konjunkturabhängigkeit bei Gebäuden und Industrie, Wettbewerb.',
    revenue: ['Energy Management', 'Industrial Automation'],
  },
  {
    ticker: 'TSLA',
    name: 'Tesla',
    layer: 'Anwendung',
    pitch: 'Elektroautohersteller, dessen Bewertung zunehmend auf autonomem Fahren und Robotern (Optimus) beruht.',
    model:
      'Umsatz kommt überwiegend aus dem Autoverkauf, dazu Energiespeicher (Megapack), Services und Software (FSD-Abos). Tesla trainiert seine Fahr-KI mit Daten aus Millionen Fahrzeugen auf eigenen Rechenclustern.',
    aiRole: '„Physische KI“: Robotaxis und humanoide Roboter als langfristige Wette.',
    risks: 'Sinkende Automargen, regulatorische Hürden für autonomes Fahren, Abhängigkeit von Elon Musk.',
    revenue: ['Automotive', 'Energy Generation & Storage', 'Services & Sonstiges'],
  },
  {
    ticker: 'ADBE',
    name: 'Adobe',
    layer: 'Software',
    pitch: 'Kreativ- und Dokumentensoftware (Photoshop, Acrobat) – mit eigener Bild-KI Firefly.',
    model:
      'Abo-Modell über Creative Cloud, Document Cloud und Experience Cloud. Firefly ist in die Produkte integriert und über „Generative Credits“ monetarisiert; Adobe betont, dass die Modelle auf lizenzierten Daten trainiert wurden.',
    aiRole: 'Bringt generative KI in die Werkzeuge von Millionen Kreativen – muss sich aber gegen KI-native Konkurrenz behaupten.',
    risks: 'Disruption durch KI-Bildgeneratoren und günstige Alternativen (Canva), langsameres Wachstum.',
    revenue: ['Digital Media (Creative Cloud, Document Cloud)', 'Digital Experience'],
  },
  {
    ticker: 'NET',
    name: 'Cloudflare',
    layer: 'Infrastruktur',
    pitch: 'Globales Netzwerk für Sicherheit, Performance und Edge-Computing – inklusive KI-Inferenz am Rand des Netzes.',
    model:
      'Freemium-Modell: Viele Websites starten kostenlos, Unternehmen zahlen Abos für Security, CDN und Zero-Trust. Workers AI ermöglicht Inferenz auf GPUs in Cloudflares weltweiten Rechenzentren.',
    aiRole: 'Inferenz nahe beim Nutzer und Schutz von Websites vor KI-Crawlern.',
    risks: 'Hohe Bewertung, Profitabilität, Wettbewerb mit Hyperscalern und Akamai.',
    revenue: ['Abonnements (Application Services, Zero Trust, Developer Platform)'],
  },
  {
    ticker: 'ISRG',
    name: 'Intuitive Surgical',
    layer: 'Anwendung',
    pitch: 'Hersteller des OP-Roboters da Vinci – verdient vor allem an Instrumenten pro Eingriff.',
    model:
      'Klassisches „Rasierer-und-Klingen“-Modell: Krankenhäuser kaufen oder leasen das System, danach entstehen bei jeder OP wiederkehrende Umsätze für Instrumente und Zubehör sowie Service-Verträge.',
    aiRole: 'Datengetriebene Robotik in der Medizin – Daten aus Millionen Eingriffen fließen in Analyse- und Assistenzfunktionen.',
    risks: 'Neue Wettbewerber bei OP-Robotern, Krankenhausbudgets, Regulierung.',
    revenue: ['Instrumente & Zubehör', 'Systeme', 'Services'],
  },
]

/** Tag seit 1970 (UTC) – gleiche Aktie für alle Besucher am selben Tag. */
export function aiStockOfDay(date = new Date()): AiStock {
  const day = Math.floor(date.getTime() / 86_400_000)
  return AI_STOCKS[day % AI_STOCKS.length]
}
