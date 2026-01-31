export const TEXTS = {
  appVersion: "v0.10.1-beta",
  // ... existing headers, greetings, dashboard, quickHub ...
  
  // ADD THIS SECTION:
  categoryLobby: {
    titlePrefix: "Öva på", // "Practice"
    level: "Din nivå",
    answered: "Besvarade",
    correct: "Rätt",
    modes: {
      standard: { title: "Starta Standard", desc: "40 blandade frågor" },
      hard: { title: "Bara Svåra", desc: "Fokusera på dina missar (<60%)" },
      custom: { title: "Anpassad", desc: "Välj antal och tid själv" }
    }
  },

  // ... existing stats, loading, alerts ...
  stats: {
    // ... (keep existing stats text) ...
    title: "Min Statistik",
    back: "← Tillbaka",
    guestLock: {
      title: "Lås upp din statistik",
      desc: "Som gäst sparas inte din historik permanent. Skapa ett konto gratis för att se dina framsteg.",
      loginBtn: "Skapa Konto / Logga In",
      guestBtn: "Fortsätt som gäst"
    },
    config: {
      title: "Gränsvärden",
      desc: "Minsta % för grön nivå."
    },
    cards: {
      total: "Totalt antal svar",
      unique: "Unika frågor sedda",
    },
    subjects: "Statistik per Ämne",
    listTitle: "Detaljerad Frågelista",
    empty: "Ingen statistik ännu.",
    review: {
      title: "Granska Fråga",
      close: "Stäng",
      explanation: "Förklaring:",
      showAnswer: "Visa rätt svar & förklaring"
    }
  },
  loading: "Laddar MedQ...",
  alerts: {
    noQuestions: "Ojdå! Inga frågor hittades med dessa inställningar.",
    noHardQuestions: "Bra jobbat! Du har inga 'svåra' frågor kvar!"
  },
  headers: {
    title: "MedQ",
    bugReport: "🐛 Rapportera fel",
    stats: "📊 Statistik",
    logout: "Logga ut",
  },
  greetings: {
    morning: "God morgon",
    day: "God dag",
    evening: "God kväll",
    subHeader: "Redo att utmana dig själv idag?",
  },
  dashboard: {
    quickHubTitle: "Snabbval / Mix",
    quickHubDesc: "Blandade frågor. Algoritmstyrd fördelning.",
    customExamTitle: "Anpassad Tenta",
    customExamDesc: "Skräddarsy din upplevelse. Välj tid, ämnen och feedback.",
    chooseCategory: "Eller välj ett ämne:",
  },
  quickHub: {
    title: "Välj Tentaform",
    back: "← Tillbaka",
    options: {
      quick: { title: "Snabb", desc: "10 Frågor", emoji: "☕" },
      standard: { title: "Standard", desc: "40 Frågor", emoji: "📝" },
      marathon: { title: "Maraton", desc: "100 Blandade", emoji: "🧠" }
    }
  }
};