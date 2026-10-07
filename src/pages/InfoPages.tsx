import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { productConfig } from "../config/product";
import { useEnquiry } from "../components/Enquiry";
import { Dialog } from "../components/ui";

export function HowItWorksPage() {
  return (
    <div className="page-width information-page">
      <div className="page-intro">
        <span className="eyebrow">HOW IT WORKS</span>
        <h1>A clearer path.<br /><span>A better balanced PC.</span></h1>
        <p>{productConfig.description}</p>
      </div>
      <div className="brand-values">{productConfig.trustPoints.map(point => <span key={point}>{point}</span>)}</div>
      <div className="editorial-topics">
        {productConfig.howItWorks.map((step, index) => (
          <section key={step.title} className={index === 3 ? 'preview-flow-step' : ''}><span>0{index + 1}</span><h2>{step.title}</h2><p>{step.description}</p>
            {index === 3 && <Link to="/builder?view=3d" className="button text">Explore in 3D <ArrowUpRight size={16} /></Link>}</section>
        ))}
      </div>
      <Link className="button primary" to="/builder">Start your build <ArrowUpRight size={17} /></Link>
    </div>
  );
}

export function SupportPage() {
  const { openHelp } = useEnquiry();
  return (
    <div className="page-width information-page">
      <div className="page-intro">
        <span className="eyebrow">BUILD WITH CONFIDENCE</span>
        <h1>A little guidance.<br /><span>A lot more confidence.</span></h1>
        <p>Find a starting point, understand compatibility checks, and take a clear configuration to the retailer of your choice.</p>
      </div>
      <div className="support-grid">
        {[
          ["Choose your starting point", "Use your workload and budget to explore a balanced recommendation."],
          ["Compare components", "Swap parts and review compatibility notices as you go."],
          ["Share your configuration", "Copy a parts list or share a link that opens the same build."],
        ].map(([title, description]) => (
          <button key={title} onClick={openHelp}><h2>{title}</h2><p>{description}</p><ArrowUpRight size={19} /></button>
        ))}
      </div>
      <section className="support-contact">
        <h2>Need help getting started?</h2>
        <p>{productConfig.name} helps you configure a PC. Your preferred retailer can confirm live pricing, availability, assembly and warranty terms.</p>
        <button className="button primary" onClick={openHelp}>Get Help <ArrowUpRight size={17} /></button>
      </section>
    </div>
  );
}

export function ForRetailersPage() {
  const [interest, setInterest] = useState(false);
  return (
    <div className="page-width information-page">
      <div className="page-intro">
        <span className="eyebrow">FOR RETAILERS</span>
        <h1>From a budget question.<br /><span>To a structured build.</span></h1>
        <p>Turn “What PC can I get for ₹1 lakh?” into a structured build with {productConfig.name}.</p>
      </div>
      <div className="brand-values">{["Guided enquiries", "Compatibility-aware configurations", "Structured leads", "Fewer repetitive component questions", "Shareable builds", "Faster quotation conversations"].map(value => <span key={value}>{value}</span>)}</div>
      <section className="support-contact">
        <h2>Interested in using {productConfig.name} for your store?</h2>
        <p>Explore how a guided configuration can give quotation conversations a clearer starting point.</p>
        <button className="button primary" onClick={() => setInterest(true)}>Explore the retailer demo <ArrowUpRight size={17} /></button>
      </section>
      {interest && <Dialog title="Explore the retailer demo" onClose={() => setInterest(false)}>
        <p className="dialog-intro">This prototype demonstrates the customer configuration flow. Build a PC, then copy or share its configuration to see how it can support a quotation conversation.</p>
        <Link className="button primary full" to="/builder" onClick={() => setInterest(false)}>Try the builder</Link>
      </Dialog>}
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="page-width not-found">
      <span className="eyebrow">404 / A WRONG TURN</span>
      <h1>Let’s get back to building.</h1><p>This page could not be found.</p>
      <Link to="/" className="button primary">Back to home</Link>
    </div>
  );
}
