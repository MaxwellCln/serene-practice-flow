/**
 * ─────────────────────────────────────────────────────────────
 *  EDIT YOUR WEBSITE HERE
 *  Everything the site says lives in this one file. Change the
 *  text between the quote marks and the site updates.
 *  (Prices are in cents: 9000 = €90.00)
 * ─────────────────────────────────────────────────────────────
 */

export const site = {
  practiceName: "Aoife Brennan Psychotherapy",
  shortName: "Aoife Brennan",
  tagline: "Psychotherapy & counselling, online and in person",
  credentials: "MIACP Accredited Psychotherapist",
  location: "Dublin 6, Ireland",
  email: "hello@example-practice.ie",
  phone: "+353 1 234 5678",
  currency: "EUR",
  currencySymbol: "€",

  hero: {
    eyebrow: "Now accepting new clients",
    heading: "A steady place to think things through.",
    body: "Warm, confidential therapy for anxiety, burnout and life transitions. Fifty minutes, entirely yours.",
    primaryCta: "Book a session",
    secondaryCta: "How it works",
  },

  about: {
    heading: "Hello, I'm Aoife.",
    body: [
      "I'm an IACP-accredited psychotherapist with twelve years' experience supporting adults through anxiety, grief, burnout and relationship difficulties.",
      "My work is collaborative and unhurried. You set the pace; I bring curiosity, structure and a genuine belief that people change.",
    ],
    points: ["MSc Integrative Psychotherapy", "IACP accredited & fully insured", "Online and Dublin-based sessions"],
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
      a: "Some people come for six sessions, others for a year. We review together regularly so it's always your choice.",
    },
    {
      q: "Are online sessions as effective?",
      a: "Yes. Research shows online therapy works as well as in-person for most concerns, and many clients prefer it.",
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
        q: "Can I claim back the cost?",
        a: "Some health insurers reimburse part of the fee for accredited psychotherapy. I can provide receipts on request.",
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
          { title: "IACP.ie", author: "Irish Association for Counselling and Psychotherapy", note: "Find an accredited therapist." },
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
        format: "90 minutes · in person or online",
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
    body: "A short email is a perfectly good place to start. I reply within two working days.",
  },

  /** Weekly availability, 24h clock. Remove a day to close it. */
  availability: {
    timezoneLabel: "Irish time (IST/GMT)",
    days: [
      { weekday: 1, label: "Monday", times: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"] },
      { weekday: 2, label: "Tuesday", times: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"] },
      { weekday: 3, label: "Wednesday", times: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00"] },
      { weekday: 4, label: "Thursday", times: ["09:00", "10:00", "11:00", "14:00", "15:00"] },
      { weekday: 5, label: "Friday", times: ["09:00", "10:00", "11:00"] },
    ],
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
