import { Navigate } from "react-router-dom";

/** Legacy /faq URL — FAQs live on the contact page. */
const FAQ = () => <Navigate to="/contact#faqs" replace />;

export default FAQ;
