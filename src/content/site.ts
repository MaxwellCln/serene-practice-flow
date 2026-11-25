/**
 * ─────────────────────────────────────────────────────────────
 *  EDIT YOUR WEBSITE HERE
 *  Everything the site says lives in this one file. Change the
 *  text between the quote marks and the site updates.
 *  (Prices are in cents: 9000 = €90.00)
 * ─────────────────────────────────────────────────────────────
 */

export const site = {
  practiceName: "Cuan Psychotherapy",
  shortName: "Cuan",
  practitionerName: "Valerie O'Brien Quinn",
  practitionerFirstName: "Valerie",
  tagline: "Online psychotherapy & counselling",
  credentials: "IAHIP Accredited Member",
  location: "Online sessions",
  email: "hello@example-practice.ie",
  phone: "+353 87 292 9087",
  language: "English",
  currency: "EUR",
  currencySymbol: "€",

  /** The practice name and what it means — shown on the home page. */
  nameMeaning: {
    word: "Cuan",
    translation: "safe harbour",
    note: "Cuan is the Irish word for a harbour — a sheltered place to come into. Therapy is meant to be that: somewhere steady to rest while you work through what's happening, and then head back out.",
  },

  hero: {
    heading: "A steady place to think things through.",
    body: "Warm, confidential online therapy for anxiety, trauma, grief, relationship difficulties and life transitions.",
    primaryCta: "Book a free 15-min intro call",
    secondaryCta: "Already had your call? Book a session",
    note: "Everyone starts with the free call — no payment, no commitment. Full sessions open up once you've had it.",
  },

  about: {
    heading: "Hello, I'm Valerie.",
    body: [
      "I'm an IAHIP-accredited psychotherapist offering online sessions. I work with adults and adolescents around anxiety, trauma, abuse, grief, family-of-origin difficulties, relationship diversity, burnout and life transitions.",
      "My approach is integrative, humanistic and collaborative. You set the pace; I bring curiosity, structure and a genuine belief that people can move through difficult experiences with support.",
      "In plain terms, integrative means I don't follow a one-size-fits-all formula. We shape our sessions around what you need most right now.",
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
    cta: "Book the free 15-minute call",
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
    paths: "Everyone begins with the free intro call. Full sessions can be booked once that call has taken place.",
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

  /** "Online therapy" page in the More menu. */
  onlineTherapy: {
    heading: "How online therapy works",
    intro: "Everything happens online, so here's what to expect and how to get set up. It's simpler than it sounds.",
    sections: [
      {
        heading: "Your free 15-minute call — on WhatsApp",
        body: [
          "After you book, Valerie will contact you on WhatsApp, using the mobile number you gave, to arrange a short free call.",
          "It's a chance to talk briefly about what's bringing you here and make sure we're a good fit before your sessions begin.",
        ],
      },
      {
        heading: "Your sessions — on Microsoft Teams",
        body: [
          "Sessions take place on Microsoft Teams through a secure, private link sent to you before your appointment.",
          "You don't need a Teams account. You can join from your web browser, or use the free Teams app on your phone or tablet.",
        ],
      },
      {
        heading: "What you'll need",
        body: [
          "A private room where you won't be overheard or interrupted.",
          "Headphones, so the conversation stays private.",
          "A steady internet connection, and a computer, tablet or phone with a camera.",
        ],
      },
      {
        heading: "If the connection drops",
        body: [
          "Don't worry — it happens. Rejoin using the same link. If that doesn't work, Valerie will contact you by phone so we can carry on.",
        ],
      },
    ],
  },

  /** Working with adolescents — shown on the FAQs page. */
  adolescents: {
    q: "Do you work with teenagers?",
    a: "Yes. I hold a Masters in Adolescent Psychotherapy and work with young people aged 13 to 18. For anyone under 18, a parent or guardian gives consent and usually joins a short first conversation. After that, sessions are the young person's own space: what they share stays private, except where there is a risk to their safety, which I explain clearly to both of you at the start.",
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

  /** Privacy policy page — edit the wording here. */
  privacy: {
    heading: "Privacy policy",
    intro:
      "Cuan Psychotherapy is the online practice of Valerie O'Brien Quinn, an IAHIP-accredited psychotherapist. This page explains what information this website collects, why, and how it is looked after.",
    sections: [
      {
        heading: "What information is collected",
        body: [
          "When you book a session, the site asks for your name, email address, mobile number, the session type and time you choose, and anything you choose to share in the booking note. When you create an account, your email address and a securely stored password are kept by the sign-in service — your password is never visible to the practice.",
          "If you get in touch by email or phone, those details are used to reply to you.",
        ],
      },
      {
        heading: "How your information is used",
        body: [
          "Your details are used to provide your sessions, manage your bookings, send booking confirmations, changes and invoices, and respond to your enquiries. Your information is never sold and never used for advertising.",
        ],
      },
      {
        heading: "Confidentiality",
        body: [
          "Therapy is confidential. Anything you share in the booking note is visible only to Valerie, and no therapy notes or clinical records are kept on this website.",
        ],
      },
      {
        heading: "Who processes data on our behalf",
        body: [
          "This website is built and hosted on Lovable, which provides the hosting, database, sign-in and email delivery for the site. Pages load fonts from Google Fonts, which means your browser contacts Google's servers when a page opens.",
        ],
      },
      {
        heading: "Visitor analytics",
        body: [
          "This site uses Lovable's visitor analytics to understand how the site is used. It uses no cookies, stores nothing on your device, does not keep your IP address and does not identify you. Lovable collects this data for us. Lovable's privacy policy (https://lovable.dev/privacy) explains how it handles it.",
          "For every visitor it records the pages visited, where visitors came from, their country, browser, operating system and device type, how long they stay, how fast pages load, errors, and which buttons and links are clicked. Detailed data is kept for 90 days and daily summaries for a year.",
        ],
      },
      {
        heading: "How long information is kept",
        body: [
          "Booking and payment records are kept for as long as accounting and legal obligations require. You can delete your account at any time from your account settings — this removes your sign-in and personal details and anonymises any booking records that must be retained.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can ask to see the information held about you, have it corrected, or have it deleted. To do any of these, contact the practice using the details on the contact page.",
        ],
      },
      {
        heading: "Changes to this policy",
        body: [
          "If this policy changes, the updated version will be posted on this page.",
        ],
      },
    ],
  },
} as const;

export type SiteContent = typeof site;
