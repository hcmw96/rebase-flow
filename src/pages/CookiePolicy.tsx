import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const SITE_URL = "https://rebase-flow.lovable.app";

const CookiePolicy = () => {
  return (
    <div style={{ position: "fixed", inset: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }} className="bg-[#1A1A1A] text-[#F9ECD9]">
      <Helmet>
        <title>Cookie Policy — Rebase Recovery</title>
        <meta name="description" content="Learn how Rebase Recovery uses cookies to improve your experience on our website. Manage your cookie preferences." />
        <link rel="canonical" href={`${SITE_URL}/cookie-policy`} />
      </Helmet>
      <Navigation />
      <main className="max-w-3xl mx-auto px-5 sm:px-8 pt-32 pb-20">
        <h1 className="text-3xl sm:text-4xl font-light tracking-wide mb-4">Cookie Policy</h1>
        <p className="text-[#F9ECD9]/50 text-sm mb-12">Last updated: March 2026</p>

        <div className="space-y-10 text-[#F9ECD9]/80 text-[15px] leading-relaxed">
          <section>
            <p>
              Our website uses cookies to distinguish you from other users of our website. This helps us to provide you with a good experience when you browse our website and also allows us to improve our site. By continuing to browse the site, you are agreeing to our use of cookies.
            </p>
          </section>

          <section>
            <p>
              A cookie is a small file of letters and numbers that we store on your browser or the hard drive of your computer if you agree. Cookies contain information that is transferred to your computer's hard drive.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">Types of Cookies We Use</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-[#F9ECD9] mb-2">Strictly Necessary Cookies</h3>
                <p>
                  These are cookies that are required for the operation of our website. They include, for example, cookies that enable you to log into secure areas of our website, use a shopping cart or make use of e-billing services.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-[#F9ECD9] mb-2">Analytical / Performance Cookies</h3>
                <p>
                  They allow us to recognise and count the number of visitors and to see how visitors move around our website when they are using it. This helps us to improve the way our website works, for example, by ensuring that users are finding what they are looking for easily.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-[#F9ECD9] mb-2">Functionality Cookies</h3>
                <p>
                  These are used to recognise you when you return to our website. This enables us to personalise our content for you, greet you by name and remember your preferences (for example, your choice of language or region).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-[#F9ECD9] mb-2">Targeting Cookies</h3>
                <p>
                  These cookies record your visit to our website, the pages you have visited and the links you have followed. We will use this information to make our website and the advertising displayed on it more relevant to your interests. We may also share this information with third parties for this purpose.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">Third-Party Cookies</h2>
            <p>
              Please note that third parties (including, for example, advertising networks and providers of external services like web traffic analysis services) may also use cookies, over which we have no control. These cookies are likely to be analytical/performance cookies or targeting cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">How to Manage Cookies</h2>
            <p>
              You can block cookies by activating the setting on your browser that allows you to refuse the setting of all or some cookies. However, if you use your browser settings to block all cookies (including essential cookies) you may not be able to access all or parts of our site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">Contact Us</h2>
            <p>
              If you have any questions about our use of cookies, please contact us at{" "}
              <a
                href="mailto:reception@rebaserecovery.com"
                className="text-[#F9ECD9] underline underline-offset-4 hover:text-white transition-colors"
              >
                reception@rebaserecovery.com
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;
