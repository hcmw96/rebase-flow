import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SeoHead from "@/components/seo/SeoHead";
import { breadcrumbSchema, seoTitle, truncateDescription } from "@/lib/seo";

const Terms = () => {
  return (
    <div style={{ position: "fixed", inset: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }} className="bg-[#1A1A1A] text-[#F9ECD9]">
      <SeoHead
        title={seoTitle("Terms and Conditions")}
        description={truncateDescription(
          "Terms and conditions for using the Rebase Recovery website and booking wellness services in London, operated by Rebase Recovery Limited.",
        )}
        path="/terms"
        jsonLd={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Terms", path: "/terms" },
        ])}
      />
      <Navigation />
      <main id="main-content" className="max-w-3xl mx-auto px-5 sm:px-8 pt-32 pb-20">
        <h1 className="text-3xl sm:text-4xl font-light tracking-wide mb-4">Terms and Conditions</h1>
        <p className="text-[#F9ECD9]/50 text-sm mb-12">Please read these terms and conditions carefully before using this website. Last updated: July 2026</p>

        <div className="space-y-10 text-[#F9ECD9]/80 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">1. The content of these terms</h2>
            <p className="mb-3">These terms tell you the rules for using our website www.rebaserecovery.com (our website).</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Who we are and how to contact us (go to 2).</li>
              <li>By using our website you accept these terms (go to 3).</li>
              <li>There are other terms that may apply to you (go to 4).</li>
              <li>We may make changes to these terms (go to 5).</li>
              <li>We may make changes to our website (go to 6).</li>
              <li>We may suspend or withdraw our website (go to 7).</li>
              <li>We may transfer this agreement to someone else (go to 8).</li>
              <li>Our site is only for users in the UK (go to 9).</li>
              <li>How you may use material on our site (go to 10).</li>
              <li>No text or data mining, or web scraping (go to 11).</li>
              <li>Do not rely on information on our site (go to 12).</li>
              <li>We are not responsible for websites we link to (go to 13).</li>
              <li>How to complain about or report content (go to 14).</li>
              <li>Our responsibility for loss or damage suffered by you (go to 15).</li>
              <li>How we may use your personal information (go to 16).</li>
              <li>We are not responsible for viruses, and you must not introduce them (go to 17).</li>
              <li>Rules about linking to our website (go to 18).</li>
              <li>Which country's laws apply to any disputes? (go to 19).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">2. Who we are and how to contact us</h2>
            <p className="mb-3"><strong>2.1</strong> We are Rebase Recovery Limited.</p>
            <p className="mb-3"><strong>2.2</strong> We are a company registered in England and Wales with company number 14361244.</p>
            <p className="mb-3"><strong>2.3</strong> Our registered office is at St. Vincent Street, London, England, W1U 4DB, which is also our main trading address.</p>
            <p className="mb-3"><strong>2.4</strong> Our VAT number is 444790375.</p>
            <p><strong>2.5</strong> To contact us, please email <a href="mailto:reception@rebaserecovery.com" className="text-[#F9ECD9] underline underline-offset-4 hover:text-white transition-colors">reception@rebaserecovery.com</a> or telephone our customer service line <a href="tel:+442045535701" className="text-[#F9ECD9] underline underline-offset-4 hover:text-white transition-colors">020 4553 5701</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">3. By using our website, you accept these terms</h2>
            <p className="mb-3"><strong>3.1</strong> By using our website, you confirm that you accept these terms of use and that you agree to comply with them.</p>
            <p className="mb-3"><strong>3.2</strong> If you do not agree to these terms, you must not use our website.</p>
            <p className="mb-3"><strong>3.3</strong> You are also responsible for ensuring that all persons who access our website through your internet connection are aware of these terms of use and other applicable terms and conditions, and that they comply with them.</p>
            <p><strong>3.4</strong> We recommend that you print a copy of these terms for future reference.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">4. There are other terms that may apply to you</h2>
            <p className="mb-3">These terms of use refer to the following additional terms, which also apply to your use of our website:</p>
            <p className="mb-3"><strong>4.1</strong> Our <a href="/privacy-policy" className="text-[#F9ECD9] underline underline-offset-4 hover:text-white transition-colors">Privacy Policy</a> (found on our website).</p>
            <p><strong>4.2</strong> Our <a href="/cookie-policy" className="text-[#F9ECD9] underline underline-offset-4 hover:text-white transition-colors">Cookie Policy</a> (found on our website), which sets out information about the cookies on our site.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">5. We may make changes to these terms</h2>
            <p>We amend these terms from time to time. Every time you wish to use our website, please check these terms to ensure you understand the terms that apply at that time.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">6. We may make changes to our website</h2>
            <p>We may update and change our website from time to time to reflect changes to our products and services.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">7. We may suspend or withdraw our website</h2>
            <p className="mb-3"><strong>7.1</strong> Our website is made available free of charge.</p>
            <p><strong>7.2</strong> We do not guarantee that our website, or any content on it, will always be available or be uninterrupted. We may suspend or withdraw or restrict the availability of all or any part of our website for business and operational reasons.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">8. We may transfer this agreement to someone else</h2>
            <p>We may transfer our rights and obligations under these terms to another organisation.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">9. Our website is only for users in the UK</h2>
            <p>Our website is directed to people residing in or visiting the United Kingdom. We do not represent that content available on or through our website is appropriate for use or available in other locations.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">10. How you may use material on our site</h2>
            <p className="mb-3"><strong>10.1</strong> We are the owner or the licensee of all intellectual property rights in our website, and in the material published on it. Those works are protected by copyright laws and treaties around the world. All such rights are reserved.</p>
            <p className="mb-3"><strong>10.2</strong> You may print off one copy, and may download extracts, of any page(s) from our website for your personal use and you may draw the attention of others within your organisation to content posted on our website.</p>
            <p className="mb-3"><strong>10.3</strong> You must not modify the paper or digital copies of any materials you have printed off or downloaded in any way, and you must not use any illustrations, photographs, video or audio sequences or any graphics separately from any accompanying text.</p>
            <p className="mb-3"><strong>10.4</strong> Our status as the authors of content on our website must always be acknowledged.</p>
            <p className="mb-3"><strong>10.5</strong> You must not use any part of the content on our site for commercial purposes without obtaining a licence to do so from us or our licensors.</p>
            <p><strong>10.6</strong> If you print off, copy, download, share or repost any part of our website in breach of these terms of use, your right to use our website will cease immediately and you must, at our option, return or destroy any copies of the materials you have made.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">11. No text or data mining, or web scraping</h2>
            <p className="mb-3"><strong>11.1</strong> You shall not conduct, facilitate, authorise, or permit any text or data mining or web scraping in relation to our website or any services provided via, or in relation to, our website. This includes using (or permitting, authorising, or attempting the use of):</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>any "robot", "bot", "spider", "scraper" or other automated device, program, tool, algorithm, code, process, or methodology to access, obtain, copy, monitor or republish any portion of the site or any data, content, information or services accessed via the same;</li>
              <li>any automated analytical technique aimed at analysing text and data in digital form to generate information which includes but is not limited to patterns, trends and correlations.</li>
            </ul>
            <p className="mb-3"><strong>11.2</strong> The provisions in this clause should be treated as an express reservation of our rights in this regard, including for the purposes of Article 4(3) of Digital Copyright Directive ((EU) 2019/790).</p>
            <p><strong>11.3</strong> This clause shall not apply insofar as (but only to the extent that) we are unable to exclude or limit text or data mining or web scraping activity by contract under the laws which are applicable to us.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">12. Do not rely on information on this website</h2>
            <p className="mb-3"><strong>12.1</strong> The content on our website is provided for general information only. It is not intended to amount to advice on which you should rely. You must obtain professional or specialist advice before taking, or refraining from, any action based on the content on our website.</p>
            <p><strong>12.2</strong> Although we make reasonable efforts to update the information on our website, we make no representations, warranties or guarantees, whether express or implied, that the content on our website is accurate, complete, or up to date.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">13. We are not responsible for websites we link to</h2>
            <p className="mb-3"><strong>13.1</strong> Where our website contains links to other websites and resources provided by third parties, these links are provided for your information only. Such links should not be interpreted as approval by us of those linked websites or information you may obtain from them.</p>
            <p><strong>13.2</strong> We have no control over the contents of those websites or resources.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">14. How to complain about or report content</h2>
            <p>If you wish to complain about any content on our website, please contact us at <a href="mailto:reception@rebaserecovery.com" className="text-[#F9ECD9] underline underline-offset-4 hover:text-white transition-colors">reception@rebaserecovery.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">15. Our responsibility for loss or damage suffered by you</h2>
            <p className="mb-3"><strong>15.1</strong> We do not exclude or limit in any way our liability to you where it would be unlawful to do so. This includes liability for death or personal injury caused by our negligence or the negligence of our employees, agents or subcontractors and for fraud or fraudulent misrepresentation.</p>
            <p className="mb-3"><strong>15.2</strong> Different limitations and exclusions of liability will apply to liability arising as a result of the supply of any products or services to you, which will be set out in our membership terms or in the disclaimer you are required to sign before entering our premises.</p>
            <p className="mb-3"><strong>15.3</strong> We will not be liable to you for any loss or damage, whether in contract, tort (including negligence), breach of statutory duty, or otherwise, even if foreseeable, arising under or in connection with:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>use of, or inability to use, our website; or</li>
              <li>use of or reliance on any content displayed on our website.</li>
            </ul>
            <p><strong>15.4</strong> Please note that we only provide our website for domestic and private use. You agree not to use our site for any commercial or business purposes, and we have no liability to you for any loss of profit, loss of business, business interruption, or loss of business opportunity.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">16. How we may use your personal information</h2>
            <p>We will only use your personal information as set out in our <a href="/privacy-policy" className="text-[#F9ECD9] underline underline-offset-4 hover:text-white transition-colors">Privacy Policy</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">17. We are not responsible for viruses, and you must not introduce them</h2>
            <p className="mb-3"><strong>17.1</strong> We do not guarantee that our website will be secure or free from bugs or viruses.</p>
            <p className="mb-3"><strong>17.2</strong> You are responsible for configuring your information technology, computer programmes and platform to access our website. You should use your own virus protection software.</p>
            <p><strong>17.3</strong> You must not misuse our website by knowingly introducing viruses, trojans, worms, logic bombs or other material that is malicious or technologically harmful. You must not attempt to gain unauthorised access to our website, the server on which our website is stored, or any server, computer or database connected to our website. You must not attack our website via a denial-of-service attack or a distributed denial-of-service attack. By breaching this provision, you would commit a criminal offence under the Computer Misuse Act 1990. We will report any such breach to the relevant law enforcement authorities, and we will co-operate with those authorities by disclosing your identity to them. In the event of such a breach, your right to use our website will cease immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">18. Rules about linking to our website</h2>
            <p className="mb-3"><strong>18.1</strong> You may link to our home page, provided you do so in a way that is fair and legal and does not damage our reputation or take advantage of it.</p>
            <p className="mb-3"><strong>18.2</strong> You must not establish a link in such a way as to suggest any form of association, approval or endorsement on our part where none exists.</p>
            <p className="mb-3"><strong>18.3</strong> You must not establish a link to our website in any website that is not owned by you.</p>
            <p className="mb-3"><strong>18.4</strong> Our website must not be framed on any other website, nor may you create a link to any part of our website other than the home page.</p>
            <p className="mb-3"><strong>18.5</strong> We reserve the right to withdraw linking permission without notice.</p>
            <p><strong>18.6</strong> If you wish to link to or make any use of content on our site other than that set out above, please contact <a href="mailto:reception@rebaserecovery.com" className="text-[#F9ECD9] underline underline-offset-4 hover:text-white transition-colors">reception@rebaserecovery.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">19. Which country's laws apply to any disputes?</h2>
            <p className="mb-3"><strong>19.1</strong> These terms of use, their subject matter and their formation, are governed by English law.</p>
            <p><strong>19.2</strong> You and we both agree that the courts of England and Wales will have exclusive jurisdiction.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
