/**
 * ─────────────────────────────────────────────────────────────
 *  EDIT YOUR WEBSITE HERE
 *  Everything the site says lives in this one file. Change the
 *  text between the quote marks and the site updates.
 *  (Prices are in cents: 9000 = €90.00)
 * ─────────────────────────────────────────────────────────────
 */

export const site = {
  practiceName: "Valerie O'Brien Quinn Psychotherapy",
  shortName: "Valerie O'Brien Quinn",
  tagline: "Online psychotherapy & counselling",
  credentials: "IAHIP Accredited Member",
  location: "Online sessions",
  email: "hello@example-practice.ie",
  phone: "+353 87 292 9087",
  language: "English",
  currency: "EUR",
  currencySymbol: "€",

  hero: {
    eyebrow: "Now accepting new clients",
    heading: "A steady place to think things through.",
    body: "Warm, confidential online therapy for anxiety, trauma, grief, relationship difficulties and life transitions.",
    primaryCta: "Book a session",
    secondaryCta: "How it works",
  },

  about: {
    heading: "Hello, I'm Valerie.",
    body: [
      "I'm an IAHIP-accredited psychotherapist offering online sessions. I work with adults and adolescents around anxiety, trauma, abuse, grief, family-of-origin difficulties, relationship diversity, burnout and life transitions.",
      "My approach is integrative, humanistic and collaborative. You set the pace; I bring curiosity, structure and a genuine belief that people can move through difficult experiences with support.",
    ],
    points: [
      "Masters in Integrative and Humanistic Psychotherapy",
      "Masters in Adolescent Psychotherapy",
      "MPhil, MA, MSc, MIAHIP",
      "IAHIP Accredited Member",
      "All sessions online",
    ],
  },

  reasons: {
    heading: "Reasons clients seek support",
    intro: "People come for many different reasons. Whatever has brought you here, we'll work with it together.",
    items: [
      "Abuse",
      "Anxiety, stress, worry & panic attacks",
      "Childhood & family-of-origin issues",
      "Family issues",
      "Grief, loss & bereavement",
      "PTSD",
      "Relationship diversity",
      "Trauma",
      "Work-related issues & burnout",
    ],
  },

  approach: {
    heading: "How we'll work together",
    intro: "Three simple stages — no jargon, no pressure.",
    steps: [
      {
        title: "A free 15-minute call",
        body: "We talk briefly about what's bringing you here and whether we're a good fit.",
      },
      {
        title: "Getting oriented",
        body: "The first few sessions map what's happening now and what you'd like to be different.",
      },
      {
        title: "Ongoing work",
        body: "Weekly 50-minute sessions, integrative and paced to you. You can pause or finish anytime.",
      },
    ],
  },

  servicesSection: {
    heading: "Sessions & fees",
    note: "Payment is taken securely at the time of booking. Free cancellation up to 24 hours before.",
  },

  faqs: [
    {
      q: "How long does therapy take?",
      a: "Some people come for six sessions, others for a year or more. We review together regularly so it's always your choice.",
    },
    {
      q: "Are online sessions as effective?",
      a: "Yes. Research shows online therapy can work well for many concerns, and many clients value the flexibility. All sessions here take place online.",
    },
    {
      q: "Is everything confidential?",
      a: "Yes, within the limits of the law and my professional code of ethics, which I'll explain in our first session.",
    },
    {
      q: "What if I need to cancel?",
      a: "Cancel or reschedule free of charge up to 24 hours before your session. Later cancellations are charged in full.",
    },
  ],

  /** Extra pages linked from the "More" menu in the navigation. */
  faqPage: {
    heading: "Questions, answered",
    intro: "A little more detail on how sessions work. If something isn't here, just ask.",
    extra: [
      {
        q: "Do you offer evening appointments?",
        a: "A small number of later slots open up each term. Ask on our intro call and I'll let you know what's free.",
      },
      {
        q: "Can I claim back the cost through my health insurance?",
        a: "Often, yes. Many Irish health insurers (such as VHI, Laya and Irish Life Health) reimburse part of the fee for sessions with an IAHIP-accredited psychotherapist, depending on your policy. After your session I can email you an itemised invoice with my accreditation details, which you forward to your insurer to make your claim. Check your own policy for what it covers.",
      },
      {
        q: "What happens in the first session?",
        a: "Mostly listening. We talk about what's brought you here, agree how we'll work, and answer any practical questions.",
      },
    ],
  },

  resources: {
    heading: "Books & resources",
    intro:
      "A short, unhurried list I often share with clients. Nothing here replaces therapy — they're simply good companions.",
    groups: [
      {
        title: "Anxiety & the nervous system",
        items: [
          { title: "When the Body Says No", author: "Gabor Maté", note: "On stress, boundaries and the body." },
          { title: "Unwinding Anxiety", author: "Judson Brewer", note: "Practical, kind and habit-focused." },
        ],
      },
      {
        title: "Grief & change",
        items: [
          { title: "The Year of Magical Thinking", author: "Joan Didion", note: "Grief, told plainly." },
          { title: "Transitions", author: "William Bridges", note: "Useful when a life stage is ending." },
        ],
      },
      {
        title: "Support in Ireland",
        items: [
          { title: "Samaritans — 116 123", author: "Free, 24 hours", note: "For any moment that feels too much." },
          { title: "IAHIP.ie", author: "Irish Association of Humanistic & Integrative Psychotherapy", note: "Find an accredited therapist." },
        ],
      },
    ],
  },

  workshops: {
    heading: "Workshops & speaking",
    intro:
      "Alongside clinical work I run small group workshops and speak to teams and training groups. Sessions are practical, evidence-based and never a sales pitch.",
    offerings: [
      {
        title: "Burnout at work",
        format: "90 minutes · online",
        body: "For teams noticing exhaustion and slipping boundaries. What burnout actually is, and what helps.",
      },
      {
        title: "Supporting an anxious colleague or friend",
        format: "Half day · small groups",
        body: "How to listen well, when to worry, and how to hold your own limits while helping.",
      },
      {
        title: "Talks & training groups",
        format: "By arrangement",
        body: "Guest lectures and CPD sessions for trainee therapists, schools and community organisations.",
      },
    ],
    cta: "Enquiries are welcome by email — a line or two about your group is plenty.",
  },

  contact: {
    heading: "Still deciding?",
    body: "A short email or phone call is a perfectly good place to start. I reply within two working days.",
  },

  /** Blog page text. Posts themselves are written in the admin dashboard. */
  blog: {
    heading: "Writing & reflections",
    intro:
      "Occasional short pieces on therapy, grief, anxiety and the business of being human. Nothing here is a substitute for therapy itself.",
  },

  /** Booking window and notice. Standing weekly times are edited in the admin dashboard. */
  availability: {
    timezoneLabel: "Irish time (IST/GMT)",
    /** How many days ahead clients can book */
    horizonDays: 28,
    /** Minimum notice, in hours */
    noticeHours: 24,
  },

  legal: {
    crisisNote:
      "Therapy is not an emergency service. If you are in crisis, contact your GP, emergency services, or the Samaritans on 116 123.",
  },
} as const;

export type SiteContent = typeof site;
