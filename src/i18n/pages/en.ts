import type { PagesContent } from './types';

const pages: PagesContent = {
  ui: {
    updated: 'Last updated: {date}',
    languages: 'This page in other languages',
  },

  guide: {
    title: 'How to download your Strava data',
    description: 'Step-by-step guide to requesting your Strava account archive (export_XXXX.zip) from a computer or phone and turning it into your year in running.',
    kicker: 'Step-by-step guide',
    lead: 'Strava gives you a free copy of your whole account. Requesting it takes a minute; then you just wait for an email. Here’s how, from a computer or from your phone.',
    sections: [
      {
        h: 'What the archive is',
        body: [
          'It’s a **.zip with everything you’ve uploaded to Strava**: the list of your activities, the original file of each one (the one your watch or phone recorded), your photos and your profile data. Any account can request it, free ones included.',
          'Requesting it **doesn’t delete or change anything**: Strava just sends you a copy.',
        ],
      },
      {
        h: 'Request it on Strava',
        body: [
          '1. Open **strava.com** in a browser, on your computer or phone, and log in. The Strava app doesn’t have this option.\n2. Tap your photo and go to **Settings → My Account → Download your account → Get Started**. Or jump straight there with [this link to Strava](strava).\n3. Tap **Request Download**.',
          'Strava only allows **one request per week**. If you asked recently, look for the email they already sent you.',
        ],
      },
      {
        h: 'Wait for the email and save the .zip',
        body: [
          'Strava emails the address on your account (“Your Strava archive is ready to download”). It usually takes a few minutes; with many years of activities, several hours.',
          'Tap **Download archive** and keep the **export_XXXXXXXX.zip** as it is, without unzipping it.',
          '- **Android:** it lands in your Downloads folder.\n- **iPhone:** Safari saves it to the Files app, under Downloads.\n- **Mac:** Safari may unzip it automatically. That’s fine: you can pick the folder instead.',
        ],
      },
      {
        h: 'Upload it and see your year',
        body: [
          'Go back to the [{brand} home page](home#crear) and drop the .zip into the box, or tap it to choose the file. Your story will be ready in a minute. If it’s already unzipped, use “Already unzipped? Choose the folder”.',
          'The file is **never uploaded to a server**: it’s read in your own browser. The details are in [Privacy and cookies](page:privacy).',
        ],
      },
      {
        h: 'If something goes wrong',
        body: [
          '- **The email doesn’t arrive.** Check your spam folder and make sure it’s the address on your Strava account. With lots of activities it can take hours.\n- **“I can’t find activities.csv”.** That .zip isn’t your account archive: the right one is called export_ followed by a number.\n- **The file is several GB.** No problem: only the parts that are needed get read.\n- **No runs show up, or it’s the wrong year.** Open “Customize” and check the year and which activity types count as running.',
          'Still stuck? Write to us at [{email}](mail).',
        ],
      },
    ],
  },

  how: {
    title: 'How your recap is calculated',
    description: 'Where every number in your running year comes from: distance, best efforts, heatmap, countries, heart rate, runner profile… and why some screens don’t show up.',
    kicker: 'In full detail',
    lead: 'Every number comes from your Strava account archive and is worked out in your browser. Here’s how, screen by screen.',
    sections: [
      {
        h: 'Where the data comes from',
        body: [
          'Two things are read from the archive: **activities.csv**, the list of all your activities with their distance, time, elevation and shoes; and **the original file of each run** (FIT, GPX or TCX), with second-by-second GPS and heart rate. It makes no difference whether you run with Garmin, Coros, Apple Watch or your phone.',
          'Only the runs of the chosen year are opened, so it works with multi-GB archives too.',
        ],
      },
      {
        h: 'What counts as running',
        body: [
          'By default, activities of type run, trail run and virtual run. Under “Customize” you can add or remove types: walks, for example.',
          'Activities faster than the world record for their distance are left out: they’re almost always a bike ride or a car trip saved as a run.',
        ],
      },
      {
        h: 'Distance, time and elevation',
        body: [
          'They’re the same values you see on Strava. Time is **moving time**, without the pauses.',
          'If the year isn’t over, the comparison with the previous one uses the same dates: where you were “at this point”.',
        ],
      },
      {
        h: 'Best efforts',
        body: [
          'For each distance (1 km or 1 mile, 5K, 10K, half marathon and marathon) we look for **the fastest stretch inside any of your runs**, using GPS. It doesn’t have to be a race: your best 5K may be hiding in the middle of a long run.',
        ],
      },
      {
        h: 'Maps, cities and countries',
        body: [
          'The site ships with its own world map and list of cities, so **your coordinates are never sent to a mapping service**. Your city is the area where most of your runs start.',
          'To avoid showing where you live, each route is drawn **without its first and last 250 meters** and without the parts inside your Strava privacy zones. You can turn this off under “Customize”, and you can also hide your city map.',
        ],
      },
      {
        h: 'Times and habits',
        body: [
          'The time of each run is the **local time of the place where you ran**, even when you were travelling. To tell whether you run at golden hour, at sunrise or after dark, we work out the real position of the sun that day in that place.',
        ],
      },
      {
        h: 'Heart rate',
        body: [
          'Heartbeats are estimated from the average heart rate and duration of each run. The five zones are based on your highest heart rate of the year: under 60%, 60–70%, 70–80%, 80–90% and over 90%.',
        ],
      },
      {
        h: 'Shoes',
        body: [
          'The distance of each pair is that of the runs you assigned it to on Strava. The lifespan bar also counts previous years and uses about 800 km (500 miles) as a reference.',
        ],
      },
      {
        h: 'Your runner profile',
        body: [
          'It’s one of ten profiles: early bird, night owl, globetrotter, mountain goat, long-hauler, speedster, metronome, weekend warrior, treadmill fan or all-rounder. It’s chosen by what sets you apart the most: your schedule, elevation, average distance, pace, the weeks you get out or the places you run.',
        ],
      },
      {
        h: 'Why a screen is missing',
        body: [
          'Each screen needs a minimum amount of data to say something meaningful. If you don’t reach it, it isn’t shown. Some examples:',
          '- **Calendar:** 10 days of running.\n- **Elevation:** 300 m of total gain.\n- **Best efforts:** at least two distances with GPS.\n- **Your city map:** 5 routes in the same area.\n- **Where you ran:** more than one city or country.\n- **Shoes:** a pair with 50 km, assigned to a good share of your runs.\n- **Other sports:** at least two more sports you really practise.\n- **Heart rate:** runs recorded with a heart rate monitor.',
        ],
      },
      {
        h: 'Images and video',
        body: [
          'Each screen is saved at 1080 × 1920, the size of an Instagram story. The video is also created in your browser; if yours can’t do it, you always have the image.',
        ],
      },
      {
        h: 'If something looks off',
        body: [
          'The numbers depend on what your watch recorded: a jumpy GPS or a mislabelled activity can change a result. If something doesn’t add up, tell us at [{email}](mail).',
        ],
      },
    ],
  },

  about: {
    title: 'About {brand}',
    description: 'What {brand} is, who makes it, how it’s funded and how to get in touch.',
    kicker: 'The project',
    lead: '{brand} turns your Strava account archive into a story of your running year, ready to share. It’s free, needs no sign-up and your data never leaves your device.',
    sections: [
      {
        h: 'Who’s behind it',
        body: [
          '{brand} is an independent project created by {owner}, in Spain. It doesn’t belong to Strava and has no relationship with it: it’s compatible with Strava because it reads the archive Strava lets any user download.',
        ],
      },
      {
        h: 'How it’s funded',
        body: [
          { when: 'noads', text: 'The site is free and currently has no advertising. Later on it may show ads to cover its costs, always outside your story and your images, and asking for your permission before using cookies.' },
          { when: 'ads', text: 'The site is free and is funded by advertising. Ads appear only on the home page, below your results and on the text pages: never inside your story or on the images you share.' },
        ],
      },
      {
        h: 'Contact',
        body: ['For questions, bugs or suggestions, write to [{email}](mail).'],
      },
      {
        h: 'Credits',
        body: [
          'The maps use data from Natural Earth and the list of cities comes from GeoNames (CC BY 4.0). The typefaces are Anton, Archivo, Oswald and Noto Sans. Here are the [licenses of the software and data the site uses](licenses).',
          'Strava is a registered trademark of Strava, Inc. {brand} is not affiliated with, sponsored or endorsed by Strava, Inc.',
        ],
      },
    ],
  },

  legal: {
    title: 'Legal notice and terms of use',
    description: 'Who owns {brand}, the terms of use of the site, intellectual property and governing law.',
    kicker: 'Legal',
    lead: 'Who owns this website and the terms on which it can be used.',
    sections: [
      {
        h: 'Website owner',
        body: [
          'In compliance with article 10 of Spanish Law 34/2002 on information society services and electronic commerce:',
          '- **Owner:** {owner}',
          { when: 'nif', text: '- **Tax ID (NIF):** {nif}' },
          { when: 'address', text: '- **Address:** {address}' },
          '- **Email:** [{email}](mail)\n- **Website:** {domain}',
        ],
      },
      {
        h: 'What {brand} is',
        body: [
          'A free tool that generates a yearly running recap from the data archive each person downloads from their own Strava account. All the processing happens in the browser of whoever uses it.',
        ],
      },
      {
        h: 'Relationship with Strava',
        body: [
          '{brand} is an independent project. It is not affiliated with, sponsored or endorsed by Strava, Inc., and it does not use the Strava API. Strava is a registered trademark of Strava, Inc.; it is mentioned only to indicate compatibility with the data archive Strava provides to its users.',
        ],
      },
      {
        h: 'Terms of use',
        body: [
          '- The site is for personal use. Use only the archive of your own account, or someone else’s with their permission.\n- Don’t use it for unlawful purposes or in a way that could damage it or prevent others from using it.\n- The numbers are calculated automatically from the data in your archive and are indicative: they may contain errors if the source data does.\n- The site is provided as is, with no guarantee of availability, and may change or stop being available.',
        ],
      },
      {
        h: 'Intellectual property',
        body: [
          'The design, code and texts of {brand} belong to its owner. They may not be copied or reused without permission.',
          '**The images and videos you generate with your data are yours**: you can download and share them freely.',
          'Third-party software and data used by the site keep their own [licenses](licenses).',
        ],
      },
      {
        when: 'ads',
        h: 'Advertising',
        body: [
          'The site is funded by advertising served by Google AdSense, which is identified as such. The owner does not choose the specific ads that are shown and is not responsible for the products or services advertised.',
        ],
      },
      {
        h: 'Liability',
        body: [
          'The owner is not liable for damage arising from improper use of the site, or for the content of external websites it links to. If you spot inappropriate content or a broken link, write to [{email}](mail).',
        ],
      },
      {
        h: 'Governing law',
        body: [
          'These terms are governed by Spanish law. If you are a consumer, any dispute will be settled by the courts of your place of residence.',
        ],
      },
    ],
  },

  privacy: {
    title: 'Privacy and cookies',
    description: 'What data {brand} processes and what it doesn’t: your Strava archive never leaves your device. Cookies, analytics, advertising and your rights.',
    kicker: 'Legal',
    lead: 'The essentials: **your Strava archive never leaves your device**. There are no accounts or sign-ups, and we never receive your activities, your routes or your photos.',
    sections: [
      {
        h: 'Who is responsible',
        body: [
          '{owner}, owner of {brand}. For anything about your data, write to [{email}](mail). Full details are in the [legal notice](page:legal).',
        ],
      },
      {
        h: 'Your Strava archive',
        body: [
          'When you choose your archive, **it is read and processed in your own browser**. It isn’t uploaded to any server: we don’t receive it, we don’t store it and we can’t see it. The same goes for your name, your routes and your photos.',
          'Everything stays in the tab’s memory and disappears when you close or reload it. Images and videos are created on your device, and only leave it if you share them.',
        ],
      },
      {
        h: 'Technical data from your visit',
        body: [
          'As on any website, to send you the pages our hosting provider, **Cloudflare**, processes your IP address and technical connection data (browser, date and time, page requested). It uses them to serve the site and protect it from attacks. The legal basis is our legitimate interest in offering the site securely (art. 6.1.f GDPR).',
          'Cloudflare acts as a data processor. It may process data outside the European Economic Area under the safeguards of the EU-US Data Privacy Framework and standard contractual clauses.',
        ],
      },
      {
        h: 'Visit statistics',
        body: [
          'We measure visits with **Cloudflare Web Analytics**: page views, approximate country and device type, always in aggregate. It uses no cookies, stores nothing on your device and neither identifies you nor follows you across other sites.',
        ],
      },
      {
        id: 'cookies',
        h: 'Cookies and storage in your browser',
        body: [
          '{brand} sets no cookies of its own. It only stores in your browser **the language you choose** (the “myrunyear.lang” key in local storage), to remember it on your next visit. It’s a setting you ask for yourself, so it needs no consent, and you can delete it from your browser settings.',
          { when: 'noads', text: 'Right now the site **shows no advertising and uses no third-party cookies**. If that changes, we’ll ask for your permission first and update this page.' },
          { when: 'ads', text: '**Google AdSense** advertising does use cookies and identifiers, from Google and its partners, to show and measure ads and, if you accept, personalise them. Before using them we ask for your permission with a notice where you can **accept, reject or customise** just as easily.' },
          { when: 'ads', text: 'You can change your choice whenever you like under “Privacy preferences”, at the bottom of any page. If you reject them, the site works the same and ads aren’t personalised.' },
          { when: 'ads', text: '- **Who uses them:** Google Ireland Limited and the advertising partners listed in the notice.\n- **What for:** showing ads, limiting how often you see the same one, measuring results, preventing fraud and, with your permission, personalising them.\n- **How long they last:** from the session up to 13 months, depending on the cookie.\n- **More information:** [how Google uses data from sites that show its ads](https://policies.google.com/technologies/partner-sites).' },
        ],
      },
      {
        when: 'ads',
        h: 'Advertising',
        body: [
          'The legal basis for personalised advertising and its cookies is your consent (art. 6.1.a GDPR), which you can withdraw at any time. Google processes that data as an independent controller: see its [privacy policy](https://policies.google.com/privacy).',
        ],
      },
      {
        h: 'If you write to us',
        body: ['We’ll use your address and your message only to reply, and delete them when they’re no longer needed.'],
      },
      {
        h: 'Your rights',
        body: [
          'You can ask to access, correct or delete your data, object to its processing or ask for it to be restricted, by writing to [{email}](mail). Bear in mind that we don’t hold your Strava data: it never reaches us.',
          'If you feel we haven’t handled your request properly, you can lodge a complaint with the Spanish Data Protection Agency ([aepd.es](https://www.aepd.es)).',
        ],
      },
      {
        h: 'Children',
        body: ['The site is not aimed at children under 14.'],
      },
      {
        h: 'Changes to this policy',
        body: ['If this policy changes, we’ll publish the new version here with its date.'],
      },
    ],
  },
};

export default pages;
