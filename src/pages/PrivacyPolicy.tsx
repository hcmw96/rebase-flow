import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SeoHead from "@/components/seo/SeoHead";
import { breadcrumbSchema, seoTitle, truncateDescription } from "@/lib/seo";

const PrivacyPolicy = () => {
  return (
    <div style={{ position: "fixed", inset: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }} className="bg-[#1A1A1A] text-[#F9ECD9]">
      <SeoHead
        title={seoTitle("Privacy Policy")}
        description={truncateDescription(
          "Privacy policy for Rebase Recovery (Rebase Recovery Limited): how we collect, use and protect your personal data at our London wellness studio.",
        )}
        path="/privacy-policy"
        jsonLd={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy-policy" },
        ])}
      />
      <Navigation />
      <main id="main-content" className="max-w-3xl mx-auto px-5 sm:px-8 pt-32 pb-20">
        <h1 className="text-3xl sm:text-4xl font-light tracking-wide mb-4">Privacy Policy</h1>
        <p className="text-[#F9ECD9]/50 text-sm mb-12">Last updated: July 2026</p>

        <div className="space-y-10 text-[#F9ECD9]/80 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">1. Introduction</h2>
            <p className="mb-4">
              This privacy policy sets out how Rebase Recovery Limited (trading as Rebase) uses and protects your personal data. This is the content of this policy.
            </p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Important information and who we are (paragraph 2)</li>
              <li>The types of personal data we collect about you (paragraph 3)</li>
              <li>How your personal data is collected (paragraph 4)</li>
              <li>How we use your personal data (paragraph 5)</li>
              <li>Disclosures of your personal data (paragraph 6)</li>
              <li>International transfers (paragraph 7)</li>
              <li>Data Security (paragraph 8)</li>
              <li>Data retention (paragraph 9)</li>
              <li>Your legal rights (paragraph 10)</li>
              <li>Contact details (paragraph 11)</li>
              <li>Complaints (paragraph 12)</li>
              <li>Changes to the privacy policy and your duty to inform us of changes (paragraph 13)</li>
              <li>Third party links (paragraph 14)</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">2. Important information and who we are</h2>
            <p className="mb-3"><strong>2.1</strong> This privacy policy gives you information about how Rebase Recovery Limited (trading as Rebase) collects and uses your personal data through your use of this website, including any data you may provide when you apply for membership, to register with us to enter our facilities, or to purchase a product or service.</p>
            <p className="mb-3"><strong>2.2</strong> This website is not intended for children and we do not knowingly collect data relating to children.</p>
            <p><strong>2.3</strong> Rebase Recovery Limited (trading as Rebase) is the controller and is responsible for your personal data and we refer to ourselves as "we", "our" and "us" in the rest of this policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">3. The types of personal data we collect about you</h2>
            <p className="mb-3"><strong>3.1</strong> Personal data means any information about an individual from which that person can be identified.</p>
            <p className="mb-3"><strong>3.2</strong> We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Identity Data</strong> includes first name, last name, title, date of birth and gender.</li>
              <li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
              <li><strong>Financial Data</strong> includes bank account and payment card details.</li>
              <li><strong>Transaction Data</strong> includes details about payments to and from you and other details of products and services you have purchased from us.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, device ID and other technology on the devices you use to access this website.</li>
              <li><strong>Profile Data</strong> includes your username and password, purchases or orders made by you, your interests, preferences, feedback and survey responses.</li>
              <li><strong>Usage Data</strong> includes information about how you interact with and use our website, products and services.</li>
              <li><strong>Marketing and Communications Data</strong> includes your preferences in receiving marketing from us and our third parties and your communication preferences.</li>
              <li><strong>Employment and Monitoring Data</strong> includes attendance records, access and entry records, CCTV footage, disciplinary and grievance records, performance management records, communications relating to employment, and information relating to the use of company systems, facilities, devices, or premises.</li>
            </ul>
            <p><strong>3.3</strong> We also collect, use and share aggregated data such as statistical or demographic data which is not personal data as it does not directly (or indirectly) reveal your identity. For example, we may aggregate individuals' Usage Data to calculate the percentage of users accessing a specific website feature in order to analyse general trends in how users are interacting with our website to help improve the website and our service offering.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">4. How your personal data is collected</h2>
            <p className="mb-3">We use different methods to collect data from and about you including through:</p>
            <p className="mb-3"><strong>4.1</strong> Your interactions with us. You may give us your personal data by filling in forms or by corresponding with us by post, phone, email or otherwise. This includes personal data you provide when you:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>apply for membership</li>
              <li>apply for our products or services;</li>
              <li>create an account in our premises or on our website;</li>
              <li>subscribe to our service or publications;</li>
              <li>request marketing to be sent to you;</li>
              <li>enter a competition, promotion or survey; or</li>
              <li>give us feedback or contact us.</li>
            </ul>
            <p className="mb-3"><strong>4.2</strong> Automated technologies or interactions. As you interact with our website, we will automatically collect technical data about your equipment, browsing actions and patterns. We collect this personal data by using cookies and other similar technologies.</p>
            <p className="mb-3"><strong>4.3</strong> CCTV and monitoring systems. We operate CCTV systems and other security and operational monitoring measures within and around our premises for purposes including health and safety, security, incident investigation, prevention and detection of misconduct, operational management, attendance verification, and disciplinary or legal processes where appropriate.</p>
            <p className="mb-3"><strong>4.4</strong> Technical Data is collected from the following parties:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>analytics providers such as Google based outside the UK;</li>
              <li>advertising networks; and</li>
              <li>search information providers.</li>
            </ul>
            <p><strong>4.5</strong> Contact, Financial and Transaction Data is collected from providers of technical, payment and delivery services.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">5. How we use your personal data</h2>

            <h3 className="text-lg font-medium text-[#F9ECD9] mb-3">5.1 Legal basis</h3>
            <p className="mb-3">The law requires us to have a legal basis for collecting and using your personal data. We rely on one or more of the following legal bases:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li><strong>Performance of a contract with you:</strong> Where we need to perform the contract we are about to enter into or have entered into with you.</li>
              <li><strong>Legitimate interests:</strong> We may use your personal data where it is necessary to conduct our business and pursue our legitimate interests, for example to prevent fraud and enable us to give you the best and most secure customer experience. We make sure we consider and balance any potential impact on you and your rights (both positive and negative) before we process your personal data for our legitimate interests. We do not use your personal data for activities where our interests are overridden by the impact on you (unless we have your consent or are otherwise required or permitted to by law).</li>
              <li><strong>Legal obligation:</strong> We may use your personal data where it is necessary for compliance with a legal obligation that we are subject to. We will identify the relevant legal obligation when we rely on this legal basis.</li>
              <li><strong>Consent:</strong> We rely on consent only where we have obtained your active agreement to use your personal data for a specified purpose, for example if you subscribe to an email newsletter.</li>
            </ul>

            <h3 className="text-lg font-medium text-[#F9ECD9] mb-3">5.2 Purposes for which we will use your personal data</h3>
            <p className="mb-4">We have set out below, in a table format, a description of all the ways we plan to use the various categories of your personal data, and which of the legal bases we rely on to do so. We have also identified what our legitimate interests are where appropriate.</p>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border border-[#F9ECD9]/15">
                <thead className="bg-[#F9ECD9]/5">
                  <tr>
                    <th className="text-left p-3 border-b border-[#F9ECD9]/15 font-medium text-[#F9ECD9]">Purpose/Use</th>
                    <th className="text-left p-3 border-b border-[#F9ECD9]/15 font-medium text-[#F9ECD9]">Type of data</th>
                    <th className="text-left p-3 border-b border-[#F9ECD9]/15 font-medium text-[#F9ECD9]">Legal basis [and retention period]</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  <tr className="border-b border-[#F9ECD9]/10">
                    <td className="p-3">To register you as a new member or client</td>
                    <td className="p-3">(a) Identity<br />(b) Contact</td>
                    <td className="p-3">Performance of a contract with you. We have different categories of membership and we will record the benefits to which you have subscribed.<br /><br />Legitimate interests. We will need to manage and control the visitors to our premises. This includes for health and safety purposes.</td>
                  </tr>
                  <tr className="border-b border-[#F9ECD9]/10">
                    <td className="p-3">To take payments from you including: (a) Manage payments, fees and charges (b) Collect and recover money owed to us</td>
                    <td className="p-3">(a) Identity<br />(b) Contact<br />(c) Financial<br />(d) Transaction<br />(e) Marketing and Communications</td>
                    <td className="p-3">(a) Performance of a contract with you<br />(b) Necessary for our legitimate interests (to recover debts due to us)</td>
                  </tr>
                  <tr className="border-b border-[#F9ECD9]/10">
                    <td className="p-3">To manage our relationship with you which will include: (a) Notifying you about changes to our terms or privacy policy (b) Dealing with your requests, complaints and queries</td>
                    <td className="p-3">(a) Identity<br />(b) Contact<br />(c) Profile<br />(d) Marketing and Communications</td>
                    <td className="p-3">(a) Performance of a contract with you<br />(b) Necessary to comply with a legal obligation, including managing health and safety of the running of our facilities.<br />(c) Necessary for our legitimate interests (to keep our records updated and manage our relationship with you)</td>
                  </tr>
                  <tr className="border-b border-[#F9ECD9]/10">
                    <td className="p-3">To administer and protect our business and this website (including troubleshooting, data analysis, testing, system maintenance, support, reporting and hosting of data)</td>
                    <td className="p-3">(a) Identity<br />(b) Contact<br />(c) Technical</td>
                    <td className="p-3">(a) Necessary for our legitimate interests (for running our business, provision of administration and IT services, network security, to prevent fraud and in the context of a business reorganisation or group restructuring exercise)<br />(b) Necessary to comply with a legal obligation</td>
                  </tr>
                  <tr className="border-b border-[#F9ECD9]/10">
                    <td className="p-3">To use data analytics to improve our website, products/services, customer relationships and experiences and to measure the effectiveness of our communications and marketing</td>
                    <td className="p-3">(a) Technical<br />(b) Usage</td>
                    <td className="p-3">Necessary for our legitimate interests (to define types of customers for our products and services, to keep our website updated and relevant, to develop our business and to inform our marketing strategy)</td>
                  </tr>
                  <tr className="border-b border-[#F9ECD9]/10">
                    <td className="p-3">To send you relevant marketing communications and make personalised suggestions and recommendations to you about goods or services that may be of interest to you based on your Profile Data</td>
                    <td className="p-3">(a) Identity<br />(b) Contact<br />(c) Technical<br />(d) Usage<br />(e) Profile<br />(f) Marketing and Communications</td>
                    <td className="p-3">Contract, to be able to provide you with the best facilities and services that may suit your specific requirements, and which falls within the services that are provided within our facilities by us or by third parties.<br /><br />Necessary for our legitimate interests (to carry out direct marketing, develop our products/services and grow our business).<br /><br />Consent, having obtained your prior consent to receiving direct marketing communications.</td>
                  </tr>
                  <tr className="border-b border-[#F9ECD9]/10">
                    <td className="p-3">To carry out market research through your voluntary participation in surveys</td>
                    <td className="p-3">(a) Identity<br />(b) Contact</td>
                    <td className="p-3">Necessary for our legitimate interests (to study how customers use our products/services and to help us improve and develop our products and services).</td>
                  </tr>
                  <tr>
                    <td className="p-3">To monitor and protect our premises, systems, staff, customers and business operations, including for disciplinary, investigatory, attendance-management, legal and security purposes</td>
                    <td className="p-3">(a) Identity<br />(b) Technical<br />(c) Usage<br />(d) Employment and Monitoring Data</td>
                    <td className="p-3">Necessary for our legitimate interests, including:<br /><br />maintaining the security and integrity of our business and premises;<br />ensuring compliance with company policies and procedures;<br />investigating misconduct or breaches of policy;<br />verifying attendance and timekeeping;<br />and protecting staff and customers.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium text-[#F9ECD9] mb-3">5.3 Direct marketing</h3>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>During your application for membership, or your registration to use our facilities, or by your filling in a contact form on our website, when your personal data is collected, you will be asked to indicate your preferences for receiving direct marketing communications from us. You will receive marketing communications from us if you have requested information from us or purchased goods or services from us and you have not opted out of receiving the marketing.</li>
              <li>We may also analyse your Identity, Contact, Technical, Usage and Profile Data to form a view which products, services and offers may be of interest to you so that we can then send you relevant marketing communications.</li>
            </ul>

            <h3 className="text-lg font-medium text-[#F9ECD9] mb-3">5.4 Third-party marketing</h3>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>We will get your express consent before we share your personal data with any third party for their own direct marketing purposes.</li>
            </ul>

            <h3 className="text-lg font-medium text-[#F9ECD9] mb-3">5.5 Opting out of marketing</h3>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>You can ask to stop sending you marketing communications at any time. Please see paragraph 11 below for our contact details.</li>
              <li>If you opt out of receiving marketing communications, you will still receive service-related communications that are essential for administrative or customer service purposes.</li>
            </ul>

            <h3 className="text-lg font-medium text-[#F9ECD9] mb-3">5.6 Cookies</h3>
            <p>For more information about the cookies we use and how to change your cookie preferences, please see our <a href="/cookie-policy" className="text-[#F9ECD9] underline underline-offset-4 hover:text-white transition-colors">Cookie Policy</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">6. Disclosures of your personal data</h2>
            <p>We may share your personal data where necessary with staff and third party contractors who work in our premises so that we may provide the goods and services of our business. We shall only do this with third parties who are bound to us by duties of confidentiality. We do not envisage having to share your personal data with any other third party. If we do, then we shall update this policy to disclose the identities of those third parties, the personal data disclosed and the reasons for that disclosure. We may also disclose personal data where reasonably necessary for the purposes of internal investigations, disciplinary or grievance procedures, legal proceedings, regulatory obligations, insurance matters, or the establishment, exercise or defence of legal claims.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">7. International Transfers</h2>
            <p>We will not transfer your personal data outside of the UK.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">8. Data security</h2>
            <p className="mb-3"><strong>8.1</strong> We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know. They will only process your personal data on our instructions, and they are subject to a duty of confidentiality.</p>
            <p><strong>8.2</strong> We have put in place procedures to deal with any suspected personal data breach and will notify you and any applicable regulator of a breach where we are legally required to do so.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">9. Data retention</h2>
            <p className="mb-3"><strong>9.1</strong> We will only keep your personal data for as long as reasonably necessary to fulfil the purposes we collected it for, including for the purposes of satisfying any legal, regulatory, tax, accounting or reporting requirements. We may retain your personal data for a longer period if we receive a complaint or if we reasonably believe there is a prospect of litigation in respect to our relationship with you.</p>
            <p className="mb-3"><strong>9.2</strong> To determine the appropriate retention period for personal data, we consider the amount, nature and sensitivity of the personal data, the potential risk of harm from unauthorised use or disclosure of your personal data, the purposes for which we process your personal data and whether we can achieve those purposes through other means, and the applicable legal, regulatory, tax, accounting or other requirements.</p>
            <p className="mb-3"><strong>9.3</strong> By law we have to keep basic information about our customers (including Contact, Identity, Financial and Transaction Data) for six years after they cease being customers for tax purposes.</p>
            <p><strong>9.4</strong> In some circumstances you can ask us to delete your data: see paragraph 10.3 below for further information.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">10. Your legal rights</h2>
            <p className="mb-3">You have a number of rights under data protection laws in relation to your personal data. You have the right to:</p>
            <p className="mb-3"><strong>10.1</strong> Request access to your personal data (commonly known as a "subject access request"). This enables you to receive a copy of the personal data we hold about you and to check that we are lawfully processing it. Where requests are particularly broad, complex, repetitive, or disproportionate, we may request clarification in order to assist us in locating the specific personal data requested and responding appropriately in accordance with applicable law.</p>
            <p className="mb-3"><strong>10.2</strong> Request correction of the personal data that we hold about you. This enables you to have any incomplete or inaccurate data we hold about you corrected, though we may need to verify the accuracy of the new data you provide to us.</p>
            <p className="mb-3"><strong>10.3</strong> Request erasure of your personal data in certain circumstances. This enables you to ask us to delete or remove personal data where there is no good reason for us continuing to process it. You also have the right to ask us to delete or remove your personal data where you have successfully exercised your right to object to processing (see below), where we may have processed your information unlawfully or where we are required to erase your personal data to comply with local law. Note, however, that we may not always be able to comply with your request of erasure for specific legal reasons which will be notified to you, if applicable, at the time of your request.</p>
            <p className="mb-3"><strong>10.4</strong> Object to processing of your personal data where we are relying on a legitimate interest (or those of a third party) as the legal basis for that particular use of your data (including carrying out profiling based on our legitimate interests). In some cases, we may demonstrate that we have compelling legitimate grounds to process your information which override your right to object.</p>
            <p className="mb-3"><strong>10.5</strong> You also have the absolute right to object any time to the processing of your personal data for direct marketing purposes.</p>
            <p className="mb-3"><strong>10.6</strong> Request the transfer of your personal data to you or to a third party. We will provide to you, or a third party you have chosen, your personal data in a structured, commonly used, machine-readable format. Note that this right only applies to automated information which you initially provided consent for us to use or where we used the information to perform a contract with you.</p>
            <p className="mb-3"><strong>10.7</strong> Request restriction of processing of your personal data. This enables you to ask us to suspend the processing of your personal data in one of the following scenarios:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>If you want us to establish the data's accuracy;</li>
              <li>Where our use of the data is unlawful but you do not want us to erase it;</li>
              <li>Where you need us to hold the data even if we no longer require it as you need it to establish, exercise or defend legal claims; or</li>
              <li>You have objected to our use of your data but we need to verify whether we have overriding legitimate grounds to use it.</li>
            </ul>
            <p className="mb-3"><strong>10.8</strong> If you wish to exercise any of the rights set out above, please go to paragraph 11 below for our contact details.</p>
            <p className="mb-3"><strong>10.9</strong> You will not have to pay a fee to access your personal data (or to exercise any of the other rights). However, we may charge a reasonable fee if your request is clearly unfounded, repetitive or excessive. Alternatively, we could refuse to comply with your request in these circumstances.</p>
            <p className="mb-3"><strong>10.10</strong> We may need to request specific information from you to help us confirm your identity and ensure your right to access your personal data (or to exercise any of your other rights). This is a security measure to ensure that personal data is not disclosed to any person who has no right to receive it. We may also contact you to ask you for further information in relation to your request to speed up our response.</p>
            <p><strong>10.11</strong> We try to respond to all legitimate requests within one month. Occasionally it could take us longer than a month if your request is particularly complex or you have made a number of requests. In this case, we will notify you and keep you updated.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">11. Contact details</h2>
            <p className="mb-3">If you have any questions about this privacy policy or about the use of your personal data or you want to exercise your privacy rights, please contact us in the following ways:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email address: <a href="mailto:reception@rebaserecovery.com" className="text-[#F9ECD9] underline underline-offset-4 hover:text-white transition-colors">reception@rebaserecovery.com</a></li>
              <li>Postal address: 1A St. Vincent Street, London, England, W1U 4DB</li>
              <li>Telephone number: <a href="tel:+442045535701" className="text-[#F9ECD9] underline underline-offset-4 hover:text-white transition-colors">020 4553 5701</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">12. Complaints</h2>
            <p>You have the right to make a complaint at any time to the Information Commissioner's Office (ICO), the UK regulator for data protection issues (<a href="https://www.ico.org.uk" target="_blank" rel="noreferrer" className="text-[#F9ECD9] underline underline-offset-4 hover:text-white transition-colors">www.ico.org.uk</a>). We would, however, appreciate the chance to deal with your concerns before you approach the ICO so please contact us in the first instance.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">13. Changes to the privacy policy and your duty to inform us of changes</h2>
            <p className="mb-3"><strong>13.1</strong> We keep our privacy policy under regular review.</p>
            <p><strong>13.2</strong> It is important that the personal data we hold about you is accurate and current. Please keep us informed if your personal data changes during your relationship with us.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#F9ECD9] mb-4">14. Third-party links</h2>
            <p>This website may include links to third-party websites, plug-ins and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements. When you leave our website, we encourage you to read the privacy policy of every website you visit.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
