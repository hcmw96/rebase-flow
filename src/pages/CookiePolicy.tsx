import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SeoHead from "@/components/seo/SeoHead";
import { breadcrumbSchema, seoTitle, truncateDescription } from "@/lib/seo";

const linkClass = "text-[#F9ECD9] underline underline-offset-4 hover:text-white transition-colors";

function CookieTable({
  rows,
}: {
  rows: { name: string; provider: string; purpose: string; duration: string }[];
}) {
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm border border-[#F9ECD9]/15">
        <thead className="bg-[#F9ECD9]/5">
          <tr>
            <th className="text-left p-3 border-b border-[#F9ECD9]/15 font-medium text-[#F9ECD9]">Cookie name</th>
            <th className="text-left p-3 border-b border-[#F9ECD9]/15 font-medium text-[#F9ECD9]">Provider</th>
            <th className="text-left p-3 border-b border-[#F9ECD9]/15 font-medium text-[#F9ECD9]">Purpose</th>
            <th className="text-left p-3 border-b border-[#F9ECD9]/15 font-medium text-[#F9ECD9]">Duration</th>
          </tr>
        </thead>
        <tbody className="align-top">
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-[#F9ECD9]/10">
              <td className="p-3 font-mono text-xs">{row.name}</td>
              <td className="p-3">{row.provider}</td>
              <td className="p-3">{row.purpose}</td>
              <td className="p-3 whitespace-nowrap">{row.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CookiePolicy = () => {
  return (
    <div style={{ position: "fixed", inset: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }} className="dark bg-[#1A1A1A] text-[#F9ECD9]">
      <SeoHead
        title={seoTitle("Cookie Policy")}
        description={truncateDescription(
          "Cookies policy for Rebase Recovery (Rebase Recovery Limited): how we use cookies, what data they store, and how to manage your preferences.",
        )}
        path="/cookie-policy"
        jsonLd={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Cookie Policy", path: "/cookie-policy" },
        ])}
      />
      <Navigation />
      <main id="main-content" className="max-w-3xl mx-auto px-5 sm:px-8 pt-32 pb-20">
        <h1 className="text-3xl sm:text-4xl font-light tracking-wide mb-4">Cookies Policy</h1>
        <p className="text-[#F9ECD9]/50 text-sm mb-12">Last updated: July 2026</p>

        <div className="space-y-10 text-[#F9ECD9]/80 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">1. Introduction</h2>
            <p className="mb-4">
              This cookies policy sets out how Rebase Recovery Limited (trading as Rebase) uses cookies and similar technologies on this website. This policy should be read together with our{" "}
              <a href="/privacy-policy" className={linkClass}>Privacy Policy</a> and our{" "}
              <a href="/terms" className={linkClass}>Website Terms of Use</a>. This is the content of this policy:
            </p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Important information and who we are (paragraph 2)</li>
              <li>What are cookies (paragraph 3)</li>
              <li>Categories of cookies we use (paragraph 4)</li>
              <li>The specific cookies we use (paragraph 5)</li>
              <li>Third-party cookies (paragraph 6)</li>
              <li>How to manage your cookie preferences (paragraph 7)</li>
              <li>Consequences of refusing or disabling cookies (paragraph 8)</li>
              <li>Changes to this cookies policy (paragraph 9)</li>
              <li>Contact details (paragraph 10)</li>
              <li>Complaints (paragraph 11)</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">2. Important information and who we are</h2>
            <p className="mb-3"><strong>2.1</strong> This cookies policy gives you information about how Rebase Recovery Limited (trading as Rebase) uses cookies and similar technologies when you visit our website (the &ldquo;website&rdquo;), and explains how you can manage your preferences.</p>
            <p className="mb-3"><strong>2.2</strong> This website is not intended for children and we do not knowingly collect data relating to children through cookies or otherwise.</p>
            <p className="mb-3"><strong>2.3</strong> Rebase Recovery Limited (trading as Rebase) is the controller for personal data collected through cookies on this website and is referred to as &ldquo;we&rdquo;, &ldquo;our&rdquo; and &ldquo;us&rdquo; in the rest of this policy.</p>
            <p><strong>2.4</strong> This cookies policy should be read in conjunction with our <a href="/privacy-policy" className={linkClass}>Privacy Policy</a>, which explains in more detail how we collect, use, store and protect your personal data and your rights in relation to that data.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">3. What are cookies</h2>
            <p className="mb-3"><strong>3.1</strong> Cookies are small text files that are placed on your computer, mobile phone or other device by websites that you visit. They are widely used to make websites work, or to work more efficiently, as well as to provide information to the owners of the website.</p>
            <p className="mb-3"><strong>3.2</strong> In this policy, we use the term &ldquo;cookies&rdquo; to refer to cookies and similar technologies such as web beacons, pixels, tags, software development kits (SDKs) and local storage.</p>
            <p className="mb-3"><strong>3.3</strong> Cookies may be either:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li><strong>First-party cookies:</strong> cookies that are set by us when you visit our website.</li>
              <li><strong>Third-party cookies:</strong> cookies that are set by a third party (for example, an analytics provider or advertising network) when you visit our website.</li>
            </ul>
            <p className="mb-3"><strong>3.4</strong> Cookies may also be either:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Session cookies:</strong> cookies which expire when you close your browser.</li>
              <li><strong>Persistent cookies:</strong> cookies which remain on your device for a set period or until you delete them manually.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">4. Categories of cookies we use</h2>
            <p className="mb-4">We use cookies in the following categories. Cookies in the strictly necessary category are required for the website to operate and do not require your consent. All other cookies are only placed where you have given your consent through our cookie banner.</p>
            <p className="mb-3"><strong>4.1 Strictly necessary cookies.</strong> These cookies are essential for the operation of our website. They include, for example, cookies that enable you to log into secure areas of our website, complete a booking or process a payment. Without these cookies the services you have asked for cannot be provided.</p>
            <p className="mb-3"><strong>4.2 Functional cookies.</strong> These cookies allow our website to remember choices you make (such as your preferred location, language or display preferences) and to provide enhanced, more personalised features.</p>
            <p className="mb-3"><strong>4.3 Performance and analytics cookies.</strong> These cookies collect information about how visitors use our website, such as which pages are visited most often and whether visitors receive error messages. They help us improve how our website works and understand how our services are being used. The information collected is aggregated and is not used to identify individual visitors.</p>
            <p><strong>4.4 Marketing and advertising cookies.</strong> These cookies are used to deliver advertising that is more relevant to you and your interests, to limit the number of times you see an advertisement and to measure the effectiveness of advertising campaigns. They are usually placed by advertising networks with our permission. They remember that you have visited our website and this information may be shared with other organisations, such as advertisers.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">5. The specific cookies we use</h2>
            <p className="mb-6">
              The tables below set out the cookies we use on our website, grouped by category, together with their provider, purpose and duration. The exact cookies present on your device may vary depending on the pages you visit and the preferences you have set. We periodically review and update the cookies in use, and the most current list is always available through the cookie preference centre accessible at the bottom of every page on our website.
            </p>

            <h3 className="text-lg font-medium text-[#F9ECD9] mb-3">Strictly necessary</h3>
            <CookieTable
              rows={[
                {
                  name: "PHPSESSID / session_id",
                  provider: "Rebase (first-party)",
                  purpose: "Maintains your session while you navigate the website (e.g. keeps you logged in).",
                  duration: "Session",
                },
                {
                  name: "CookieConsent",
                  provider: "Rebase / consent platform (first-party)",
                  purpose: "Stores your cookie consent preferences so we do not ask you to set them again.",
                  duration: "12 months",
                },
                {
                  name: "__cf_bm",
                  provider: "Cloudflare (third-party)",
                  purpose: "Bot management and security; helps protect the site from malicious traffic.",
                  duration: "30 minutes",
                },
                {
                  name: "__stripe_mid, __stripe_sid",
                  provider: "Stripe (third-party)",
                  purpose: "Fraud prevention on payments processed through Stripe.",
                  duration: "1 year / 30 minutes",
                },
              ]}
            />

            <h3 className="text-lg font-medium text-[#F9ECD9] mb-3">Functional</h3>
            <CookieTable
              rows={[
                {
                  name: "rebase_location",
                  provider: "Rebase (first-party)",
                  purpose: "Remembers your preferred Rebase location and personalises content accordingly.",
                  duration: "12 months",
                },
                {
                  name: "rebase_pref",
                  provider: "Rebase (first-party)",
                  purpose: "Stores display preferences (e.g. currency, units).",
                  duration: "12 months",
                },
                {
                  name: "Mindbody session cookies",
                  provider: "Mindbody (third-party)",
                  purpose: "Enables class booking, membership management and account features delivered via Mindbody.",
                  duration: "Session / up to 12 months",
                },
              ]}
            />

            <h3 className="text-lg font-medium text-[#F9ECD9] mb-3">Performance and analytics</h3>
            <CookieTable
              rows={[
                {
                  name: "_ga",
                  provider: "Google Analytics (third-party)",
                  purpose: "Distinguishes unique users so we can understand how visitors use the website.",
                  duration: "2 years",
                },
                {
                  name: "_ga_<container-id>",
                  provider: "Google Analytics (third-party)",
                  purpose: "Persists session state for Google Analytics 4.",
                  duration: "2 years",
                },
                {
                  name: "_gid",
                  provider: "Google Analytics (third-party)",
                  purpose: "Distinguishes users for short-term analytics reporting.",
                  duration: "24 hours",
                },
                {
                  name: "_clck, _clsk, CLID",
                  provider: "Microsoft Clarity (third-party)",
                  purpose: "Behavioural analytics: heatmaps, scroll tracking and session replay to help us improve the website experience.",
                  duration: "Up to 1 year",
                },
              ]}
            />

            <h3 className="text-lg font-medium text-[#F9ECD9] mb-3">Marketing and advertising</h3>
            <CookieTable
              rows={[
                {
                  name: "_fbp",
                  provider: "Meta / Facebook Pixel (third-party)",
                  purpose: "Identifies browsers for advertising and conversion measurement on Facebook and Instagram.",
                  duration: "3 months",
                },
                {
                  name: "fr",
                  provider: "Meta (third-party)",
                  purpose: "Delivers, measures and improves the relevance of advertising on Meta platforms.",
                  duration: "3 months",
                },
                {
                  name: "_gcl_au",
                  provider: "Google Ads (third-party)",
                  purpose: "Conversion tracking for Google Ads campaigns.",
                  duration: "3 months",
                },
                {
                  name: "IDE, test_cookie",
                  provider: "Google DoubleClick (third-party)",
                  purpose: "Ad targeting, measurement and frequency capping.",
                  duration: "Up to 13 months",
                },
              ]}
            />
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">6. Third-party cookies</h2>
            <p className="mb-3"><strong>6.1</strong> Some cookies on our website are set by third parties on our behalf. We do not control the setting of these cookies and we recommend that you check the privacy policies of the relevant third parties for information about their cookies and how to manage them. The main third parties that may set cookies through our website are:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Google LLC (Google Analytics, Google Ads, YouTube) — <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className={linkClass}>https://policies.google.com/privacy</a></li>
              <li>Meta Platforms, Inc. (Meta Pixel) — <a href="https://www.facebook.com/policy.php" target="_blank" rel="noreferrer" className={linkClass}>https://www.facebook.com/policy.php</a></li>
              <li>Stripe, Inc. — <a href="https://stripe.com/privacy" target="_blank" rel="noreferrer" className={linkClass}>https://stripe.com/privacy</a></li>
              <li>Mindbody, Inc. — <a href="https://www.mindbodyonline.com/legal/privacy-policy" target="_blank" rel="noreferrer" className={linkClass}>https://www.mindbodyonline.com/legal/privacy-policy</a></li>
              <li>Microsoft Corporation (Microsoft Clarity) — <a href="https://privacy.microsoft.com/en-gb/privacystatement" target="_blank" rel="noreferrer" className={linkClass}>https://privacy.microsoft.com/en-gb/privacystatement</a></li>
              <li>Cloudflare, Inc. — <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer" className={linkClass}>https://www.cloudflare.com/privacypolicy/</a></li>
            </ul>
            <p><strong>6.2</strong> We may also use embedded content from social media platforms (for example Instagram, LinkedIn, TikTok or YouTube). These platforms may set their own cookies on your device when their content loads on screen. We do not control those cookies and you should refer to the relevant platform&apos;s own cookies and privacy policies for further information.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">7. How to manage your cookie preferences</h2>
            <p className="mb-3"><strong>7.1 Through our cookie preference centre.</strong> When you first visit our website you will be presented with a cookie banner allowing you to accept all cookies, reject all non-essential cookies or set your preferences by category. You can change your preferences at any time by clicking the &ldquo;Cookie Preferences&rdquo; link in the footer of our website.</p>
            <p className="mb-3"><strong>7.2 Through your browser.</strong> Most web browsers allow you to control cookies through their settings. You can usually find these settings in the &ldquo;Options&rdquo; or &ldquo;Preferences&rdquo; menu of your browser, and you can also delete cookies that have already been stored. Guidance for the main browsers is available here:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Google Chrome — <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer" className={linkClass}>https://support.google.com/chrome/answer/95647</a></li>
              <li>Microsoft Edge — <a href="https://support.microsoft.com/help/4027947" target="_blank" rel="noreferrer" className={linkClass}>https://support.microsoft.com/help/4027947</a></li>
              <li>Apple Safari — <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471" target="_blank" rel="noreferrer" className={linkClass}>https://support.apple.com/guide/safari/manage-cookies-sfri11471</a></li>
              <li>Mozilla Firefox — <a href="https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noreferrer" className={linkClass}>https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer</a></li>
            </ul>
            <p className="mb-3"><strong>7.3 Mobile devices.</strong> To manage cookies and similar tracking technologies on mobile devices, please refer to your device&apos;s settings menu.</p>
            <p className="mb-3"><strong>7.4 Opting out of advertising cookies.</strong> You can also opt out of interest-based advertising from many advertisers through the following industry tools:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your Online Choices (EU/UK) — <a href="https://www.youronlinechoices.com" target="_blank" rel="noreferrer" className={linkClass}>https://www.youronlinechoices.com</a></li>
              <li>Network Advertising Initiative — <a href="https://www.networkadvertising.org/choices" target="_blank" rel="noreferrer" className={linkClass}>https://www.networkadvertising.org/choices</a></li>
              <li>Digital Advertising Alliance — <a href="https://www.aboutads.info/choices" target="_blank" rel="noreferrer" className={linkClass}>https://www.aboutads.info/choices</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">8. Consequences of refusing or disabling cookies</h2>
            <p className="mb-3"><strong>8.1</strong> If you choose to reject or disable cookies, some features of our website may not function correctly. In particular, you may not be able to log in, complete a booking, make a payment or use certain interactive features. Your preferences may also not be remembered between visits.</p>
            <p><strong>8.2</strong> Strictly necessary cookies cannot be switched off as they are required for the website to function.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">9. Changes to this cookies policy</h2>
            <p className="mb-3"><strong>9.1</strong> We keep this cookies policy under regular review and may update it from time to time to reflect changes in the cookies we use, in technology, in applicable law or in our business practices.</p>
            <p><strong>9.2</strong> The date at the top of this policy indicates when it was last updated. Where changes are material we will notify you through the website or, where appropriate, by email.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">10. Contact details</h2>
            <p className="mb-3">If you have any questions about this cookies policy or about how we use cookies, please contact us in the following ways:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email address: <a href="mailto:reception@rebaserecovery.com" className={linkClass}>reception@rebaserecovery.com</a></li>
              <li>Postal address: 1A St. Vincent Street, London, England, W1U 4DB</li>
              <li>Telephone number: <a href="tel:+442045535701" className={linkClass}>020 4553 5701</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">11. Complaints</h2>
            <p>
              You have the right to make a complaint at any time to the Information Commissioner&apos;s Office (ICO), the UK regulator for data protection and electronic communications issues (
              <a href="https://www.ico.org.uk" target="_blank" rel="noreferrer" className={linkClass}>www.ico.org.uk</a>
              ). We would, however, appreciate the chance to deal with your concerns before you approach the ICO, so please contact us in the first instance.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;
