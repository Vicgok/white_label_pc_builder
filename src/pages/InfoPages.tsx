import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useBrand } from "../config/brand";
import { brands } from "../config/brands";
import { BrandLink } from "../components/BrandLink";
import { useEnquiry } from "../components/Enquiry";
import { whatsappUrl } from "../domain/enquiry";
import { useNavigate } from "react-router-dom";
export function WhyUsPage() {
  const brand = useBrand();
  const topics = [
    [
      "A PC with a purpose.",
      "Start with your workload. Gaming, creation and everyday productivity ask different things of a PC. A custom configuration puts your budget where it matters.",
    ],
    [
      "Components that work together.",
      "Socket, memory, form factor, cooling and power checks help catch obvious mismatches. A retailer should also verify BIOS support, connectors and exact fit before assembly.",
    ],
    [
      "A clear assembly conversation.",
      "Ask your retailer about assembly, cable management and airflow. The final build should be tidy, serviceable and ready for future upgrades.",
    ],
    [
      "Testing before the handover.",
      "Discuss stress testing and quality control with your retailer, including temperatures, stability and memory checks. Confirm which tests are included in your quotation.",
    ],
    [
      "Support after the build.",
      "Confirm component warranty terms, manufacturer support and retailer service before placing an order. Keep your final configuration and invoices for future upgrades.",
    ],
  ];
  return (
    <div className="page-width information-page">
      <div className="page-intro">
        <span className="eyebrow">THE THINKING BEHIND THE BUILD</span>
        <h1>
          Every part has a role.
          <br />
          <span>Every choice has a reason.</span>
        </h1>
        <p>
          A better custom PC starts with understanding what you need, and
          balancing the system around it.
        </p>
      </div>
      <div className="brand-values">
        {brand.trustPoints.map((point) => (
          <span key={point}>{point}</span>
        ))}
      </div>
      <div className="editorial-topics">
        {topics.map(([title, description], index) => (
          <section key={title}>
            <span>0{index + 1}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </section>
        ))}
      </div>
      <BrandLink className="button primary" to="/builder">
        Start your build <ArrowUpRight size={17} />
      </BrandLink>
    </div>
  );
}
export function SupportPage() {
  const brand = useBrand();
  const { openHelp } = useEnquiry();
  const wa = whatsappUrl(
    brand,
    `Hi ${brand.name}, I'd like some advice about my PC.`,
  );
  const contacts = [
    {
      label: "WhatsApp",
      value: brand.contact.whatsapp,
      url: wa,
      Icon: MessageCircle,
    },
    {
      label: "Phone",
      value: brand.contact.phone,
      url: `tel:${brand.contact.phone}`,
      Icon: Phone,
    },
    {
      label: "Email",
      value: brand.contact.email,
      url: `mailto:${brand.contact.email}`,
      Icon: Mail,
    },
    {
      label: "Instagram",
      value: brand.contact.instagram,
      url: brand.contact.instagram?.startsWith("https://")
        ? brand.contact.instagram
        : `https://www.instagram.com/${brand.contact.instagram?.replace("@", "")}/`,
      Icon: ArrowUpRight,
    },
  ].filter((contact) => contact.value && contact.url);
  return (
    <div className="page-width information-page">
      <div className="page-intro">
        <span className="eyebrow">LET’S FIGURE IT OUT TOGETHER</span>
        <h1>
          A little guidance.
          <br />
          <span>A lot more confidence.</span>
        </h1>
        <p>
          From your first build to your next upgrade, start with a clear
          conversation.
        </p>
      </div>
      <div className="support-grid">
        {[
          [
            "Build Consultation",
            "A balanced starting point for your workload and budget.",
          ],
          [
            "Existing PC Upgrade",
            "Work out what to keep, and where an upgrade matters.",
          ],
          [
            "Troubleshooting",
            "Describe the symptoms and get advice on the next step.",
          ],
          [
            "Warranty Help",
            "Ask about component warranty terms and service options.",
          ],
          [
            "Component Advice",
            "Compare parts and talk through compatibility questions.",
          ],
        ].map(([title, description]) => (
          <button key={title} onClick={openHelp}>
            <h2>{title}</h2>
            <p>{description}</p>
            <ArrowUpRight size={19} />
          </button>
        ))}
      </div>
      <section className="support-contact">
        <h2>Talk to {brand.shortName}.</h2>
        {contacts.length ? (
          <div className="support-contact-links">
            {contacts.map(({ label, value, url, Icon }) => (
              <a
                key={label}
                href={url!}
                target={url!.startsWith("https") ? "_blank" : undefined}
                rel="noreferrer"
              >
                <Icon size={19} />
                <span>
                  <b>{label}</b>
                  <small>{value}</small>
                </span>
                <ArrowUpRight size={16} />
              </a>
            ))}
          </div>
        ) : (
          <>
            <p>
              Direct contact details will appear here when the retailer adds
              them. You can explore the consultation request in this preview.
            </p>
            <button className="button primary" onClick={openHelp}>
              Request a consultation <ArrowUpRight size={17} />
            </button>
          </>
        )}
        {brand.contact.address && (
          <p className="store-address">
            <MapPin size={17} />
            {brand.contact.address}
          </p>
        )}
        {!!brand.locations?.length && (
          <div className="store-locations">
            <h3>Visit Store</h3>
            {brand.locations.map((location) => (
              <div key={location.name}>
                <MapPin size={19} />
                <span>
                  <strong>{location.name}</strong>
                  <p>{location.address}</p>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
export function DemoPage() {
  const brand = useBrand();
  const navigate = useNavigate();
  return (
    <div className="page-width information-page">
      <div className="page-intro">
        <span className="eyebrow">DEVELOPMENT PREVIEW</span>
        <h1>
          One builder.
          <br />
          <span>Every brand.</span>
        </h1>
        <p>
          Switch the retailer to preview its wordmark, theme and copy. Contact
          fields are editable in the brand configuration.
        </p>
      </div>
      <div className="demo-brands">
        {Object.values(brands).map((item) => (
          <button
            className={item.id === brand.id ? "active" : ""}
            key={item.id}
            onClick={() => navigate(`/demo?brand=${item.id}`)}
          >
            <span style={{ background: item.theme.primary }} />
            <b>{item.name}</b>
            <small>{item.id}</small>
          </button>
        ))}
      </div>
      <BrandLink to="/" className="button primary">
        Preview homepage <ArrowUpRight size={17} />
      </BrandLink>
    </div>
  );
}
export function NotFoundPage() {
  return (
    <div className="page-width not-found">
      <span className="eyebrow">404 / A WRONG TURN</span>
      <h1>Let’s get back to building.</h1>
      <p>This page could not be found.</p>
      <BrandLink to="/" className="button primary">
        Back to home
      </BrandLink>
    </div>
  );
}
