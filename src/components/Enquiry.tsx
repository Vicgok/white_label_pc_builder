import {
  createContext,
  useContext,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  Check,
  MessageCircle,
  Phone,
  Upload,
} from "lucide-react";
import { useBrand } from "../config/brand";
import { useBuilderStore, snapshot } from "../store/builderStore";
import { resolveParts } from "../data/components";
import { buildText, whatsappUrl } from "../domain/enquiry";
import { calculateBuildTotal, money } from "../domain/pricing";
import { validateBuild } from "../domain/compatibility";
import { categoryLabels } from "../utils/catalog";
import type { BuildSnapshot } from "../types";
import { Dialog } from "./ui";

type EnquiryMode =
  | { type: "quote"; build: BuildSnapshot }
  | { type: "help" }
  | { type: "configuration" }
  | null;
const EnquiryContext = createContext({
  openQuote: (_build?: BuildSnapshot) => {},
  openHelp: () => {},
  openConfiguration: () => {},
});
export const useEnquiry = () => useContext(EnquiryContext);
export function EnquiryProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<EnquiryMode>(null);
  return (
    <EnquiryContext.Provider
      value={{
        openQuote: (build) =>
          setMode({
            type: "quote",
            build: build || snapshot(useBuilderStore.getState()),
          }),
        openHelp: () => setMode({ type: "help" }),
        openConfiguration: () => setMode({ type: "configuration" }),
      }}
    >
      {children}
      {mode && (
        <EnquiryDialog
          key={mode.type}
          mode={mode}
          onClose={() => setMode(null)}
        />
      )}
    </EnquiryContext.Provider>
  );
}
function EnquiryDialog({
  mode,
  onClose,
}: {
  mode: NonNullable<EnquiryMode>;
  onClose: () => void;
}) {
  const brand = useBrand();
  const [success, setSuccess] = useState(false);
  const [configuration, setConfiguration] = useState("");
  const [file, setFile] = useState("");
  const [help, setHelp] = useState({
    budget: "100000",
    software: "",
    resolution: "1440p",
    peripherals: false,
  });
  const [details, setDetails] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
  });
  const quote = mode.type === "quote" ? mode.build : null;
  const validation = quote
    ? validateBuild(resolveParts(quote.selectedComponents))
    : null;
  const title = success
    ? "Request saved."
    : mode.type === "quote"
      ? "Your PC is ready."
      : mode.type === "help"
        ? "Let’s find your balance."
        : "Already have a configuration?";
  const message = quote
    ? buildText(quote, brand)
    : mode.type === "help"
      ? `Hi ${brand.name}, I'd like help choosing a PC.\nBudget: ${money(Number(help.budget))}\nGames / software: ${help.software}\nResolution: ${help.resolution}\nMonitor / peripherals needed: ${help.peripherals ? "Yes" : "No"}`
      : `Hi ${brand.name}, please quote this configuration:\n${configuration}${file ? "\nI will attach my screenshot in this chat." : ""}`;
  const wa = whatsappUrl(brand, message);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      localStorage.setItem(
        "pc-builder-last-request",
        JSON.stringify({
          type: mode.type,
          brandId: brand.id,
          details,
          message,
          file,
          createdAt: new Date().toISOString(),
        }),
      );
    } catch {
      /* Confirmation is intentionally a local prototype interaction. */
    }
    setSuccess(true);
  };
  return (
    <Dialog title={title} onClose={onClose}>
      {success ? (
        <div className="request-success">
          <span className="success-circle">
            <Check size={32} />
          </span>
          <h3>One step closer to your next PC.</h3>
          <p>
            This demo saved your request on this device. Nothing has been sent
            to the retailer.
          </p>
          {wa && (
            <a
              className="button primary"
              href={wa}
              target="_blank"
              rel="noreferrer"
            >
              Send to {brand.shortName} on WhatsApp <ArrowUpRight size={17} />
            </a>
          )}
          <button className="button secondary" onClick={onClose}>
            Continue exploring
          </button>
        </div>
      ) : (
        <>
          <p className="dialog-intro">
            {mode.type === "quote"
              ? "Review your configuration and request a final retailer quotation."
              : mode.type === "help"
                ? "Tell us a little about your plans. Get a clear starting point."
                : "Paste your parts list, or attach a screenshot for your quote request."}
          </p>
          {quote && (
            <div className="quote-preview">
              <div>
                <span className="eyebrow">{quote.buildId}</span>
                <strong>
                  {money(calculateBuildTotal(quote.selectedComponents))}
                </strong>
              </div>
              <ul>
                {Object.entries(resolveParts(quote.selectedComponents)).map(
                  ([key, part]) => (
                    <li key={key}>
                      <span>
                        {categoryLabels[key as keyof typeof categoryLabels]}
                      </span>
                      <b>{part.name}</b>
                    </li>
                  ),
                )}
              </ul>
              <small>
                Sample pricing · final price and availability to be confirmed
              </small>
              {validation &&
                (!validation.complete || validation.issues.length > 0) && (
                  <p className="warning-text">
                    This configuration needs review.{" "}
                    {validation.missing.length
                      ? `${validation.missing.length} parts still need selection. `
                      : ""}
                    {validation.issues.length
                      ? `${validation.issues.length} compatibility notices.`
                      : ""}
                  </p>
                )}
            </div>
          )}
          <form onSubmit={submit}>
            {mode.type === "configuration" && (
              <>
                <label>
                  Paste your PC configuration
                  <textarea
                    required={!file}
                    value={configuration}
                    onChange={(event) => setConfiguration(event.target.value)}
                    placeholder={"Ryzen 7 9700X\nRTX 5070\n32GB DDR5\n1TB NVMe"}
                    rows={5}
                  />
                </label>
                <label className="file-upload">
                  <Upload size={17} /> {file || "Upload Screenshot"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setFile(event.target.files?.[0]?.name || "")
                    }
                  />
                  <small>
                    Demo attachment: filename only, no upload or OCR
                  </small>
                </label>
              </>
            )}
            {mode.type === "help" && (
              <>
                <div className="form-grid">
                  <label>
                    Budget (₹)
                    <input
                      type="number"
                      min="10000"
                      max="1000000"
                      required
                      value={help.budget}
                      onChange={(event) =>
                        setHelp({ ...help, budget: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Resolution
                    <select
                      value={help.resolution}
                      onChange={(event) =>
                        setHelp({ ...help, resolution: event.target.value })
                      }
                    >
                      <option>1080p</option>
                      <option>1440p</option>
                      <option>4K</option>
                    </select>
                  </label>
                </div>
                <label>
                  Games or software
                  <input
                    required
                    value={help.software}
                    onChange={(event) =>
                      setHelp({ ...help, software: event.target.value })
                    }
                    placeholder="e.g. Valorant, Premiere Pro, Blender"
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={help.peripherals}
                    onChange={(event) =>
                      setHelp({ ...help, peripherals: event.target.checked })
                    }
                  />{" "}
                  Include monitor / peripherals advice
                </label>
              </>
            )}
            <div className="form-grid">
              <label>
                Name
                <input
                  autoComplete="name"
                  required
                  value={details.name}
                  onChange={(event) =>
                    setDetails({ ...details, name: event.target.value })
                  }
                  placeholder="Your name"
                />
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  autoComplete="tel"
                  required
                  pattern="[+0-9 ()\-]{7,20}"
                  value={details.phone}
                  onChange={(event) =>
                    setDetails({ ...details, phone: event.target.value })
                  }
                  placeholder="Your phone number"
                />
              </label>
              <label>
                Email <small>(optional)</small>
                <input
                  type="email"
                  autoComplete="email"
                  value={details.email}
                  onChange={(event) =>
                    setDetails({ ...details, email: event.target.value })
                  }
                  placeholder="you@example.com"
                />
              </label>
              <label>
                City
                <input
                  required
                  autoComplete="address-level2"
                  value={details.city}
                  onChange={(event) =>
                    setDetails({ ...details, city: event.target.value })
                  }
                  placeholder="Your city"
                />
              </label>
            </div>
            <button className="button primary full" type="submit">
              {mode.type === "help" ? "Request Callback" : "Send Build Request"}{" "}
              <ArrowUpRight size={17} />
            </button>
            <p className="form-note">
              Prototype request · saved locally, with no backend submission
            </p>
          </form>
          {(wa || brand.contact.phone) && (
            <div className="contact-actions">
              {wa && (
                <a
                  className="button secondary"
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={17} />
                  {quote ? "Order via WhatsApp" : "WhatsApp an Expert"}
                </a>
              )}
              {brand.contact.phone && (
                <a href={`tel:${brand.contact.phone}`} className="button text">
                  <Phone size={16} />
                  Talk to an expert
                </a>
              )}
            </div>
          )}
        </>
      )}
    </Dialog>
  );
}
