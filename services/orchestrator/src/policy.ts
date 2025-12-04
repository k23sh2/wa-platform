export function routeIntent(input: string): { intent: string } {
    const q = input.toLowerCase();
    if (q.includes("price") || q.includes("quote")) return { intent: "QUOTE" };
    if (q.includes("sample")) return { intent: "SAMPLE" };
    if (q.includes("moq")) return { intent: "MOQ" };
    if (q.includes("shipping") || q.includes("delivery")) return { intent: "SHIPPING" };
    return { intent: "FAQ" };
  }
  
  export function respond(intent: string): string {
    switch (intent) {
      case "QUOTE":
        return "Please provide product SKU, quantity, and destination country/port for a basic quote.";
      case "SAMPLE":
        return "Share your shipping address and requested sample SKUs. We will process a sample request.";
      case "MOQ":
        return "General MOQ is 500 units per SKU. Exceptions may apply.";
      case "SHIPPING":
        return "Supported Incoterms: FOB/CIF/DDP. Typical lead time: 2–3 weeks after payment.";
      default:
        return "You can ask about MOQ, price quote, shipping terms, or sample requests.";
    }
  }
  