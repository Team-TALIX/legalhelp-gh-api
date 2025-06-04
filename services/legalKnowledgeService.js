/**
 * Legal Knowledge Base Service
 * Contains legal topics, responses, and emergency contacts for Ghana
 */

// Legal knowledge base for generating responses
const legalKnowledgeBase = {
  // Common legal topics and their responses in all supported languages
  topics: {
    tenant_rights: {
      keywords: [
        "tenant",
        "landlord",
        "rent",
        "evict",
        "eviction",
        "rental",
        "housing",
        "lease",
      ],
      responses: {
        en: {
          basic:
            "As a tenant in Ghana, you have several rights protected by law. These include the right to a safe and habitable living space, protection against unlawful eviction (landlord must provide at least 3 months notice), and the right to privacy. Your landlord cannot arbitrarily increase rent or enter your premises without proper notice.",
          detailed:
            "Your tenant rights in Ghana include: 1) Right to habitable accommodation 2) 3 months notice for eviction 3) Protection against arbitrary rent increases 4) Right to privacy and peaceful enjoyment 5) Right to essential services like water and electricity. If you face issues, document everything and consider contacting the Rent Control Department.",
        },
        tw: {
          basic:
            "Sɛ ɔhɔhoɔ wɔ Ghana no, mmara bɔ wo ho ban wɔ akwan ahodoɔ so. Yeinom ka ho ne tena baabi a ɛho wɔ ban, banbɔ a ɛtia ateetee mpampa (ɛsɛ sɛ wura de bosome 3 tafrakyɛ ma wo), ne ho banbɔ. Wo wura ntumi nnyɛ n'adwene so mma ɛfie apaade nnkɔ soro anaasɛ ɔnntumi mma wo dan mu a wamma wo nkra kama.",
          detailed:
            "Wo hɔhoɔ hokwan wɔ Ghana no yɛ: 1) Hokwan a wobɛtena baabi a ɛho wɔ ban 2) Bosome 3 amanneɛ ansa na wɔapam wo 3) Banbɔ a ɛtia ɛfie apaade a wɔbɛma akɔ soro 4) Hokwan a wobɛkɔ wo dan mu komm 5) Hokwan a wobɛnya nsuo ne kanea. Sɛ wohia mmoa a, kɔ Rent Control Department hɔ.",
        },
        ee: {
          basic:
            "Abe xɔdzikpɔla le Ghana la, se wò dzesi wò ablɔɖevinyenye le se nu. Esiawo dome nye be nàkpɔ nɔƒe si le dedie, wòakpɔ wò ta tso amewo ƒe nyamanyama megbedede me (ele be aƒetɔ nàna ɣleti 3 ƒe nyanana), kple ablɔɖevinyenye si na be womate ŋu ade wò ƒe me o.",
          detailed:
            "Wò xɔdzikpɔla ƒe ablɔɖevinyenyewo le Ghana nye: 1) Ablɔɖe be nànɔ teƒe si me dedie le 2) Ɣleti 3 ƒe nyanana hafi woanya wò 3) Takpekpe tso ga si woaxe na xɔ la ƒe dzidzi me 4) Ablɔɖe be nànɔ ŋutifafa me 5) Ablɔɖe be nàkpɔ tsi kple kekeli. Ne èhia kpekpeɖeŋu la, yi Rent Control Department.",
        },
        dag: {
          basic:
            "Ka a ni dagbani saamba m Ghana, a mali yɛlmaŋsim shɛm mini n soli a. Ŋahiŋ nyɛla a yɛla tiŋgbani shɛli mini saɣim, guubu ka bi ŋma a kanaani (yiɣili wumdiri n-niŋ ka yidana ti o chɛ ni bini kikaa ŋahiŋ), mini sumbu.",
          detailed:
            "A yɛla kani dakalibu mba Ghana: 1) Kani tiŋgbani shɛli saɣim 2) Kari kikaa ŋahiŋ ka bi ŋma a 3) Yiɣili yɛla tooi bɔhim tahi din bi simda 4) Kani sumbu ni silimin yɛla 5) Kani a ti kɔɣim ni kansim. Ka a bɔri kpakuya, kɔ Rent Control Department ni.",
        },
      },
    },
    land_registration: {
      keywords: [
        "land",
        "property",
        "register",
        "title",
        "deed",
        "ownership",
        "boundary",
        "survey",
      ],
      responses: {
        en: {
          basic:
            "Land registration in Ghana requires several steps. First, you need to verify the land ownership with the Lands Commission. Then, you must conduct a property search, prepare a site plan, and file for registration. The process can take 3-6 months and requires payment of various fees.",
          detailed:
            "Complete land registration process: 1) Verify ownership at Lands Commission 2) Conduct property search 3) Engage licensed surveyor for site plan 4) Submit application with required documents 5) Pay registration fees 6) Obtain land title certificate. Required documents include: purchase agreement, site plan, tax clearance, and identification.",
        },
        tw: {
          basic:
            "Asase ntoatoasoɔ wɔ Ghana hwehwɛ nkwankyerɛ ahodoɔ. Nea edi kan, ɛsɛ sɛ wosi asase no mu gyinaeɛ kɔ Lands Commission. Afei, ɛsɛ sɛ woyɛ agyapadeɛ hwehwɛmmu, yɛ baabiara nhyehyɛeɛ, na wode ma ntoatoasoɔ.",
          detailed:
            "Asase ntoatoasoɔ nhyehyɛeɛ: 1) Kɔ hwɛ sɛ asase no yɛ wo deɛ wɔ Lands Commission 2) Yɛ agyapadeɛ nhwehwɛmu 3) Fa obi a ɔtumi susu asase 4) De nkrataa a ɛho hia kɔma wɔn 5) Tua ka a ɛho hia 6) Nya asase no krataa. Nkrataa a ɛho hia no yɛ: ntɔkwa nhyehyɛeɛ, asase nhyehyɛeɛ, towtua krataa, ne wo ho krataa.",
        },
        ee: {
          basic:
            "Anyigba ŋkɔ ɖoɖo le Ghana bia afɔɖeɖe geɖe. Gbã, ele be nàkpɔ anyigba la ƒe amenyenye kple Lands Commission. Emegbe, ele be nàwɔ nunɔamesiwo ƒe didiɖeɖe, nàdzra teƒea ƒe ɖoɖo, eye nàwɔ ŋkɔɖoɖo.",
          detailed:
            "Anyigba ŋkɔɖoɖo ƒe ɖoɖo blibo: 1) Kpɔ amenyenye le Lands Commission 2) Wɔ nunɔamesiwo ƒe didiɖeɖe 3) Zã anyigbadzela si wòɖe mɔ nɛ 4) Do nupapɛwo kple agbalẽ siwo hiã 5) Xe fe si hiã 6) Xɔ anyigba ƒe agbalẽ. Agbalẽ siwo hiã la woe nye: ƒleƒe ɖoɖo, teƒea ƒe ɖoɖo, adzɔ ɖoɖo, kple nàwo ŋkɔ.",
        },
        dag: {
          basic:
            "Tiŋgbani maliya Ghana puuni n niŋ shɛm n-niŋda. Zuɣdaa ni, a ni tooi niŋ tiŋgbani daaŋdana mbi pahi Tiŋgbannaayili (Lands Commission). Ka di ŋma, a ni ti n-yɛli yɛri wuntali, mali zaani ni jɛŋŋu, ni a zaŋ n-che Tiŋgbannaayili ni gbiniya.",
          detailed:
            "Tiŋgbani maliya ŋɔni: 1) Kpɛŋ tiŋgbani dundana Tiŋgbannaayili 2) Ti n-yɛli yɛri wuntali 3) Nayili tiŋgbani kpɛni yaraali ni 4) Chaŋ laɣim shɛli ni zaani mali 5) To gbiniya 6) Nyaŋ tiŋgbani laɣa. Laɣim shɛli n-niŋda: yɛla ŋɔni, zaani mali, tooi laɣa, ni a yɛligu.",
        },
      },
    },
    police_rights: {
      keywords: [
        "arrest",
        "police",
        "jail",
        "detention",
        "rights",
        "lawyer",
        "custody",
        "bail",
      ],
      responses: {
        en: {
          basic:
            "If you're arrested in Ghana, you have the right to remain silent, the right to know the reason for your arrest, the right to legal representation, and the right to appear before a court within 48 hours. Do not resist arrest but calmly ask for the reason.",
          detailed:
            "Your rights when arrested: 1) Right to remain silent 2) Right to know charges against you 3) Right to legal representation 4) Right to be brought before court within 48 hours 5) Right to humane treatment 6) Right to contact family/lawyer 7) Right to bail (for bailable offenses). Never resist arrest, ask for the reason, and request to contact a lawyer immediately.",
        },
        tw: {
          basic:
            "Sɛ wɔkyere wo wɔ Ghana a, wowɔ ho kwan sɛ woayɛ dinn, wowɔ ho kwan sɛ wohunu nea enti a wɔkyere wo, wowɔ ho kwan sɛ mmara mu biakoyɛ, ne ho kwan sɛ wɔde wo bɛba asennii wɔ nnɔnhwerew 48 mu.",
          detailed:
            "Wo hokwan sɛ wɔkyere wo: 1) Hokwan sɛ wobɛyɛ dinn 2) Hokwan sɛ wobɛte mfomsoɔ a wɔkyere wo 3) Hokwan sɛ wobɛnya mmara mu ɔkansifoɔ 4) Hokwan sɛ wɔde wo bɛba asennii wɔ nnɔnhwerew 48 mu 5) Hokwan sɛ wɔbɛyɛ wo yie 6) Hokwan sɛ wobɛfrɛ wo mmusua/ɔkansifoɔ 7) Hokwan sɛ wobɛnya gyeabɔ. Mma wonsi wo kyereɛ no tua.",
        },
        ee: {
          basic:
            "Ne wolé wò le Ghana la, ablɔɖevinyenye le asiwò be nàzi ɖoɖoe, ablɔɖevinyenye be nànya susu si ta wolé wò ɖo, ablɔɖevinyenye be sefialawo nàtsi tre ɖe tewò, eye ablɔɖevinyenye be woakplɔ wò ayi ʋɔnu le gaƒoƒo 48 me.",
          detailed:
            "Wò ablɔɖevinyenyewo ne wolé wò: 1) Ablɔɖevinyenye be nàzi ɖoɖoe 2) Ablɔɖevinyenye be nàse nu siwo tsina ɖe ŋuwò 3) Ablɔɖevinyenye be sefiala nàtsi tre ɖe tewò 4) Ablɔɖevinyenye be woakplɔ wò ayi ʋɔnu le gaƒoƒo 48 me 5) Ablɔɖevinyenye be wowɔ wò nyuie 6) Ablɔɖevinyenye be nàƒo ka ɖe ƒometɔwo/sefiala 7) Ablɔɖevinyenye be woaɖe wò le gaxɔme. Mègaɖo asi le léle ŋu o.",
        },
        dag: {
          basic:
            "Ka bi nya a Ghana, a mali yɛla kani n ŋma shie, yɛla kani n baŋ daliri din niŋda ka bi nya a, yɛla kani m malila soli yaara, ni yɛla kani n kpe tibi tuun puuni saha ni n-niŋ 48 puuni.",
          detailed:
            "A yɛla kani dakalibu ka bi nya a: 1) Yɛla kani n ŋma shie 2) Yɛla kani n baŋ malli n-zaŋ a 3) Yɛla kani m malila soli yaara 4) Yɛla kani n kpe tibi tuun puuni saha ni n-niŋ 48 puuni 5) Yɛla kani n siɣim nyɛla 6) Yɛla kani n kɔl a daba bee soli yaara 7) Yɛla kani n nyaŋ kufuli. Di ku simdi ka a zemda.",
        },
      },
    },
    divorce: {
      keywords: [
        "divorce",
        "marriage",
        "separation",
        "custody",
        "alimony",
        "spouse",
        "matrimonial",
      ],
      responses: {
        en: {
          basic:
            "To file for divorce in Ghana, you must have been married for at least 2 years. You need to file a petition at the High Court, citing grounds such as adultery, unreasonable behavior, or separation. The process requires legal representation.",
          detailed:
            "Divorce process in Ghana: 1) Must be married for minimum 2 years 2) File petition at High Court with grounds (adultery, cruelty, desertion, etc.) 3) Serve petition on spouse 4) Court proceedings and hearing 5) Final decree. Consider mediation first. Legal representation is strongly recommended. Child custody and property division will be addressed separately.",
        },
        tw: {
          basic:
            "Sɛ wobɛpɛ aware mu gyaeɛ wɔ Ghana a, ɛsɛ sɛ woaware bɛyɛ mfeɛ 2. Ɛsɛ sɛ wode abisadeɛ kɔma High Court, a woka nsɛm te sɛ awareɛ mu agorɔ, suban a ɛnyɛ nyinaa, anaasɛ mpaepaemu.",
          detailed:
            "Awareɛ mu gyaeɛ nhyehyɛeɛ Ghana: 1) Ɛsɛ sɛ woaware bɛyɛ mfeɛ 2 2) De abisadeɛ kɔma High Court ka nsɛm (awareɛ agorɔ, atirimuɔden, gyaeɛ) 3) Ma wo yere/wo kunu no nnya krataa no 4) Asennii dwumadie 5) Gyinaeɛ a etwa toɔ. Di kan hwɛ sɛ wobɛsiesie kwan bi so. Ɔkansifoɔ ho hia pa ara.",
        },
        ee: {
          basic:
            "Be nàwɔ srɔ̃ɖeɖe megbedede le Ghana la, ele be nànɔ srɔ̃ɖeɖe me ƒe 2 sɔŋ. Ele be nàŋlɔ biabia aɖo ɖe High Court, anɔ susu aɖewo dom abe ahasiwɔwɔ, agbenɔnɔ si meɖi o, alo kpekpeɖeɖemama ene.",
          detailed:
            "Srɔ̃ɖeɖe megbedede ɖe Ghana: 1) Ele be nànɔ srɔ̃ɖeɖe me ƒe 2 2) Ŋlɔ biabia ɖo ɖe High Court kple tatawo (ahasiwɔwɔ, nu vlo wɔwɔ, gbegblẽ) 3) Na srɔ̃a naxɔ agbalẽa 4) Ʋɔnudrɔ̃ƒe ƒe ɖoɖowo 5) Nyanyanye mlɔtɔ. Bu nubabla gbã. Ɖasefiala wɔwɔ le vevie ŋutɔ.",
        },
        dag: {
          basic:
            "Ka a ni bɔri ka a ŋahi paɣa Ghana puuni, a ni simdi ka a niŋ kuli yuma ayi zuɣu. A ni simdi ka a che Ʒiɣli din kari tibi shɛŋa bɛbi, n-zaŋ daliri yɛtooɣa ŋɔni bee chaŋchigu bee ni shie zoli.",
          detailed:
            "Ŋahi paɣa ŋɔni Ghana: 1) Simdi ka a niŋ kuli yuma ayi 2) Che biabia shɛŋa bɛbi ni zaŋ daliri (chaŋchigu, atirimi, zoli) 3) Na a kɔŋkɔhimbu nti laɣa 4) Tibi shɛŋa dwuma 5) Pugsi din ni lari. Di kan bɔri latibu. Soli yaara bɔri vevie ŋɔ.",
        },
      },
    },
    worker_rights: {
      keywords: [
        "worker",
        "job",
        "labor",
        "employment",
        "salary",
        "overtime",
        "dismissal",
        "leave",
      ],
      responses: {
        en: {
          basic:
            "Workers in Ghana have rights including minimum wage protection, maximum working hours (generally 8 hours per day), overtime compensation, annual leave, maternity leave, and protection against unfair dismissal. You also have the right to join a labor union.",
          detailed:
            "Worker rights in Ghana: 1) Minimum wage (currently GH₵14.88 per day) 2) Maximum 8 hours work per day, 40 hours per week 3) Overtime pay (time and half) 4) 15 working days annual leave 5) 12 weeks maternity leave 6) Protection against unfair dismissal 7) Right to join unions 8) Safe working conditions 9) Rest periods and breaks. Contact Department of Labour for violations.",
        },
        tw: {
          basic:
            "Adwumayɛfoɔ wɔ Ghana wɔwɔ hokwan a ɛkeka ho akatua a ɛwɔ fam, adwuma dɔnhwerew ɛntra so (ɛtaa yɛ dɔnhwerew 8 da biara), ɔberɛ dɔnhwerew akatua, afe biara akwansie, awotwaa akwansie, ne banbɔ a ɛtia atirim mpampa.",
          detailed:
            "Adwumayɛfoɔ hokwan Ghana: 1) Akatua a ɛwɔ fam (seesei yɛ GH₵14.88 da biara) 2) Dɔnhwerew 8 da biara, dɔnhwerew 40 nnawɔtwe biara 3) Ɔberɛ dɔnhwerew akatua 4) Nnafua 15 afe biara akwansie 5) Nnawɔtwe 12 awotwaa akwansie 6) Banbɔ a ɛtia atirim mpampa 7) Hokwan sɛ wobɛkɔ adwumayɛfoɔ kuo mu 8) Adwumasoɔ mu ahobammɔ 9) Ahomegyeɛ ɛberɛ. Kɔ Department of Labour hɔ sɛ wɔbu wo hokwan so.",
        },
        ee: {
          basic:
            "Dɔwɔlawo le Ghana kpɔ ablɔɖevinyenye siwo dome nye fetudede si le ete ke, dɔwɔƒoƒo si meɖi akpa o (zi geɖe la, gaƒoƒo 8 gbe ɖeka), gaƒoƒo siwo wotsɔ kpe la ƒe fetu, ƒe sia ƒe dzudzɔ ɣeyiɣi, vidzidzi dzudzɔ ɣeyiɣi, kple taɖodzinu si tso dɔdede si meko le mɔ nu o la ŋu.",
          detailed:
            "Dɔwɔlawo ƒe ablɔɖevinyenyewo le Ghana: 1) Fetu si le ete ke (fifia nye GH₵14.88 gbe ɖeka) 2) Dɔwɔ gaƒoƒo 8 ko gbe ɖeka, gaƒoƒo 40 kwasiɖa ɖeka me 3) Gaƒoƒo bubuwo ƒe fetu 4) Ŋkeke 15 ƒe sia ƒe dzudzɔ 5) Kwasiɖa 12 vidzidzi dzudzɔ 6) Takpekpe tso dɔdede si meko le mɔ nu o 7) Ablɔɖe be woaka ɖe dɔwɔha me 8) Dedinɔnɔ le dɔwɔƒe 9) Dzudzɔɣeyiɣiwo. Kple Department of Labour ne woda le wò ablɔɖevinyenyewo dzi.",
        },
        dag: {
          basic:
            "Tumtumdiba Ghana puuni ni mali yɛlmaŋsim zaŋ chaŋ samli shɛli ti din bi pala, tuma ni bi chaŋsani saha (din nyɛla saha uni dahinli kam), saha shɛli din chaŋ kumda luri, yuma kam ka daa, paɣyaɣli daa, mini guubu tin zaŋ chaŋ nyubu din bi simda.",
          detailed:
            "Tumtumdiba yɛlmaŋsim Ghana: 1) Samli shɛli ti din bi pala (yira GH₵14.88 dahinli kam) 2) Tuma saha uni dahinli kam, saha 40 wiiki kam 3) Saha kukpam samli 4) Dahinli 15 yuma biɛɛ daa 5) Wiiki 12 paɣyaɣli daa 6) Guubu chaŋ nyubu din bi simda 7) Yɛla kani ka tumtumdiba zuɣu 8) Tumsoɣim ni ban 9) Daa puuni. Kɔ Department of Labour ka bi da a yɛlmaŋsim bɔŋ.",
        },
      },
    },
  },

  // Emergency contacts and legal aid information
  emergencyContacts: {
    en: {
      police: "Police Emergency: 191 or 18555",
      ambulance: "Ambulance: 193",
      fire: "Fire Service: 192",
      legal_aid: "Legal Aid Board: +233 302 663568",
      domestic_violence: "Domestic Violence Hotline: 055 222 2800",
      human_rights: "Commission on Human Rights: +233 302 230671",
    },
    tw: {
      police: "Apolisifoɔ Prɛko Kɔl: 191 anaasɛ 18555",
      ambulance: "Ambulane: 193",
      fire: "Ogya Kum Adwumayɛfoɔ: 192",
      legal_aid: "Legal Aid Board: +233 302 663568",
      domestic_violence: "Ɛfie Mu Basabasayɛ Kɔl: 055 222 2800",
      human_rights: "Onipa Hokwan Dwumadibea: +233 302 230671",
    },
  },
};

/**
 * Generate legal response based on query and context
 * @param {string} query - User's legal question
 * @param {string} language - Response language
 * @param {Object} context - Chat context
 * @returns {Promise<Object>} Generated response
 */
export const generateLegalResponse = async (query, language, context = {}) => {
  const lowerQuery = query.toLowerCase();
  let bestMatch = null;
  let confidence = 0;
  let matchedKeywords = [];

  // Find the best matching legal topic
  for (const [topicKey, topicData] of Object.entries(
    legalKnowledgeBase.topics
  )) {
    const keywordMatches = topicData.keywords.filter((keyword) =>
      lowerQuery.includes(keyword.toLowerCase())
    );
    

    const matchScore = keywordMatches.length / topicData.keywords.length;
    console.log(keywordMatches, matchScore);
    if (matchScore > confidence) {
      confidence = matchScore;
      bestMatch = topicKey;
      matchedKeywords = keywordMatches;
    }
  }

  // Default response if no strong match found
  if (confidence < 0.1) {
    const defaultResponses = {
      en: "I understand you're asking about a legal matter. I can help with questions about tenant rights, land registration, what to do if arrested, divorce procedures, worker rights, and more. Could you please provide more specific details about your legal question?",
      tw: "Mete aseɛ sɛ worebisa mmara mu nsɛm bi ho. Metumi boa wo wɔ nsɛm a ɛfa ɔhɔhoɔ hokwan, asase ntoatoasoɔ, deɛ wobɛyɛ sɛ wɔkyere wo, awareɛ mu gyaeɛ, adwumayɛfoɔ hokwan, ne deɛ ɛkeka ho. Wobɛtumi aka wo mmara mu asɛm no mu nsɛm akyerɛ me pefee?",
      ee: "Mese be èle biabiam tso se ŋuti. Mate ŋu akpe ɖe ŋuwò le biabiawo tso xɔdzikpɔlawo ƒe ablɔɖevinyenyewo, anyigba ŋkɔɖoɖo, nu si nàwɔ ne wolé wò, srɔ̃ɖeɖe megbedede ɖoɖo, dɔwɔlawo ƒe ablɔɖevinyenyewo, kple bubuwo ŋu. Àte ŋu agblɔ wò se ƒe biabiawo ƒe nyatakakawo nam?",
      dag:
        "N baŋ ka a pahi malila nsɛm. N tooi tuni a wɔ ɔhɔhoɔ yɛlmaŋsim, tiŋgbani maliya, ka bi nya a ka zaa ti bɛni, ŋahi paɣa ŋɔni, tumtumdiba yɛlmaŋsim, ni deɛ n-keka ŋɔ. A tooi ka goli a malila biabi din nsɛm ma n?",
    };

    return {
      content: defaultResponses[language] || defaultResponses.en,
      language,
      legalTopic: "general",
      confidence: 0.1,
      relatedTopics: Object.keys(legalKnowledgeBase.topics),
    };
  }

  // Get response for matched topic
  const topicData = legalKnowledgeBase.topics[bestMatch];
  const responses = topicData.responses[language] || topicData.responses.en;

  // Choose detailed response if user seems to need more information
  const useDetailedResponse =
    lowerQuery.includes("explain") ||
    lowerQuery.includes("detail") ||
    lowerQuery.includes("step") ||
    lowerQuery.includes("how") ||
    lowerQuery.includes("what") ||
    context.requestDetail;

  const selectedResponse =
    useDetailedResponse && responses.detailed
      ? responses.detailed
      : responses.basic;

  // Add emergency contacts if the query seems urgent
  let finalResponse = selectedResponse;
  if (isUrgentQuery(lowerQuery)) {
    const contacts =
      legalKnowledgeBase.emergencyContacts[language] ||
      legalKnowledgeBase.emergencyContacts.en;
    const relevantContact = getRelevantEmergencyContact(lowerQuery, contacts);
    if (relevantContact) {
      finalResponse += `\n\n${getUrgentContactMessage(
        language
      )}: ${relevantContact}`;
    }
  }

  return {
    content: finalResponse,
    language,
    legalTopic: bestMatch,
    confidence,
    relatedTopics: getSimilarTopics(bestMatch),
    matchedKeywords,
  };
};

/**
 * Check if query is urgent
 * @param {string} query - User query
 * @returns {boolean} Whether query is urgent
 */
export const isUrgentQuery = (query) => {
  const urgentKeywords = [
    "emergency",
    "urgent",
    "arrest",
    "police",
    "help",
    "now",
    "immediately",
    "violence",
    "abuse",
  ];
  return urgentKeywords.some((keyword) => query.includes(keyword));
};

/**
 * Get relevant emergency contact
 * @param {string} query - User query
 * @param {Object} contacts - Emergency contacts
 * @returns {string} Relevant contact
 */
export const getRelevantEmergencyContact = (query, contacts) => {
  if (query.includes("police") || query.includes("arrest"))
    return contacts.police;
  if (query.includes("ambulance") || query.includes("medical"))
    return contacts.ambulance;
  if (query.includes("fire")) return contacts.fire;
  if (query.includes("violence") || query.includes("abuse"))
    return contacts.domestic_violence;
  if (query.includes("rights")) return contacts.human_rights;
  return contacts.legal_aid;
};

/**
 * Get urgent contact message in specified language
 * @param {string} language - Message language
 * @returns {string} Urgent contact message
 */
export const getUrgentContactMessage = (language) => {
  const messages = {
    en: "For immediate assistance, contact",
    tw: "Sɛ wohia mmoa ntɛm a, frɛ",
    ee: "Ne èhia kpekpeɖeŋu enumake la, ƒo ka ɖe",
    dag: "Ka a bɔri kpakuya ntɛmntɛm, kɔl",
  };
  return messages[language] || messages.en;
};

/**
 * Get similar topics
 * @param {string} topic - Current topic
 * @returns {Array} Related topics
 */
export const getSimilarTopics = (topic) => {
  const topicRelations = {
    tenant_rights: ["land_registration", "worker_rights"],
    land_registration: ["tenant_rights"],
    police_rights: ["divorce", "worker_rights"],
    divorce: ["police_rights", "worker_rights"],
    worker_rights: ["tenant_rights", "police_rights", "divorce"],
  };
  return topicRelations[topic] || [];
};

/**
 * Get all available legal topics
 * @returns {Array} List of topic keys
 */
export const getAvailableTopics = () => {
  return Object.keys(legalKnowledgeBase.topics);
};

/**
 * Get emergency contacts for a language
 * @param {string} language - Language code
 * @returns {Object} Emergency contacts
 */
export const getEmergencyContacts = (language) => {
  return (
    legalKnowledgeBase.emergencyContacts[language] ||
    legalKnowledgeBase.emergencyContacts.en
  );
};
